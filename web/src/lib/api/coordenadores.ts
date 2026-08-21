import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Paginated, NucleoApi } from './services';

// helpers duplicados (evitar import circular)
async function getSupabase() {
  if (typeof window === 'undefined') {
    try {
      const cookieStore = await require('next/headers').cookies();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrzszjogxrrjqjkoowoi.supabase.co';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
      return createServerClient(url, key, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
      });
    } catch {
      return createBrowserClient();
    }
  }
  return createBrowserClient();
}
function createClient() { return createBrowserClient(); }
function paginar(page?: number, limit?: number) {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? limit : 20;
  const from = (p - 1) * l;
  const to = from + l - 1;
  return { page: p, limit: l, from, to };
}

const PERFIL_COORDENADOR = '1bea5f77-95ef-4969-bf87-4cd4647f6c0a';

export interface CoordenadorApi {
  id: string;
  nomeCompleto: string;
  email?: string;
  status: string;
  celular?: string;
  fotoUrl?: string;
  nucleos: NucleoApi[];
}

export interface VinculoNucleoApi {
  coordenadorId: string;
  nucleoId: string;
  ativo: boolean;
  criadoEm: string;
  nucleo?: NucleoApi;
}

function mapNucleo(r: any): NucleoApi {
  return {
    id: r.id,
    identificacao: r.identificacao,
    nomeLocal: r.nome_local,
    endereco: r.endereco,
    numero: r.numero,
    bairro: r.bairro,
    cidade: r.cidade,
    estado: r.estado,
    cep: r.cep,
    status: r.status,
    organizacaoId: r.organizacao_id,
    organizacao: r.organizacao,
    createdAt: r.created_at,
    dataInicio: r.data_inicio,
    emFuncionamento: r.em_funcionamento ?? true,
    disponivelPreInscricao: r.disponivel_pre_inscricao ?? false,
    criadoEm: r.created_at,
  } as unknown as NucleoApi;
}

function mapCoordenador(r: any): CoordenadorApi {
  return {
    id: r.id,
    nomeCompleto: r.nome_completo,
    email: r.email,
    status: r.status,
    celular: r.celular,
    fotoUrl: r.foto_url,
    nucleos: (r.coordenador_nucleos ?? [])
      .filter((cn: any) => cn.ativo && cn.nucleo)
      .map((cn: any) => mapNucleo(cn.nucleo)),
  };
}

function mapVinculo(r: any): VinculoNucleoApi {
  return {
    coordenadorId: r.coordenador_id,
    nucleoId: r.nucleo_id,
    ativo: r.ativo,
    criadoEm: r.created_at,
    nucleo: r.nucleo ? mapNucleo(r.nucleo) : undefined,
  };
}

const db = (sb: any) => sb as any;

export const coordenadoresApi = {
  async list(p?: { page?: number; limit?: number }): Promise<Paginated<CoordenadorApi>> {
    const supabase = await getSupabase();
    const { page, limit, from, to } = paginar(p?.page, p?.limit);
    const { data: usuarios, error: uErr, count } = await db(supabase)
      .from('usuarios')
      .select('entidade_id', { count: 'exact' })
      .eq('perfil_id', PERFIL_COORDENADOR)
      .is('deleted_at', null)
      .not('entidade_id', 'is', null)
      .range(from, to);
    if (uErr) throw uErr;
    if (!usuarios || usuarios.length === 0) {
      return { data: [], total: count ?? 0, page, limit };
    }
    const ids = usuarios.map((u: any) => u.entidade_id);
    const { data: funcs, error: fErr } = await db(supabase)
      .from('funcionarios')
      .select(`
        id, nome_completo, email, status, celular, foto_url,
        coordenador_nucleos(
          nucleo_id, ativo,
          nucleo:nucleos(id, identificacao, nome_local, cidade, estado)
        )
      `)
      .in('id', ids)
      .is('deleted_at', null);
    if (fErr) throw fErr;
    return { data: (funcs ?? []).map(mapCoordenador), total: count ?? 0, page, limit };
  },

  async get(id: string): Promise<CoordenadorApi> {
    const supabase = await getSupabase();
    const { data, error } = await db(supabase)
      .from('funcionarios')
      .select(`
        id, nome_completo, email, status, celular, foto_url,
        coordenador_nucleos(
          nucleo_id, ativo, created_at,
          nucleo:nucleos(id, identificacao, nome_local, endereco, numero, bairro, cidade, estado, cep, em_funcionamento, organizacao_id)
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return mapCoordenador(data);
  },


  async getNucleos(coordenadorId: string): Promise<VinculoNucleoApi[]> {
    const supabase = await getSupabase();
    const { data, error } = await db(supabase)
      .from('coordenador_nucleos')
      .select('nucleo_id, ativo, created_at, nucleo:nucleos(id, identificacao, nome_local, cidade, estado)')
      .eq('coordenador_id', coordenadorId)
      .eq('ativo', true);
    if (error) throw error;
    return (data ?? []).map(mapVinculo);
  },

  async vincular(coordenadorId: string, nucleoId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await db(supabase)
      .from('coordenador_nucleos')
      .upsert({ coordenador_id: coordenadorId, nucleo_id: nucleoId, ativo: true });
    if (error) throw error;
  },

  async desvincular(coordenadorId: string, nucleoId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await db(supabase)
      .from('coordenador_nucleos')
      .delete()
      .eq('coordenador_id', coordenadorId)
      .eq('nucleo_id', nucleoId);
    if (error) throw error;
  },

  async getMeusNucleos(): Promise<NucleoApi[]> {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: usuario } = await db(supabase)
      .from('usuarios')
      .select('entidade_id')
      .eq('id', user.id)
      .single();
    if (!usuario?.entidade_id) return [];
    const vinculos = await coordenadoresApi.getNucleos(usuario.entidade_id);
    return vinculos.map((v) => v.nucleo).filter(Boolean) as NucleoApi[];
  },
};
