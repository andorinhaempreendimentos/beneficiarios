import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Paginated, QP } from './services';

// ── helpers duplicados (evitar import circular) ──────────────────
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
  const l = limit && limit > 0 ? limit : 15;
  const from = (p - 1) * l;
  const to = from + l - 1;
  return { page: p, limit: l, from, to };
}
function num(v: unknown): number | undefined {
  const n = Number(v);
  return v !== undefined && v !== '' && !Number.isNaN(n) ? n : undefined;
}
function bool(v: unknown): boolean | undefined {
  if (v === undefined || v === '') return undefined;
  return v === true || v === 'true';
}
// ────────────────────────────────────────────────────────────────

export type MaterialApi = {
  id: string;
  nome: string;
  descricao: string | null;
  unidadeMedida: string;
  estoqueMinimo: number;
  fotoUrl: string | null;
  categoria: string;
  ativo: boolean;
  criadoEm: string;
};

export type EstoqueNucleoApi = {
  materialId: string;
  nucleoId: string;
  quantidadeAtual: number;
  localizacao: string | null;
  material?: MaterialApi;
  nucleo?: { identificacao: string };
};

export type MovimentacaoEstoqueApi = {
  id: string;
  materialId: string;
  nucleoId: string;
  tipo: 'entrada' | 'saida' | 'transferencia' | 'perda' | 'dano';
  quantidade: number;
  quantidadeAnterior: number;
  quantidadePosterior: number;
  responsavelId: string;
  beneficiarioId: string | null;
  destinoNucleoId: string | null;
  motivo: string | null;
  observacoes: string | null;
  termoAssinado: boolean;
  fotoComprovanteUrl: string | null;
  dataMovimentacao: string;
  criadoEm: string;
  material?: { nome: string; unidadeMedida: string };
  nucleo?: { identificacao: string };
  responsavel?: { nome: string };
};

export type TermoEntregaApi = {
  id: string;
  movimentacaoId: string;
  recebedorTipo: 'funcionario' | 'beneficiario';
  recebedorId: string;
  entregadorId: string;
  dataEntrega: string;
  dataDevolucaoPrev: string | null;
  dataDevolucaoReal: string | null;
  status: 'pendente' | 'entregue' | 'devolvido' | 'atrasado';
  assinaturaUrl: string | null;
  observacoes: string | null;
  criadoEm: string;
};

function mapMaterial(r: any): MaterialApi {
  return {
    id: r.id, nome: r.nome, descricao: r.descricao ?? null,
    unidadeMedida: r.unidade_medida, estoqueMinimo: r.estoque_minimo,
    fotoUrl: r.foto_url ?? null, categoria: r.categoria, ativo: r.ativo, criadoEm: r.created_at,
  };
}
function toMaterialRow(b: Record<string, unknown>) {
  return {
    nome: b.nome as string,
    descricao: (b.descricao as string | null) ?? null,
    unidade_medida: b.unidadeMedida as string,
    estoque_minimo: (b.estoqueMinimo as number) ?? 0,
    foto_url: (b.fotoUrl as string | null) ?? null,
    categoria: b.categoria as string,
    ativo: (b.ativo as boolean) ?? true,
  };
}
function mapMovimentacao(r: any): MovimentacaoEstoqueApi {
  return {
    id: r.id, materialId: r.material_id, nucleoId: r.nucleo_id, tipo: r.tipo,
    quantidade: r.quantidade, quantidadeAnterior: r.quantidade_anterior, quantidadePosterior: r.quantidade_posterior,
    responsavelId: r.responsavel_id, beneficiarioId: r.beneficiario_id ?? null,
    destinoNucleoId: r.destino_nucleo_id ?? null, motivo: r.motivo ?? null,
    observacoes: r.observacoes ?? null, termoAssinado: r.termo_assinado,
    fotoComprovanteUrl: r.foto_comprovante_url ?? null, dataMovimentacao: r.data_movimentacao, criadoEm: r.created_at,
    material: r.materiais ? { nome: r.materiais.nome, unidadeMedida: r.materiais.unidade_medida } : undefined,
    nucleo: r.nucleos ? { identificacao: r.nucleos.identificacao } : undefined,
    responsavel: r.funcionarios ? { nome: r.funcionarios.nome } : undefined,
  };
}
function mapTermoEntrega(r: any): TermoEntregaApi {
  return {
    id: r.id, movimentacaoId: r.movimentacao_id, recebedorTipo: r.recebedor_tipo,
    recebedorId: r.recebedor_id, entregadorId: r.entregador_id, dataEntrega: r.data_entrega,
    dataDevolucaoPrev: r.data_devolucao_prev ?? null, dataDevolucaoReal: r.data_devolucao_real ?? null,
    status: r.status, assinaturaUrl: r.assinatura_url ?? null, observacoes: r.observacoes ?? null, criadoEm: r.created_at,
  };
}

export const materiaisApi = {
  async list(p?: QP): Promise<Paginated<MaterialApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = (sb as any).from('materiais').select('*', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.categoria) q = q.eq('categoria', p.categoria as string);
    if (bool(p?.ativo) !== undefined) q = q.eq('ativo', bool(p?.ativo)!);
    const { data, count, error } = await q.order('nome', { ascending: true }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapMaterial), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<MaterialApi> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('materiais').select('*').eq('id', id).single();
    if (error) throw error;
    return mapMaterial(data);
  },
  async create(body: Record<string, unknown>): Promise<MaterialApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('materiais').insert(toMaterialRow(body)).select('*').single();
    if (error) throw error;
    return mapMaterial(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<MaterialApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('materiais').update(toMaterialRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapMaterial(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await (sb as any).from('materiais').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
  async uploadFoto(file: File): Promise<string> {
    const sb = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `materiais/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data, error } = await (sb as any).storage.from('supervisao-fotos').upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return (sb as any).storage.from('supervisao-fotos').getPublicUrl(data.path).data.publicUrl;
  },
};

export const estoqueNucleosApi = {
  async listByNucleo(nucleoId: string): Promise<EstoqueNucleoApi[]> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('estoque_nucleos')
      .select('*, materiais(*), nucleos(identificacao)').eq('nucleo_id', nucleoId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      materialId: r.material_id, nucleoId: r.nucleo_id, quantidadeAtual: r.quantidade_atual,
      localizacao: r.localizacao ?? null,
      material: r.materiais ? mapMaterial(r.materiais) : undefined,
      nucleo: r.nucleos ? { identificacao: r.nucleos.identificacao } : undefined,
    }));
  },
  async listAlertas(): Promise<EstoqueNucleoApi[]> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('estoque_nucleos')
      .select('*, materiais(*), nucleos(identificacao)');
    if (error) throw error;
    const todos = (data ?? []).map((r: any) => ({
      materialId: r.material_id, nucleoId: r.nucleo_id, quantidadeAtual: r.quantidade_atual,
      localizacao: r.localizacao ?? null,
      material: r.materiais ? mapMaterial(r.materiais) : undefined,
      nucleo: r.nucleos ? { identificacao: r.nucleos.identificacao } : undefined,
    })) as EstoqueNucleoApi[];
    return todos.filter((e) => e.material && e.quantidadeAtual < e.material.estoqueMinimo);
  },
};

export const movimentacoesEstoqueApi = {
  async list(p?: QP): Promise<Paginated<MovimentacaoEstoqueApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = (sb as any).from('movimentacoes_estoque')
      .select('*, materiais(nome, unidade_medida), nucleos(identificacao), funcionarios(nome)', { count: 'exact' });
    if (p?.nucleoId) q = q.eq('nucleo_id', p.nucleoId as string);
    if (p?.materialId) q = q.eq('material_id', p.materialId as string);
    if (p?.tipo) q = q.eq('tipo', p.tipo as string);
    const { data, count, error } = await q.order('data_movimentacao', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapMovimentacao), total: count ?? 0, page, limit };
  },
  async create(body: Record<string, unknown>): Promise<MovimentacaoEstoqueApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('movimentacoes_estoque').insert({
      material_id: body.materialId as string, nucleo_id: body.nucleoId as string,
      tipo: body.tipo as string, quantidade: body.quantidade as number,
      responsavel_id: body.responsavelId as string,
      beneficiario_id: (body.beneficiarioId as string | null) ?? null,
      destino_nucleo_id: (body.destinoNucleoId as string | null) ?? null,
      motivo: (body.motivo as string | null) ?? null,
      observacoes: (body.observacoes as string | null) ?? null,
      foto_comprovante_url: (body.fotoComprovanteUrl as string | null) ?? null,
      data_movimentacao: (body.dataMovimentacao as string) ?? new Date().toISOString(),
    }).select('*, materiais(nome, unidade_medida), nucleos(identificacao), funcionarios(nome)').single();
    if (error) throw error;
    return mapMovimentacao(data);
  },
};

export const termosEntregaApi = {
  async list(p?: QP): Promise<Paginated<TermoEntregaApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = (sb as any).from('termos_entrega').select('*', { count: 'exact' });
    if (p?.status) q = q.eq('status', p.status as string);
    if (p?.recebedorId) q = q.eq('recebedor_id', p.recebedorId as string);
    const { data, count, error } = await q.order('data_entrega', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapTermoEntrega), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<TermoEntregaApi> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('termos_entrega').select('*').eq('id', id).single();
    if (error) throw error;
    return mapTermoEntrega(data);
  },
  async create(body: Record<string, unknown>): Promise<TermoEntregaApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('termos_entrega').insert({
      movimentacao_id: body.movimentacaoId as string,
      recebedor_tipo: body.recebedorTipo as string, recebedor_id: body.recebedorId as string,
      entregador_id: body.entregadorId as string,
      data_entrega: (body.dataEntrega as string) ?? new Date().toISOString(),
      data_devolucao_prev: (body.dataDevolucaoPrev as string | null) ?? null,
      assinatura_url: (body.assinaturaUrl as string | null) ?? null,
      observacoes: (body.observacoes as string | null) ?? null, status: 'pendente',
    }).select('*').single();
    if (error) throw error;
    return mapTermoEntrega(data);
  },
  async devolver(id: string, assinaturaUrl?: string): Promise<TermoEntregaApi> {
    const sb = createClient();
    const { data, error } = await (sb as any).from('termos_entrega').update({
      status: 'devolvido', data_devolucao_real: new Date().toISOString(), assinatura_url: assinaturaUrl ?? null,
    }).eq('id', id).select('*').single();
    if (error) throw error;
    return mapTermoEntrega(data);
  },
};
