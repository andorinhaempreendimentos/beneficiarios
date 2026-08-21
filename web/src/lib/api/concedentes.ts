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

export interface ConcedenteApi {
  id: string;
  nome: string;
  cnpj?: string;
  esfera: 'municipal' | 'estadual' | 'federal';
  cidade?: string;
  estado?: string;
  responsavelNome?: string;
  responsavelCargo?: string;
  telefone?: string;
  email?: string;
  criadoEm: string;
}

function mapConcedente(r: any): ConcedenteApi {
  return {
    id: r.id,
    nome: r.nome,
    cnpj: r.cnpj ?? undefined,
    esfera: r.esfera ?? 'municipal',
    cidade: r.cidade ?? undefined,
    estado: r.estado ?? undefined,
    responsavelNome: r.responsavel_nome ?? undefined,
    responsavelCargo: r.responsavel_cargo ?? undefined,
    telefone: r.telefone ?? undefined,
    email: r.email ?? undefined,
    criadoEm: r.created_at,
  };
}

function toConcedenteRow(b: Partial<ConcedenteApi>): Database['public']['Tables']['concedentes']['Insert'] {
  return {
    nome: String(b.nome ?? ''),
    cnpj: b.cnpj ?? null,
    esfera: (b.esfera as string) ?? 'municipal',
    cidade: b.cidade ?? null,
    estado: b.estado ?? null,
    responsavel_nome: b.responsavelNome ?? null,
    responsavel_cargo: b.responsavelCargo ?? null,
    telefone: b.telefone ?? null,
    email: b.email ?? null,
  };
}

export const concedentesApi = {
  async list(p?: QP): Promise<Paginated<ConcedenteApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('concedentes').select('*', { count: 'exact' }).is('deleted_at', null);

    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.esfera) q = q.eq('esfera', String(p.esfera));

    const { data, count, error } = await q.order('nome', { ascending: true }).range(from, to);
    if (error) throw error;

    return {
      data: (data ?? []).map(mapConcedente),
      total: count ?? 0,
      page,
      limit,
    };
  },

  async get(id: string): Promise<ConcedenteApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('concedentes').select('*').eq('id', id).single();
    if (error) throw error;
    return mapConcedente(data);
  },

  async create(body: Partial<ConcedenteApi>): Promise<ConcedenteApi> {
    const sb = createClient();
    const { data, error } = await sb.from('concedentes').insert(toConcedenteRow(body)).select('*').single();
    if (error) throw error;
    return mapConcedente(data);
  },

  async update(id: string, body: Partial<ConcedenteApi>): Promise<ConcedenteApi> {
    const sb = createClient();
    const { data, error } = await sb.from('concedentes').update(toConcedenteRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapConcedente(data);
  },

  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('concedentes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
