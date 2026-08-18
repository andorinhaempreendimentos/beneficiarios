import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Paginated, QP } from './services';

async function getSupabase() {
  if (typeof window === 'undefined') {
    try {
      const cookieStore = await require('next/headers').cookies();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrzszjogxrrjqjkoowoi.supabase.co';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
      return createServerClient(url, key, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
      });
    } catch { return createBrowserClient(); }
  }
  return createBrowserClient();
}
function createClient() { return createBrowserClient(); }
function paginar(page?: number, limit?: number) {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? limit : 15;
  return { page: p, limit: l, from: (p - 1) * l, to: (p - 1) * l + l - 1 };
}
function num(v: unknown): number | undefined {
  const n = Number(v);
  return v !== undefined && v !== '' && !Number.isNaN(n) ? n : undefined;
}

export type TipoPendencia = 'estrutura' | 'material' | 'professor' | 'beneficiario' | 'outro';
export type GravidadePendencia = 'baixa' | 'media' | 'alta' | 'critica';
export type StatusPendencia = 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada';

export type PendenciaGeralApi = {
  id: string;
  supervisaoId: string | null;
  nucleoId: string;
  tipo: TipoPendencia;
  titulo: string;
  descricao: string;
  gravidade: GravidadePendencia;
  responsavelId: string | null;
  prazo: string | null;
  status: StatusPendencia;
  providencias: string | null;
  dataResolucao: string | null;
  resolvidoPorId: string | null;
  observacoesResolucao: string | null;
  createdById: string;
  nucleo?: { identificacao: string };
  responsavel?: { nome: string };
  criadoEm: string;
  atualizadoEm: string;
};

function mapPendencia(r: any): PendenciaGeralApi {
  return {
    id: r.id, supervisaoId: r.supervisao_id ?? null, nucleoId: r.nucleo_id, tipo: r.tipo,
    titulo: r.titulo, descricao: r.descricao, gravidade: r.gravidade,
    responsavelId: r.responsavel_id ?? null, prazo: r.prazo ?? null, status: r.status,
    providencias: r.providencias ?? null, dataResolucao: r.data_resolucao ?? null,
    resolvidoPorId: r.resolvido_por_id ?? null, observacoesResolucao: r.observacoes_resolucao ?? null,
    createdById: r.created_by_id,
    nucleo: r.nucleos ? { identificacao: r.nucleos.identificacao } : undefined,
    responsavel: r.funcionarios ? { nome: r.funcionarios.nome } : undefined,
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
  };
}

export const pendenciasGeraisApi = {
  async list(p?: QP): Promise<Paginated<PendenciaGeralApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = (sb as any).from('pendencias_gerais')
      .select('*, nucleos(identificacao), funcionarios!pendencias_gerais_responsavel_id_fkey(nome)', { count: 'exact' })
      .is('deleted_at', null);
    if (p?.nucleoId) q = q.eq('nucleo_id', p.nucleoId as string);
    if (p?.status) q = q.eq('status', p.status as string);
    if (p?.gravidade) q = q.eq('gravidade', p.gravidade as string);
    if (p?.tipo) q = q.eq('tipo', p.tipo as string);
    if (p?.responsavelId) q = q.eq('responsavel_id', p.responsavelId as string);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapPendencia), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<PendenciaGeralApi> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('pendencias_gerais')
      .select('*, nucleos(identificacao), funcionarios!pendencias_gerais_responsavel_id_fkey(nome)')
      .eq('id', id).single();
    if (error) throw error;
    return mapPendencia(data);
  },
  async create(body: Record<string, unknown>): Promise<PendenciaGeralApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('pendencias_gerais').insert({
      supervisao_id: body.supervisaoId ?? null, nucleo_id: body.nucleoId, tipo: body.tipo,
      titulo: body.titulo, descricao: body.descricao, gravidade: body.gravidade,
      responsavel_id: body.responsavelId ?? null, prazo: body.prazo ?? null,
      created_by_id: body.createdById,
    }).select('*, nucleos(identificacao)').single();
    if (error) throw error;
    return mapPendencia(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<PendenciaGeralApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('pendencias_gerais').update({
      titulo: body.titulo, descricao: body.descricao, gravidade: body.gravidade,
      responsavel_id: body.responsavelId ?? null, prazo: body.prazo ?? null,
      status: body.status, providencias: body.providencias ?? null,
    }).eq('id', id).select('*, nucleos(identificacao)').single();
    if (error) throw error;
    return mapPendencia(data);
  },
  async resolver(id: string, body: { providencias: string; resolvidoPorId: string; observacoesResolucao?: string }): Promise<PendenciaGeralApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('pendencias_gerais').update({
      status: 'resolvida', providencias: body.providencias,
      data_resolucao: new Date().toISOString(), resolvido_por_id: body.resolvidoPorId,
      observacoes_resolucao: body.observacoesResolucao ?? null,
    }).eq('id', id).select('*, nucleos(identificacao)').single();
    if (error) throw error;
    return mapPendencia(data);
  },
  async atribuir(id: string, responsavelId: string): Promise<PendenciaGeralApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('pendencias_gerais')
      .update({ responsavel_id: responsavelId, status: 'em_andamento' })
      .eq('id', id).select('*, nucleos(identificacao)').single();
    if (error) throw error;
    return mapPendencia(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await (sb as any).from('pendencias_gerais').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
