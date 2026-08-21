import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { Paginated, QP } from './services';

async function getSupabase() {
  if (typeof window === 'undefined') {
    try {
      const cookieStore = await require('next/headers').cookies();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrzszjogxrrjqjkoowoi.supabase.co';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
      return createServerClient<Database>(url, key, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
      });
    } catch {
      return createBrowserClient();
    }
  }
  return createBrowserClient();
}

function createClient() {
  return createBrowserClient();
}

function paginar(page?: number, limit?: number) {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? limit : 20;
  const from = (p - 1) * l;
  const to = from + l - 1;
  return { page: p, limit: l, from, to };
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return v !== undefined && v !== '' && !Number.isNaN(n) ? n : undefined;
}

export type TipoAtividadeComplementar =
  | 'evento_esportivo'
  | 'reuniao_familia'
  | 'capacitacao'
  | 'oficina_socioeducativa'
  | 'outro';

export interface AtividadeComplementarApi {
  id: string;
  objetoId: string;
  nucleoId?: string;
  nucleoNome?: string;
  tipo: TipoAtividadeComplementar;
  titulo: string;
  descricao?: string;
  data: string;
  horarioInicio?: string;
  horarioFim?: string;
  responsavelId?: string;
  responsavelNome?: string;
  quantidadeParticipantes: number;
  fotosUrls: string[];
  criadoEm: string;
}

function mapAtividadeComplementar(r: any): AtividadeComplementarApi {
  return {
    id: r.id,
    objetoId: r.objeto_id,
    nucleoId: r.nucleo_id ?? undefined,
    nucleoNome: r.nucleos?.identificacao ?? undefined,
    tipo: r.tipo as TipoAtividadeComplementar,
    titulo: r.titulo,
    descricao: r.descricao ?? undefined,
    data: r.data,
    horarioInicio: r.horario_inicio ?? undefined,
    horarioFim: r.horario_fim ?? undefined,
    responsavelId: r.responsavel_id ?? undefined,
    responsavelNome: r.funcionarios?.nome_completo ?? undefined,
    quantidadeParticipantes: r.quantidade_participantes ?? 0,
    fotosUrls: r.fotos_urls ?? [],
    criadoEm: r.created_at,
  };
}

function toAtividadeComplementarRow(b: Partial<AtividadeComplementarApi>): Database['public']['Tables']['atividades_complementares']['Insert'] {
  return {
    objeto_id: b.objetoId!,
    nucleo_id: b.nucleoId || null,
    tipo: b.tipo || 'outro',
    titulo: String(b.titulo ?? ''),
    descricao: b.descricao ?? null,
    data: b.data || new Date().toISOString().split('T')[0],
    horario_inicio: b.horarioInicio ?? null,
    horario_fim: b.horarioFim ?? null,
    responsavel_id: b.responsavelId || null,
    quantidade_participantes: b.quantidadeParticipantes ?? 0,
    fotos_urls: b.fotosUrls ?? [],
  };
}

export const atividadesComplementaresApi = {
  async list(p?: QP): Promise<Paginated<AtividadeComplementarApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb
      .from('atividades_complementares')
      .select('*, nucleos(identificacao), funcionarios(nome_completo)', { count: 'exact' })
      .is('deleted_at', null);

    if (p?.objetoId) q = q.eq('objeto_id', String(p.objetoId));
    if (p?.nucleoId) q = q.eq('nucleo_id', String(p.nucleoId));
    if (p?.tipo) q = q.eq('tipo', String(p.tipo));
    if (p?.dataInicio) q = q.gte('data', String(p.dataInicio));
    if (p?.dataFim) q = q.lte('data', String(p.dataFim));
    if (p?.busca) q = q.ilike('titulo', `%${p.busca}%`);

    const { data, count, error } = await q.order('data', { ascending: false }).range(from, to);
    if (error) throw error;

    return {
      data: (data ?? []).map(mapAtividadeComplementar),
      total: count ?? 0,
      page,
      limit,
    };
  },

  async get(id: string): Promise<AtividadeComplementarApi> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('atividades_complementares')
      .select('*, nucleos(identificacao), funcionarios(nome_completo)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapAtividadeComplementar(data);
  },

  async create(body: Partial<AtividadeComplementarApi>): Promise<AtividadeComplementarApi> {
    const sb = createClient();
    const { data, error } = await sb
      .from('atividades_complementares')
      .insert(toAtividadeComplementarRow(body))
      .select('*, nucleos(identificacao), funcionarios(nome_completo)')
      .single();
    if (error) throw error;
    return mapAtividadeComplementar(data);
  },

  async update(id: string, body: Partial<AtividadeComplementarApi>): Promise<AtividadeComplementarApi> {
    const sb = createClient();
    const { data, error } = await sb
      .from('atividades_complementares')
      .update(toAtividadeComplementarRow(body))
      .eq('id', id)
      .select('*, nucleos(identificacao), funcionarios(nome_completo)')
      .single();
    if (error) throw error;
    return mapAtividadeComplementar(data);
  },

  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb
      .from('atividades_complementares')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async uploadFoto(file: File): Promise<string> {
    const sb = createClient();
    const ext = file.name.split('.').pop();
    const path = `atividades-complementares/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data, error } = await sb.storage.from('supervisao-fotos').upload(path, file, { upsert: true });
    if (error) throw error;
    return sb.storage.from('supervisao-fotos').getPublicUrl(data.path).data.publicUrl;
  },
};
