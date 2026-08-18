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

export type AvaliacaoNivel = 'otima' | 'boa' | 'regular' | 'ruim' | 'critica';

export type SupervisaoFotoApi = {
  id: string;
  supervisaoId: string;
  categoria: 'espaco' | 'material' | 'equipe' | 'atividade';
  url: string;
  legenda: string | null;
  ordem: number;
  criadoEm: string;
};

export type SupervisaoApi = {
  id: string;
  nucleoId: string;
  coordenadorId: string;
  dataSupervisao: string;
  horaEntrada: string;
  horaSaida: string | null;
  beneficiariosPresentes: number | null;
  beneficiariosEsperados: number | null;
  professorPresente: boolean | null;
  professoresIds: string[] | null;
  estruturaAvaliacao: AvaliacaoNivel | null;
  estruturaObservacoes: string | null;
  materiaisAvaliacao: AvaliacaoNivel | null;
  materiaisObservacoes: string | null;
  uniformesAvaliacao: AvaliacaoNivel | null;
  uniformesObservacoes: string | null;
  gradeCumprida: boolean | null;
  gradeObservacoes: string | null;
  observacoesGerais: string | null;
  status: 'rascunho' | 'finalizada';
  fotos?: SupervisaoFotoApi[];
  nucleo?: { identificacao: string };
  coordenador?: { nome: string };
  criadoEm: string;
  atualizadoEm: string;
};

function mapFoto(r: any): SupervisaoFotoApi {
  return { id: r.id, supervisaoId: r.supervisao_id, categoria: r.categoria, url: r.url, legenda: r.legenda ?? null, ordem: r.ordem, criadoEm: r.created_at };
}

function mapSupervisao(r: any): SupervisaoApi {
  return {
    id: r.id, nucleoId: r.nucleo_id, coordenadorId: r.coordenador_id,
    dataSupervisao: r.data_supervisao, horaEntrada: r.hora_entrada, horaSaida: r.hora_saida ?? null,
    beneficiariosPresentes: r.beneficiarios_presentes ?? null, beneficiariosEsperados: r.beneficiarios_esperados ?? null,
    professorPresente: r.professor_presente ?? null, professoresIds: r.professores_ids ?? null,
    estruturaAvaliacao: r.estrutura_avaliacao ?? null, estruturaObservacoes: r.estrutura_observacoes ?? null,
    materiaisAvaliacao: r.materiais_avaliacao ?? null, materiaisObservacoes: r.materiais_observacoes ?? null,
    uniformesAvaliacao: r.uniformes_avaliacao ?? null, uniformesObservacoes: r.uniformes_observacoes ?? null,
    gradeCumprida: r.grade_cumprida ?? null, gradeObservacoes: r.grade_observacoes ?? null,
    observacoesGerais: r.observacoes_gerais ?? null, status: r.status,
    fotos: r.supervisoes_fotos ? r.supervisoes_fotos.map(mapFoto) : undefined,
    nucleo: r.nucleos ? { identificacao: r.nucleos.identificacao } : undefined,
    coordenador: r.funcionarios ? { nome: r.funcionarios.nome } : undefined,
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
  };
}

export const supervisoesApi = {
  async list(p?: QP): Promise<Paginated<SupervisaoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = (sb as any).from('supervisoes')
      .select('*, nucleos(identificacao), funcionarios(nome)', { count: 'exact' })
      .is('deleted_at', null);
    if (p?.nucleoId) q = q.eq('nucleo_id', p.nucleoId as string);
    if (p?.coordenadorId) q = q.eq('coordenador_id', p.coordenadorId as string);
    if (p?.status) q = q.eq('status', p.status as string);
    if (p?.dataInicio) q = q.gte('data_supervisao', p.dataInicio as string);
    if (p?.dataFim) q = q.lte('data_supervisao', p.dataFim as string);
    const { data, count, error } = await q.order('data_supervisao', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapSupervisao), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<SupervisaoApi> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('supervisoes')
      .select('*, nucleos(identificacao), funcionarios(nome), supervisoes_fotos(*)')
      .eq('id', id).single();
    if (error) throw error;
    return mapSupervisao(data);
  },
  async create(body: Record<string, unknown>): Promise<SupervisaoApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('supervisoes').insert({
      nucleo_id: body.nucleoId, coordenador_id: body.coordenadorId,
      data_supervisao: body.dataSupervisao, hora_entrada: body.horaEntrada,
      hora_saida: body.horaSaida ?? null, beneficiarios_presentes: body.beneficiariosPresentes ?? null,
      beneficiarios_esperados: body.beneficiariosEsperados ?? null, professor_presente: body.professorPresente ?? null,
      professores_ids: body.professoresIds ?? null, estrutura_avaliacao: body.estruturaAvaliacao ?? null,
      estrutura_observacoes: body.estruturaObservacoes ?? null, materiais_avaliacao: body.materiaisAvaliacao ?? null,
      materiais_observacoes: body.materiaisObservacoes ?? null, uniformes_avaliacao: body.uniformesAvaliacao ?? null,
      uniformes_observacoes: body.uniformesObservacoes ?? null, grade_cumprida: body.gradeCumprida ?? null,
      grade_observacoes: body.gradeObservacoes ?? null, observacoes_gerais: body.observacoesGerais ?? null,
      status: 'rascunho',
    }).select('*, nucleos(identificacao), funcionarios(nome)').single();
    if (error) throw error;
    return mapSupervisao(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<SupervisaoApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('supervisoes').update({
      hora_saida: body.horaSaida ?? null, beneficiarios_presentes: body.beneficiariosPresentes ?? null,
      beneficiarios_esperados: body.beneficiariosEsperados ?? null, professor_presente: body.professorPresente ?? null,
      professores_ids: body.professoresIds ?? null, estrutura_avaliacao: body.estruturaAvaliacao ?? null,
      estrutura_observacoes: body.estruturaObservacoes ?? null, materiais_avaliacao: body.materiaisAvaliacao ?? null,
      materiais_observacoes: body.materiaisObservacoes ?? null, uniformes_avaliacao: body.uniformesAvaliacao ?? null,
      uniformes_observacoes: body.uniformesObservacoes ?? null, grade_cumprida: body.gradeCumprida ?? null,
      grade_observacoes: body.gradeObservacoes ?? null, observacoes_gerais: body.observacoesGerais ?? null,
    }).eq('id', id).select('*, nucleos(identificacao), funcionarios(nome)').single();
    if (error) throw error;
    return mapSupervisao(data);
  },
  async finalizar(id: string): Promise<SupervisaoApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('supervisoes')
      .update({ status: 'finalizada' }).eq('id', id)
      .select('*, nucleos(identificacao), funcionarios(nome)').single();
    if (error) throw error;
    return mapSupervisao(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await (sb as any).from('supervisoes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

export const supervisoesFotosApi = {
  async upload(supervisaoId: string, file: File, categoria: SupervisaoFotoApi['categoria'], legenda?: string): Promise<SupervisaoFotoApi> {
    const sb = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `supervisoes/${supervisaoId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data: sd, error: se } = await (sb as any).storage.from('supervisao-fotos').upload(path, file, { upsert: true, contentType: file.type });
    if (se) throw se;
    const url = (sb as any).storage.from('supervisao-fotos').getPublicUrl(sd.path).data.publicUrl;
    const { data, error } = await (sb as any).from('supervisoes_fotos')
      .insert({ supervisao_id: supervisaoId, categoria, url, legenda: legenda ?? null, ordem: 0 })
      .select('*').single();
    if (error) throw error;
    return mapFoto(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await (sb as any).from('supervisoes_fotos').delete().eq('id', id);
    if (error) throw error;
  },
};
