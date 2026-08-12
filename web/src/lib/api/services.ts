import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { StatusInscricao } from '@/lib/types';

async function getSupabase() {
  if (typeof window === 'undefined') {
    try {
      const cookieStore = await require('next/headers').cookies();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrzszjogxrrjqjkoowoi.supabase.co';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
      return createServerClient<Database>(url, key, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      });
    } catch (e) {
      console.error('[getSupabase SSR Error]', e);
      return createBrowserClient();
    }
  }
  return createBrowserClient();
}

function createClient() {
  return createBrowserClient();
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type QP = Record<string, string | number | boolean | undefined>;

export interface DashboardResumo {
  beneficiariosAtivos: number;
  totalBeneficiarios: number;
  nucleosAtivos: number;
  totalNucleos: number;
  totalObjetos: number;
  totalOrganizacoes: number;
  funcionariosAtivos: number;
  funcionariosLicenca: number;
  totalTurmas: number;
  totalVagas: number;
  totalOcupadas: number;
  vagasLivres: number;
  ocupacaoGlobal: number;
  totalModalidades: number;
  topNucleos: { id: string; identificacao: string; beneficiariosAtivos: number }[];
  distribuicaoPorModalidade: { nome: string; total: number }[];
  recentes: { id: string; nomeCompleto: string; nucleo?: string; status: string; dataCadastro: string }[];
}

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

function uuidOrNull(v: unknown): string | null {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  return null;
}

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface ObjetoApi {
  id: string;
  nome: string;
  descricao?: string;
  termoDeFomento?: string;
  codigoObjeto?: string;
  codigoPrograma?: string;
  nomePrograma?: string;
  tipoDuracao: 'pontual' | 'periodo';
  dataEvento?: string;
  dataInicio?: string;
  dataTermino?: string;
  status: string;
  criadoEm: string;
}

export interface OrganizacaoApi {
  id: string;
  nome: string;
  tipo: string;
  cnpj?: string;
  nomeResponsavel?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  objetoId: string;
  status: string;
  criadoEm: string;
}

export interface NucleoApi {
  id: string;
  identificacao: string;
  nomeLocal?: string;
  regiao?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  cidade?: string;
  bairro?: string;
  complemento?: string;
  latitude?: number;
  longitude?: number;
  nomeResponsavel?: string;
  telefoneContato?: string;
  organizacaoId: string;
  dataInicio: string;
  dataFechamento?: string;
  emFuncionamento: boolean;
  disponivelPreInscricao: boolean;
  atividadeIds?: string[];
  criadoEm: string;
}

export interface AtividadeApi {
  id: string;
  nome: string;
  descricao?: string;
  disponivelPreInscricao: boolean;
  tipoAprovacao: 'automatica' | 'manual';
  turnos: string[];
  idadeMinima?: number;
  idadeMaxima?: number;
  perguntas: { id: string; pergunta: string; disponivelInscricao: boolean }[];
  nucleoId: string;
  criadoEm: string;
}

export interface TurmaApi {
  id: string;
  nome: string;
  nucleoId: string;
  atividadeId: string;
  responsaveis: string[];
  responsaveisNomes?: string[];
  vagasTotais: number;
  idadeMinima?: number;
  idadeMaxima?: number;
  permitirFilaEspera?: boolean;
  exclusiva: boolean;
  statusInicial?: "aprovada" | "pendente" | "reservada";
  dataInicio?: string;
  dataFim?: string;
  criadoEm: string;
  nucleo?: NucleoApi;
  atividade?: AtividadeApi;
  slots?: any[];
}

export interface BeneficiarioApi {
  id: string;
  matricula: string;
  nomeCompleto: string;
  nomeSocial?: string;
  dataNascimento: string;
  sexo: string;
  dataCadastro: string;
  pcd: boolean;
  tipoPcd?: string;
  nucleoId?: string;
  nucleoNome?: string;
  status: string;
  tipoMatricula: string;
  celular: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cpf?: string;
  fotoUrl?: string;
  criadoEm: string;
  turmasInfo?: Array<{
    turmaId?: string;
    turmaNome?: string;
    nucleoId?: string;
    nucleoNome?: string;
    atividadeId?: string;
    atividadeNome?: string;
  }>;
}

export interface FuncionarioApi {
  id: string;
  matricula: string;
  nomeCompleto: string;
  cpf?: string;
  cpfCnpj?: string;
  celular?: string;
  email?: string;
  dataNascimento?: string;
  remuneracao?: string;
  conselho?: string;
  registroConselho?: string;
  observacao?: string;
  jornada?: any[];
  fotoUrl?: string;
  status: string;
  funcao?: string;
  professorResponsavel: boolean;
  dataAdmissao?: string;
  dataDemissao?: string;
  nucleoId?: string;
  alocadoEm?: string;
  criadoEm: string;
}

export interface EquipamentoApi {
  id: string;
  nome: string;
  categoria?: string;
  quantidade: number;
  conservacao: string;
  nucleoId?: string;
  objetoId?: string;
  notaFiscal?: string;
  dataAquisicao?: string;
  valorUnitario?: number;
  fotoUrl?: string;
  observacao?: string;
  criadoEm: string;
}

export interface InscricaoApi {
  id: string;
  turmaId: string;
  beneficiarioId: string;
  status: string;
  origem: string;
  observacoes?: string;
  criadoEm: string;
  turma?: TurmaApi;
  beneficiario?: BeneficiarioApi;
}

export interface UsuarioApi {
  id: string;
  email: string;
  nomeCompleto: string;
  tipo: string;
  isProfessor?: boolean;
  ativo: boolean;
  perfilId: string;
  entidadeId?: string;
  criadoEm: string;
}

export interface PerfilApi {
  id: string;
  nome: string;
  descricao?: string;
  isSistema: boolean;
  permissoes: { modulo: string; acoes: string[] }[];
  criadoEm: string;
}

export interface ConfiguracaoApi {
  id: string;
  chave: string;
  valor: unknown;
}

// ── Mapeadores DB → Api ──────────────────────────────────────────────────

function mapObjeto(r: any): ObjetoApi {
  return {
    id: r.id, nome: r.nome, descricao: r.descricao ?? undefined,
    termoDeFomento: r.termo_de_fomento ?? undefined,
    codigoObjeto: r.codigo_objeto ?? undefined,
    codigoPrograma: r.codigo_programa ?? undefined,
    nomePrograma: r.nome_programa ?? undefined,
    tipoDuracao: r.tipo_duracao, dataEvento: r.data_evento ?? undefined,
    dataInicio: r.data_inicio ?? undefined, dataTermino: r.data_termino ?? undefined,
    status: r.status, criadoEm: r.created_at,
  };
}

function mapOrganizacao(r: any): OrganizacaoApi {
  return {
    id: r.id, nome: r.nome, tipo: r.tipo, cnpj: r.cnpj ?? undefined,
    nomeResponsavel: r.nome_responsavel ?? undefined, telefone: r.telefone ?? undefined,
    email: r.email ?? undefined, cep: r.cep ?? undefined, endereco: r.endereco ?? undefined,
    cidade: r.cidade ?? undefined, estado: r.estado ?? undefined,
    objetoId: r.objeto_id, status: r.status, criadoEm: r.created_at,
  };
}

function mapNucleo(r: any): NucleoApi {
  return {
    id: r.id, identificacao: r.identificacao, nomeLocal: r.nome_local ?? undefined,
    regiao: r.regiao ?? undefined, cep: r.cep ?? undefined, endereco: r.endereco ?? undefined,
    numero: r.numero ?? undefined, cidade: r.cidade ?? undefined, bairro: r.bairro ?? undefined,
    complemento: r.complemento ?? undefined, latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined, nomeResponsavel: r.nome_responsavel ?? undefined,
    telefoneContato: r.telefone_contato ?? undefined, organizacaoId: r.organizacao_id,
    dataInicio: r.data_inicio, dataFechamento: r.data_fechamento ?? undefined,
    emFuncionamento: r.em_funcionamento, disponivelPreInscricao: r.disponivel_pre_inscricao,
    atividadeIds: r.nucleo_atividades ? r.nucleo_atividades.map((na: any) => na.atividade_id) : undefined,
    criadoEm: r.created_at,
  };
}

function mapAtividade(r: any): AtividadeApi {
  return {
    id: r.id, nome: r.nome, descricao: r.descricao ?? undefined,
    disponivelPreInscricao: r.disponivel_pre_inscricao, tipoAprovacao: r.tipo_aprovacao,
    turnos: (r.atividade_turnos ?? []).map((t: any) => t.nome),
    idadeMinima: r.idade_minima ?? undefined, idadeMaxima: r.idade_maxima ?? undefined,
    perguntas: (r.atividade_perguntas ?? []).map((p: any) => ({
      id: p.id, pergunta: p.enunciado, disponivelInscricao: p.disponivel_inscricao,
    })),
    nucleoId: r.nucleo_id, criadoEm: r.created_at,
  };
}

const DIA_KEY_MAP: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
};

function mapTurma(r: any): TurmaApi {
  const horarios = r.turma_horarios ?? [];
  const slots = horarios.map((th: any) => {
    const inicioHour = parseInt(String(th.hora_inicio || '').split(':')[0], 10);
    const fimHour = parseInt(String(th.hora_fim || '').split(':')[0], 10);
    return {
      dia: DIA_KEY_MAP[th.dia_semana] || 'Seg',
      inicio: isNaN(inicioHour) ? 8 : inicioHour,
      fim: isNaN(fimHour) ? 10 : fimHour,
      atividadeId: r.atividade_id,
      atividadeNome: r.atividades?.nome,
    };
  });

  return {
    id: r.id, nome: r.nome, nucleoId: r.nucleo_id, atividadeId: r.atividade_id,
    responsaveis: (r.turma_responsaveis ?? []).map((tr: any) => tr.funcionario_id),
    responsaveisNomes: (r.turma_responsaveis ?? []).map((tr: any) => tr.funcionarios?.nome_completo).filter(Boolean),
    vagasTotais: r.vagas_totais,
    idadeMinima: r.idade_minima ?? 6,
    idadeMaxima: r.idade_maxima ?? 17,
    permitirFilaEspera: r.permitir_fila_espera ?? true,
    exclusiva: r.exclusiva,
    statusInicial: r.status_inicial ?? 'aprovada',
    dataInicio: r.data_inicio ?? undefined, dataFim: r.data_fim ?? undefined,
    criadoEm: r.created_at,
    nucleo: r.nucleos ? mapNucleo(r.nucleos) : undefined,
    atividade: r.atividades ? mapAtividade(r.atividades) : undefined,
    slots,
  };
}

function parseSexoDisplay(s: string | null | undefined): string {
  if (s === 'M') return 'Masculino';
  if (s === 'F') return 'Feminino';
  if (s === 'O') return 'Outro';
  if (s === 'N') return 'Não Informar';
  return s || 'Masculino';
}

function mapBeneficiario(r: any): BeneficiarioApi {
  const turmasInfo = (r.beneficiario_turmas ?? []).map((bt: any) => {
    const t = bt.turmas;
    return {
      turmaId: t?.id,
      turmaNome: t?.nome,
      nucleoId: t?.nucleo_id || r.nucleo_id,
      nucleoNome: t?.nucleos?.identificacao || r.nucleos?.identificacao,
      atividadeId: t?.atividade_id,
      atividadeNome: t?.atividades?.nome,
    };
  }).filter((vt: any) => vt.turmaNome || vt.nucleoNome || vt.atividadeNome);

  return {
    id: r.id, matricula: r.matricula, nomeCompleto: r.nome_completo,
    nomeSocial: r.nome_social ?? undefined, dataNascimento: r.data_nascimento,
    sexo: parseSexoDisplay(r.sexo), dataCadastro: r.data_cadastro, pcd: r.pcd, tipoPcd: r.tipo_pcd ?? undefined,
    nucleoId: r.nucleo_id ?? undefined,
    nucleoNome: r.nucleos?.identificacao ?? undefined,
    status: r.status, tipoMatricula: r.tipo_matricula,
    celular: r.celular, cep: r.cep ?? undefined, logradouro: r.logradouro ?? undefined,
    numero: r.numero ?? undefined, bairro: r.bairro ?? undefined, cidade: r.cidade ?? undefined,
    estado: r.estado ?? undefined, cpf: r.cpf ?? undefined, fotoUrl: r.foto_url ?? undefined,
    criadoEm: r.created_at,
    turmasInfo: turmasInfo.length > 0 ? turmasInfo : undefined,
  };
}

function mapFuncionario(r: any): FuncionarioApi {
  return {
    id: r.id, matricula: r.matricula, nomeCompleto: r.nome_completo,
    cpf: r.cpf ?? undefined, cpfCnpj: r.cpf_cnpj ?? undefined,
    celular: r.celular ?? undefined, email: r.email ?? undefined,
    dataNascimento: r.data_nascimento ?? undefined,
    remuneracao: r.remuneracao ?? undefined,
    conselho: r.conselho ?? undefined,
    registroConselho: r.registro_conselho ?? undefined,
    observacao: r.observacao ?? undefined,
    jornada: r.jornada ?? [],
    fotoUrl: r.foto_url ?? undefined, status: r.status, funcao: r.funcao ?? undefined,
    professorResponsavel: r.professor_responsavel,
    dataAdmissao: r.data_admissao ?? undefined, dataDemissao: r.data_demissao ?? undefined,
    nucleoId: r.nucleo_id ?? undefined, alocadoEm: r.alocado_em ?? undefined,
    criadoEm: r.created_at,
  };
}

function mapEquipamento(r: any): EquipamentoApi {
  return {
    id: r.id, nome: r.nome, categoria: r.categoria ?? undefined, quantidade: r.quantidade,
    conservacao: r.conservacao, nucleoId: r.nucleo_id ?? undefined,
    objetoId: r.objeto_id ?? undefined, notaFiscal: r.nota_fiscal ?? undefined,
    dataAquisicao: r.data_aquisicao ?? undefined, valorUnitario: r.valor_unitario ?? undefined,
    fotoUrl: r.fotos_keys ?? undefined, observacao: r.observacao ?? undefined,
    criadoEm: r.created_at,
  };
}

function mapInscricao(r: any): InscricaoApi {
  return {
    id: r.id, turmaId: r.turma_id, beneficiarioId: r.beneficiario_id, status: r.status,
    origem: r.origem, observacoes: r.observacoes ?? undefined, criadoEm: r.created_at,
    turma: r.turmas ? mapTurma(r.turmas) : undefined,
    beneficiario: r.beneficiarios ? mapBeneficiario(r.beneficiarios) : undefined,
  };
}

function mapUsuario(r: any): UsuarioApi {
  return {
    id: r.id, email: r.email, nomeCompleto: r.nome_completo, tipo: r.tipo, isProfessor: r.is_professor ?? false, ativo: r.ativo,
    perfilId: r.perfil_id, entidadeId: r.entidade_id ?? undefined, criadoEm: r.created_at,
  };
}

function mapPerfil(r: any): PerfilApi {
  const porModulo = new Map<string, string[]>();
  for (const p of r.perfil_permissoes ?? []) {
    if (!p.permitido) continue;
    const lista = porModulo.get(p.modulo) ?? [];
    lista.push(p.acao);
    porModulo.set(p.modulo, lista);
  }
  return {
    id: r.id, nome: r.nome, descricao: r.descricao ?? undefined, isSistema: r.is_sistema,
    permissoes: Array.from(porModulo.entries()).map(([modulo, acoes]) => ({ modulo, acoes })),
    criadoEm: r.created_at,
  };
}

// ── Objetos ──────────────────────────────────────────────────────────────

export const objetosApi = {
  async list(p?: QP): Promise<Paginated<ObjetoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('objetos').select('*', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.status) q = q.eq('status', String(p.status));
    if (p?.tipoDuracao) q = q.eq('tipo_duracao', String(p.tipoDuracao) as Database['public']['Enums']['tipo_duracao_atividade']);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapObjeto), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<ObjetoApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('objetos').select('*').eq('id', id).single();
    if (error) throw error;
    return mapObjeto(data);
  },
  async create(body: Record<string, unknown>): Promise<ObjetoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('objetos').insert(toObjetoRow(body)).select('*').single();
    if (error) throw error;
    return mapObjeto(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<ObjetoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('objetos').update(toObjetoRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapObjeto(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('objetos').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function toObjetoRow(b: Record<string, unknown>): Database['public']['Tables']['objetos']['Insert'] {
  return {
    nome: String(b.nome ?? ''),
    descricao: (b.descricao as string | null | undefined) ?? null,
    termo_de_fomento: (b.termoDeFomento as string | null | undefined) ?? null,
    codigo_objeto: (b.codigoObjeto as string | null | undefined) ?? null,
    codigo_programa: (b.codigoPrograma as string | null | undefined) ?? null,
    nome_programa: (b.nomePrograma as string | null | undefined) ?? null,
    tipo_duracao: (b.tipoDuracao as Database['public']['Enums']['tipo_duracao_atividade']) ?? 'periodo',
    data_evento: (b.dataEvento as string | null | undefined) ?? null,
    data_inicio: (b.dataInicio as string | null | undefined) ?? null,
    data_termino: (b.dataTermino as string | null | undefined) ?? null,
    status: (b.status as string) ?? 'ativo',
  };
}

// ── Organizações ─────────────────────────────────────────────────────────

export const organizacoesApi = {
  async list(p?: QP): Promise<Paginated<OrganizacaoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('organizacoes').select('*', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.tipo) q = q.eq('tipo', String(p.tipo));
    if (p?.status) q = q.eq('status', String(p.status));
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapOrganizacao), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<OrganizacaoApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('organizacoes').select('*').eq('id', id).single();
    if (error) throw error;
    return mapOrganizacao(data);
  },
  async create(body: Record<string, unknown>): Promise<OrganizacaoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('organizacoes').insert(toOrganizacaoRow(body)).select('*').single();
    if (error) throw error;
    return mapOrganizacao(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<OrganizacaoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('organizacoes').update(toOrganizacaoRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapOrganizacao(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('organizacoes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function toOrganizacaoRow(b: Record<string, unknown>): Database['public']['Tables']['organizacoes']['Insert'] {
  return {
    nome: b.nome as string,
    tipo: b.tipo as string | undefined,
    cnpj: b.cnpj as string | null | undefined,
    nome_responsavel: b.nomeResponsavel as string | null | undefined,
    telefone: b.telefone as string | null | undefined,
    email: b.email as string | null | undefined,
    cep: b.cep as string | null | undefined,
    endereco: b.endereco as string | null | undefined,
    cidade: b.cidade as string | null | undefined,
    estado: b.estado as string | null | undefined,
    objeto_id: uuidOrNull(b.objetoId) as any,
    status: b.status as string | undefined,
  };
}

// ── Núcleos ──────────────────────────────────────────────────────────────

export const nucleosApi = {
  async list(p?: QP): Promise<Paginated<NucleoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('nucleos').select('*, organizacoes(id, nome, objeto_id), nucleo_atividades(atividade_id)', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('identificacao', `%${p.busca}%`);
    if (p?.organizacaoId) q = q.eq('organizacao_id', p.organizacaoId as string);
    if (p?.cidade) q = q.ilike('cidade', `%${p.cidade}%`);
    if (bool(p?.emFuncionamento) !== undefined) q = q.eq('em_funcionamento', bool(p?.emFuncionamento)!);
    if (bool(p?.disponivelPreInscricao) !== undefined) q = q.eq('disponivel_pre_inscricao', bool(p?.disponivelPreInscricao)!);
    
    const { data, count, error } = await q.order('identificacao', { ascending: true }).range(from, to);
    if (error) throw error;

    let items = (data ?? []).map((r: any) => ({
      ...mapNucleo(r),
      organizacao: r.organizacoes ? { id: r.organizacoes.id, nome: r.organizacoes.nome, objetoId: r.organizacoes.objeto_id } : undefined,
    }));

    if (p?.objetoId) {
      items = items.filter((n: any) => n.organizacao?.objetoId === p.objetoId);
    }
    if (p?.atividadeId) {
      items = items.filter((n: any) => n.atividadeIds && n.atividadeIds.includes(p.atividadeId as string));
    }

    return { data: items, total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<NucleoApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('nucleos').select('*, nucleo_atividades(atividade_id)').eq('id', id).single();
    if (error) throw error;
    return mapNucleo(data);
  },
  async create(body: Record<string, unknown>): Promise<NucleoApi> {
    const sb = createClient();
    const atividadeIds = (body.atividadeIds as string[]) || [];
    const { data, error } = await sb.from('nucleos').insert(toNucleoRow(body)).select('*, nucleo_atividades(atividade_id)').single();
    if (error) throw error;

    if (atividadeIds.length > 0) {
      await sb.from('nucleo_atividades' as any).insert(atividadeIds.map((aId) => ({ nucleo_id: data.id, atividade_id: aId })));
    }
    return mapNucleo({ ...data, nucleo_atividades: atividadeIds.map((aId) => ({ atividade_id: aId })) });
  },
  async update(id: string, body: Record<string, unknown>): Promise<NucleoApi> {
    const sb = createClient();
    const atividadeIds = body.atividadeIds as string[] | undefined;
    const { data, error } = await sb.from('nucleos').update(toNucleoRow(body)).eq('id', id).select('*, nucleo_atividades(atividade_id)').single();
    if (error) throw error;

    if (atividadeIds !== undefined) {
      await sb.from('nucleo_atividades' as any).delete().eq('nucleo_id', id);
      if (atividadeIds.length > 0) {
        await sb.from('nucleo_atividades' as any).insert(atividadeIds.map((aId) => ({ nucleo_id: id, atividade_id: aId })));
      }
    }
    return mapNucleo({
      ...data,
      nucleo_atividades: atividadeIds !== undefined
        ? atividadeIds.map((aId) => ({ atividade_id: aId }))
        : data.nucleo_atividades,
    });
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('nucleos').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function toNucleoRow(b: Record<string, unknown>): Database['public']['Tables']['nucleos']['Insert'] {
  return {
    identificacao: b.identificacao as string,
    nome_local: b.nomeLocal as string | null | undefined,
    regiao: b.regiao as string | null | undefined,
    cep: b.cep as string | null | undefined,
    endereco: b.endereco as string | null | undefined,
    numero: b.numero as string | null | undefined,
    cidade: b.cidade as string | null | undefined,
    bairro: b.bairro as string | null | undefined,
    complemento: b.complemento as string | null | undefined,
    latitude: b.latitude as number | null | undefined,
    longitude: b.longitude as number | null | undefined,
    nome_responsavel: b.nomeResponsavel as string | null | undefined,
    telefone_contato: b.telefoneContato as string | null | undefined,
    organizacao_id: uuidOrNull(b.organizacaoId) as any,
    data_inicio: (b.dataInicio as string) || new Date().toISOString().slice(0, 10),
    data_fechamento: b.dataFechamento as string | null | undefined,
    em_funcionamento: b.emFuncionamento as boolean | undefined,
    disponivel_pre_inscricao: b.disponivelPreInscricao as boolean | undefined,
  };
}

// ── Atividades ───────────────────────────────────────────────────────────

export const atividadesApi = {
  async list(p?: QP): Promise<Paginated<AtividadeApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    const turnosJoin = p?.turno ? 'atividade_turnos!inner(*)' : 'atividade_turnos(*)';
    let q = sb.from('atividades').select(`*, ${turnosJoin}, atividade_perguntas(*)`, { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.turno) q = q.eq('atividade_turnos.nome', String(p.turno));
    if (bool(p?.disponivelPreInscricao) !== undefined) q = q.eq('disponivel_pre_inscricao', bool(p?.disponivelPreInscricao)!);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapAtividade), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<AtividadeApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('atividades').select('*, atividade_turnos(*), atividade_perguntas(*)').eq('id', id).single();
    if (error) throw error;
    return mapAtividade(data);
  },
  async create(body: Record<string, unknown>): Promise<AtividadeApi> {
    const sb = createClient();
    const { data, error } = await sb.from('atividades').insert(toAtividadeRow(body)).select('*, atividade_turnos(*), atividade_perguntas(*)').single();
    if (error) throw error;
    return mapAtividade(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<AtividadeApi> {
    const sb = createClient();
    const { data, error } = await sb.from('atividades').update(toAtividadeRow(body)).eq('id', id).select('*, atividade_turnos(*), atividade_perguntas(*)').single();
    if (error) throw error;
    return mapAtividade(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('atividades').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function toAtividadeRow(b: Record<string, unknown>): Database['public']['Tables']['atividades']['Insert'] {
  return {
    nome: b.nome as string,
    descricao: b.descricao as string | null | undefined,
    disponivel_pre_inscricao: b.disponivelPreInscricao as boolean | undefined,
    tipo_aprovacao: b.tipoAprovacao as Database['public']['Enums']['tipo_aprovacao'] | undefined,
    idade_minima: b.idadeMinima as number | null | undefined,
    idade_maxima: b.idadeMaxima as number | null | undefined,
    nucleo_id: uuidOrNull(b.nucleoId) as any,
  };
}

// ── Turmas ───────────────────────────────────────────────────────────────

const TURMA_SELECT = '*, nucleos(*), atividades(*), turma_responsaveis(*, funcionarios(nome_completo)), turma_horarios(*)';
const TURMA_FALLBACK_SELECT = '*, nucleos(*), atividades(*), turma_responsaveis(*), turma_horarios(*)';

export const turmasApi = {
  async list(p?: QP): Promise<Paginated<TurmaApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('turmas').select(TURMA_SELECT, { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.nucleoId) q = q.eq('nucleo_id', String(p.nucleoId));
    if (p?.atividadeId) q = q.eq('atividade_id', String(p.atividadeId));
    if (bool(p?.exclusiva) !== undefined) q = q.eq('exclusiva', bool(p?.exclusiva)!);
    
    let { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      console.warn('[turmasApi.list fallback]', error.message);
      let qFallback = sb.from('turmas').select(TURMA_FALLBACK_SELECT, { count: 'exact' }).is('deleted_at', null);
      if (p?.busca) qFallback = qFallback.ilike('nome', `%${p.busca}%`);
      if (p?.nucleoId) qFallback = qFallback.eq('nucleo_id', String(p.nucleoId));
      if (p?.atividadeId) qFallback = qFallback.eq('atividade_id', String(p.atividadeId));
      if (bool(p?.exclusiva) !== undefined) qFallback = qFallback.eq('exclusiva', bool(p?.exclusiva)!);
      const resFallback = await qFallback.order('created_at', { ascending: false }).range(from, to);
      if (resFallback.error) throw resFallback.error;
      data = resFallback.data as any;
      count = resFallback.count;
    }
    return { data: (data ?? []).map(mapTurma), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<TurmaApi> {
    const sb = await getSupabase();
    let { data, error } = await sb.from('turmas').select(TURMA_SELECT).eq('id', id).single();
    if (error) {
      const resFallback = await sb.from('turmas').select(TURMA_FALLBACK_SELECT).eq('id', id).single();
      if (resFallback.error) throw resFallback.error;
      data = resFallback.data as any;
    }
    return mapTurma(data);
  },
  async create(body: Record<string, unknown>): Promise<TurmaApi> {
    const sb = createClient();
    const { data, error } = await sb.from('turmas').insert(toTurmaRow(body)).select(TURMA_SELECT).single();
    if (error) throw error;
    return mapTurma(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<TurmaApi> {
    const sb = createClient();
    const { data, error } = await sb.from('turmas').update(toTurmaRow(body)).eq('id', id).select(TURMA_SELECT).single();
    if (error) throw error;
    return mapTurma(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('turmas').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
  async setResponsaveis(turmaId: string, funcionarioIds: string[]): Promise<void> {
    const sb = createClient();
    const { error: delErr } = await sb.from('turma_responsaveis').delete().eq('turma_id', turmaId);
    if (delErr) throw delErr;
    if (funcionarioIds.length === 0) return;
    const { error } = await sb.from('turma_responsaveis').insert(
      funcionarioIds.map((funcionario_id) => ({ turma_id: turmaId, funcionario_id })),
    );
    if (error) throw error;
  },
  async setHorarios(turmaId: string, slots: any[]): Promise<void> {
    const sb = createClient();
    const { error: delErr } = await sb.from('turma_horarios').delete().eq('turma_id', turmaId);
    if (delErr) throw delErr;
    if (!slots || slots.length === 0) return;

    const KEY_TO_DIA: Record<string, number> = {
      Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6
    };

    const rows = slots.map((s) => ({
      turma_id: turmaId,
      dia_semana: KEY_TO_DIA[s.dia] ?? 1,
      hora_inicio: `${String(s.inicio).padStart(2, '0')}:00:00`,
      hora_fim: `${String(s.fim).padStart(2, '0')}:00:00`,
    }));

    const { error } = await sb.from('turma_horarios').insert(rows);
    if (error) throw error;
  },
  async matricular(turmaId: string, beneficiarioId: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.rpc('matricular_beneficiario' as any, {
      p_turma_id: turmaId,
      p_beneficiario_id: beneficiarioId,
    });
    if (error) {
      const { error: errIns } = await sb.from('beneficiario_turmas').insert({
        turma_id: turmaId,
        beneficiario_id: beneficiarioId,
      });
      if (errIns && !errIns.message?.includes('duplicate key')) throw errIns;
    }
  },
  async desmatricular(turmaId: string, beneficiarioId: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.rpc('desmatricular_beneficiario' as any, {
      p_turma_id: turmaId,
      p_beneficiario_id: beneficiarioId,
    });
    if (error) throw error;
  },
  async migrar(beneficiarioId: string, turmaOrigemId: string, turmaDestinoId: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.rpc('migrar_beneficiario_turma' as any, {
      p_beneficiario_id: beneficiarioId,
      p_turma_origem: turmaOrigemId,
      p_turma_destino: turmaDestinoId,
    });
    if (error) throw error;
  },
};

function toTurmaRow(b: Record<string, unknown>): Database['public']['Tables']['turmas']['Insert'] {
  return {
    nome: b.nome as string,
    nucleo_id: b.nucleoId as string,
    atividade_id: b.atividadeId as string,
    vagas_totais: b.vagasTotais as number | undefined,
    idade_minima: (b.idadeMinima as number) ?? 6,
    idade_maxima: (b.idadeMaxima as number) ?? 17,
    permitir_fila_espera: (b.permitirFilaEspera as boolean) ?? true,
    exclusiva: b.exclusiva as boolean | undefined,
    status_inicial: b.statusInicial as Database['public']['Enums']['status_inscricao'] | undefined,
    data_inicio: b.dataInicio as string | null | undefined,
    data_fim: b.dataFim as string | null | undefined,
  };
}

// ── Beneficiários ────────────────────────────────────────────────────────

function dataNascimentoMaxima(idadeMinima: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - idadeMinima);
  return d.toISOString().slice(0, 10);
}

function dataNascimentoMinima(idadeMaxima: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - idadeMaxima - 1);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const beneficiariosApi = {
  async list(p?: QP): Promise<Paginated<BeneficiarioApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let beneficiarioIds: string[] | null = null;
    if (p?.atividadeId) {
      const { data: turmas, error: eT } = await sb.from('turmas').select('id').eq('atividade_id', String(p.atividadeId));
      if (eT) throw eT;
      const turmaIds = (turmas ?? []).map((t) => t.id);
      const { data: vinculos, error: eV } = await sb.from('beneficiario_turmas').select('beneficiario_id').in('turma_id', turmaIds.length ? turmaIds : ['—']);
      if (eV) throw eV;
      beneficiarioIds = Array.from(new Set((vinculos ?? []).map((v) => v.beneficiario_id)));
    }
    const BENEFICIARIO_FULL_SELECT = '*, nucleos(*), beneficiario_turmas(*, turmas(*, nucleos(*), atividades(*)))';
    let q = sb.from('beneficiarios').select(BENEFICIARIO_FULL_SELECT, { count: 'exact' }).is('deleted_at', null);
    if (p?.nome) q = q.ilike('nome_completo', `%${p.nome}%`);
    if (p?.matricula) q = q.ilike('matricula', `%${p.matricula}%`);
    if (p?.cpf) q = q.ilike('cpf', `%${p.cpf}%`);
    if (p?.status) q = q.eq('status', String(p.status));
    if (p?.tipoMatricula) q = q.eq('tipo_matricula', String(p.tipoMatricula));
    if (p?.nucleoId) q = q.eq('nucleo_id', String(p.nucleoId));
    if (beneficiarioIds) q = q.in('id', beneficiarioIds.length ? beneficiarioIds : ['—']);
    const idadeMin = num(p?.idadeMin);
    const idadeMax = num(p?.idadeMax);
    if (idadeMin !== undefined) q = q.lte('data_nascimento', dataNascimentoMaxima(idadeMin));
    if (idadeMax !== undefined) q = q.gte('data_nascimento', dataNascimentoMinima(idadeMax));
    
    let { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      console.warn('[beneficiariosApi.list fallback]', error.message);
      let qFallback = sb.from('beneficiarios').select('*', { count: 'exact' }).is('deleted_at', null);
      if (p?.nome) qFallback = qFallback.ilike('nome_completo', `%${p.nome}%`);
      if (p?.matricula) qFallback = qFallback.ilike('matricula', `%${p.matricula}%`);
      if (p?.cpf) qFallback = qFallback.ilike('cpf', `%${p.cpf}%`);
      if (p?.status) qFallback = qFallback.eq('status', String(p.status));
      if (p?.tipoMatricula) qFallback = qFallback.eq('tipo_matricula', String(p.tipoMatricula));
      if (p?.nucleoId) qFallback = qFallback.eq('nucleo_id', String(p.nucleoId));
      if (beneficiarioIds) qFallback = qFallback.in('id', beneficiarioIds.length ? beneficiarioIds : ['—']);
      if (idadeMin !== undefined) qFallback = qFallback.lte('data_nascimento', dataNascimentoMaxima(idadeMin));
      if (idadeMax !== undefined) qFallback = qFallback.gte('data_nascimento', dataNascimentoMinima(idadeMax));
      const resFallback = await qFallback.order('created_at', { ascending: false }).range(from, to);
      if (resFallback.error) throw resFallback.error;
      data = resFallback.data as any;
      count = resFallback.count;
    }
    return { data: (data ?? []).map(mapBeneficiario), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<BeneficiarioApi> {
    const sb = await getSupabase();
    const BENEFICIARIO_FULL_SELECT = '*, nucleos(*), beneficiario_turmas(*, turmas(*, nucleos(*), atividades(*)))';
    let { data, error } = await sb.from('beneficiarios').select(BENEFICIARIO_FULL_SELECT).eq('id', id).single();
    if (error) {
      const resFallback = await sb.from('beneficiarios').select('*').eq('id', id).single();
      if (resFallback.error) throw resFallback.error;
      data = resFallback.data as any;
    }
    return mapBeneficiario(data);
  },
  async create(body: Record<string, unknown>): Promise<BeneficiarioApi> {
    const sb = createClient();
    const { data, error } = await sb.from('beneficiarios').insert(toBeneficiarioRow(body)).select('*').single();
    if (error) throw error;
    return mapBeneficiario(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<BeneficiarioApi> {
    const sb = createClient();
    const { data, error } = await sb.from('beneficiarios').update(toBeneficiarioRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapBeneficiario(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('beneficiarios').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function parseSexoDb(v: unknown): Database['public']['Enums']['sexo_beneficiario'] {
  const str = String(v || '').trim().toLowerCase();
  if (str === 'm' || str === 'masculino') return 'M';
  if (str === 'f' || str === 'feminino') return 'F';
  if (str === 'o' || str === 'outro' || str === 'outros') return 'O';
  return 'N';
}

function toBeneficiarioRow(b: Record<string, unknown>): Database['public']['Tables']['beneficiarios']['Insert'] {
  return {
    matricula: (b.matricula as string) || String(Math.floor(100000 + Math.random() * 900000)),
    nome_completo: b.nomeCompleto as string,
    nome_social: b.nomeSocial as string | null | undefined,
    data_nascimento: b.dataNascimento as string,
    sexo: parseSexoDb(b.sexo),
    pcd: b.pcd as boolean | undefined,
    tipo_pcd: b.tipoPcd as string | null | undefined,
    nucleo_id: uuidOrNull(b.nucleoId),
    status: b.status as string | undefined,
    tipo_matricula: b.tipoMatricula as string | undefined,
    celular: b.celular as string,
    cep: b.cep as string | null | undefined,
    logradouro: b.logradouro as string | null | undefined,
    numero: b.numero as string | null | undefined,
    bairro: b.bairro as string | null | undefined,
    cidade: b.cidade as string | null | undefined,
    estado: b.estado as string | null | undefined,
    cpf: b.cpf as string | null | undefined,
    foto_url: b.fotoUrl as string | null | undefined,
  };
}

export interface FuncaoApi {
  id: string;
  nome: string;
  descricao?: string;
  criadoEm: string;
}

function mapFuncao(r: any): FuncaoApi {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? undefined,
    criadoEm: r.created_at,
  };
}

const CARGOS_OFICIAIS = [
  { id: "cargo-1", nome: "Professor / Instrutor", descricao: "Aulas práticas nos núcleos e chamada de alunos.", criadoEm: new Date().toISOString() },
  { id: "cargo-2", nome: "Coordenador de Núcleo", descricao: "Gestão do polo esportivo físico, infraestrutura e equipamentos.", criadoEm: new Date().toISOString() },
  { id: "cargo-3", nome: "Coordenador de Turma", descricao: "Gestão de horários, vagas e turmas específicas.", criadoEm: new Date().toISOString() },
  { id: "cargo-4", nome: "Coordenador de Instrutores", descricao: "Supervisão técnica, pedagógica e equipe de professores.", criadoEm: new Date().toISOString() },
  { id: "cargo-5", nome: "Staff", descricao: "Apoio administrativo, logística, recepção e operações.", criadoEm: new Date().toISOString() },
];

export const funcoesApi = {
  async list(): Promise<FuncaoApi[]> {
    return CARGOS_OFICIAIS;
  },
  async create(body: { nome: string; descricao?: string }): Promise<FuncaoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('funcoes' as any).insert(body).select('*').single();
    if (error) throw error;
    return mapFuncao(data);
  },
  async update(id: string, body: { nome?: string; descricao?: string }): Promise<FuncaoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('funcoes' as any).update(body).eq('id', id).select('*').single();
    if (error) throw error;
    return mapFuncao(data);
  },
  async delete(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('funcoes' as any).update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ── Funcionários ─────────────────────────────────────────────────────────

export const funcionariosApi = {
  async list(p?: QP): Promise<Paginated<FuncionarioApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('funcionarios').select('*', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome_completo', `%${p.busca}%`);
    if (p?.funcao) q = q.eq('funcao', String(p.funcao));
    if (p?.status) {
      const valores = String(p.status).split(',').filter(Boolean);
      q = valores.length > 1 ? q.in('status', valores) : q.eq('status', valores[0]);
    }
    if (p?.admissaoDe) q = q.gte('data_admissao', String(p.admissaoDe));
    if (p?.admissaoAte) q = q.lte('data_admissao', String(p.admissaoAte));
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapFuncionario), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<FuncionarioApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('funcionarios').select('*').eq('id', id).single();
    if (error) throw error;
    return mapFuncionario(data);
  },
  async verificarEmailUnico(email: string, ignoreId?: string): Promise<{ unico: boolean; mensagem?: string }> {
    const sb = await getSupabase();
    const emailLower = email.trim().toLowerCase();
    if (!emailLower) return { unico: true };

    const { data: func } = await sb.from('funcionarios').select('id, nome_completo').eq('email', emailLower).is('deleted_at', null);
    const funcDup = (func ?? []).find((f) => f.id !== ignoreId);
    if (funcDup) {
      return { unico: false, mensagem: `Este e-mail já pertence ao funcionário "${funcDup.nome_completo}".` };
    }

    const { data: usr } = await sb.from('usuarios').select('id, nome_completo, entidade_id').eq('email', emailLower).is('deleted_at', null);
    const usrDup = (usr ?? []).find((u) => u.id !== ignoreId && u.entidade_id !== ignoreId);
    if (usrDup) {
      return { unico: false, mensagem: `Este e-mail já possui uma conta de usuário ("${usrDup.nome_completo}").` };
    }

    return { unico: true };
  },
  async create(body: Record<string, unknown>): Promise<FuncionarioApi> {
    const sb = createClient();
    const { data, error } = await sb.from('funcionarios').insert(toFuncionarioRow(body)).select('*').single();
    if (error) throw error;
    await sincronizarUsuarioFuncionario(
      sb,
      data.id,
      data.nome_completo,
      data.email,
      data.funcao,
      data.status,
      body.permitirLogin !== false,
      (body.senhaLogin as string) || "Palmas444##@1"
    );
    return mapFuncionario(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<FuncionarioApi> {
    const sb = createClient();
    const { data, error } = await sb.from('funcionarios').update(toFuncionarioRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    await sincronizarUsuarioFuncionario(
      sb,
      data.id,
      data.nome_completo,
      data.email,
      data.funcao,
      data.status,
      body.permitirLogin !== false,
      (body.senhaLogin as string) || "Palmas444##@1"
    );
    return mapFuncionario(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('funcionarios').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

async function sincronizarUsuarioFuncionario(
  sb: ReturnType<typeof createClient>,
  funcionarioId: string,
  nomeCompleto: string,
  email: string | null | undefined,
  funcao: string | null | undefined,
  status: string | undefined,
  permitirLogin: boolean,
  senhaLogin?: string
) {
  if (!email || !email.trim()) return;
  const emailLower = email.trim().toLowerCase();

  const { data: perfis } = await sb.from('perfis').select('id, nome');
  const perfilCorrespondente = (perfis ?? []).find(
    (p) => p.nome.toLowerCase() === (funcao || '').toLowerCase()
  ) ?? (perfis ?? []).find((p) => p.nome.toLowerCase().includes('professor'));

  const perfilId = perfilCorrespondente?.id || '';
  const isAtivo = status === 'ativo' || status === 'contratado';
  const isProf = (funcao || '').toLowerCase().includes('professor') || (funcao || '').toLowerCase().includes('instrutor');

  const { data: usrExistente } = await sb.from('usuarios')
    .select('id, email')
    .or(`entidade_id.eq.${funcionarioId},email.eq.${emailLower}`)
    .maybeSingle();

  if (permitirLogin) {
    const usuarioRow = {
      email: emailLower,
      nome_completo: nomeCompleto,
      tipo: 'funcionario' as const,
      is_professor: isProf,
      ativo: isAtivo,
      perfil_id: perfilId,
      entidade_id: funcionarioId,
      deleted_at: null,
    };

    if (usrExistente?.id) {
      await sb.from('usuarios' as any).update(usuarioRow).eq('id', usrExistente.id);
    } else {
      await sb.from('usuarios' as any).insert({ id: crypto.randomUUID(), ...usuarioRow });
    }
  } else if (usrExistente?.id) {
    await sb.from('usuarios' as any).update({ ativo: false }).eq('id', usrExistente.id);
  }
}

function toFuncionarioRow(b: Record<string, unknown>): Database['public']['Tables']['funcionarios']['Insert'] {
  return {
    matricula: b.matricula as string,
    nome_completo: b.nomeCompleto as string,
    foto_url: b.fotoUrl as string | null | undefined,
    status: b.status as string | undefined,
    funcao: b.funcao as string | null | undefined,
    professor_responsavel: b.professorResponsavel as boolean | undefined,
    data_admissao: b.dataAdmissao as string | null | undefined,
    data_demissao: b.dataDemissao as string | null | undefined,
    nucleo_id: uuidOrNull(b.nucleoId),
    alocado_em: b.alocadoEm as string | null | undefined,
    cpf: b.cpf as string | null | undefined,
    celular: b.celular as string | null | undefined,
    email: b.email as string | null | undefined,
    data_nascimento: b.dataNascimento as string | null | undefined,
    conselho: b.conselho as string | null | undefined,
    registro_conselho: b.registroConselho as string | null | undefined,
    remuneracao: b.remuneracao as number | null | undefined,
  };
}

// ── Equipamentos ─────────────────────────────────────────────────────────

export const equipamentosApi = {
  async list(p?: QP): Promise<Paginated<EquipamentoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('equipamentos').select('*', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.categoria) q = q.eq('categoria', String(p.categoria));
    if (p?.conservacao) q = q.eq('conservacao', String(p.conservacao) as Database['public']['Enums']['estado_equipamento']);
    if (p?.nucleoId) q = q.eq('nucleo_id', String(p.nucleoId));
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapEquipamento), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<EquipamentoApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('equipamentos').select('*').eq('id', id).single();
    if (error) throw error;
    return mapEquipamento(data);
  },
  async create(body: Record<string, unknown>): Promise<EquipamentoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('equipamentos').insert(toEquipamentoRow(body)).select('*').single();
    if (error) throw error;
    return mapEquipamento(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<EquipamentoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('equipamentos').update(toEquipamentoRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapEquipamento(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('equipamentos').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function toEquipamentoRow(b: Record<string, unknown>): Database['public']['Tables']['equipamentos']['Insert'] {
  return {
    nome: b.nome as string,
    categoria: b.categoria as string | null | undefined,
    quantidade: b.quantidade as number | undefined,
    conservacao: b.conservacao as Database['public']['Enums']['estado_equipamento'] | undefined,
    nucleo_id: uuidOrNull(b.nucleoId),
    objeto_id: uuidOrNull(b.objetoId),
    nota_fiscal: b.notaFiscal as string | null | undefined,
    data_aquisicao: b.dataAquisicao as string | null | undefined,
    valor_unitario: b.valorUnitario as number | null | undefined,
    fotos_keys: b.fotoUrl as string | null | undefined,
    observacao: b.observacao as string | null | undefined,
  };
}

// ── Inscrições ───────────────────────────────────────────────────────────

const INSCRICAO_SELECT = '*, turmas(*, nucleos(*), atividades(*)), beneficiarios(*)';

export const inscricoesApi = {
  async list(p?: QP): Promise<Paginated<InscricaoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('inscricoes').select(INSCRICAO_SELECT, { count: 'exact' });
    if (p?.status) q = q.eq('status', String(p.status) as Database['public']['Enums']['status_inscricao']);
    if (p?.turmaId) q = q.eq('turma_id', String(p.turmaId));
    if (p?.beneficiarioId) q = q.eq('beneficiario_id', String(p.beneficiarioId));
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapInscricao), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<InscricaoApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('inscricoes').select(INSCRICAO_SELECT).eq('id', id).single();
    if (error) throw error;
    return mapInscricao(data);
  },
  async criar(beneficiarioId: string, turmaId: string, observacoes?: string, respostas?: unknown): Promise<InscricaoApi> {
    const sb = createClient();
    const { data, error } = await sb.rpc('criar_inscricao', {
      p_beneficiario_id: beneficiarioId, p_turma_id: turmaId,
      p_observacoes: observacoes, p_respostas: respostas as never,
    });
    if (error) throw error;
    return mapInscricao(data);
  },
  async aprovar(id: string): Promise<InscricaoApi> {
    const sb = createClient();
    const { data, error } = await sb.rpc('aprovar_inscricao', { p_id: id });
    if (error) throw error;
    return mapInscricao(data);
  },
  async recusar(id: string, observacoes?: string): Promise<InscricaoApi> {
    const sb = createClient();
    const { data, error } = await sb.rpc('recusar_inscricao', { p_id: id, p_observacoes: observacoes });
    if (error) throw error;
    return mapInscricao(data);
  },
  async cancelar(id: string): Promise<InscricaoApi> {
    const sb = createClient();
    const { data, error } = await sb.rpc('cancelar_inscricao', { p_id: id });
    if (error) throw error;
    return mapInscricao(data);
  },
  async updateStatus(id: string, status: StatusInscricao): Promise<InscricaoApi> {
    const sb = createClient();
    if (status === 'aprovada') return this.aprovar(id);
    if (status === 'cancelada') return this.cancelar(id);
    if (status === 'recusada') return this.recusar(id);
    const { data, error } = await sb.from('inscricoes').update({ status }).eq('id', id).select(INSCRICAO_SELECT).single();
    if (error) throw error;
    return mapInscricao(data);
  },
};

// ── Usuários ─────────────────────────────────────────────────────────────

export const usuariosApi = {
  async list(p?: QP): Promise<Paginated<UsuarioApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('usuarios').select('*', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.or(`nome_completo.ilike.%${p.busca}%,email.ilike.%${p.busca}%`);
    if (p?.perfilId) q = q.eq('perfil_id', String(p.perfilId));
    if (bool(p?.ativo) !== undefined) q = q.eq('ativo', bool(p?.ativo)!);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapUsuario), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<UsuarioApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('usuarios').select('*').eq('id', id).single();
    if (error) throw error;
    return mapUsuario(data);
  },
  async create(body: Record<string, unknown>): Promise<UsuarioApi> {
    const sb = createClient();
    const row: any = {
      id: crypto.randomUUID(),
      email: String(body.email ?? ''),
      nome_completo: String(body.nomeCompleto ?? ''),
      tipo: (body.tipo as Database['public']['Enums']['tipo_usuario']) ?? 'gestor',
      is_professor: Boolean(body.isProfessor),
      ativo: body.ativo !== false,
      perfil_id: (body.perfilId as string) ?? '',
      entidade_id: (body.entidadeId as string | null) ?? null,
    };
    const { data, error } = await sb.from('usuarios').insert(row).select('*').single();
    if (error) throw error;
    return mapUsuario(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<UsuarioApi> {
    const sb = createClient();
    const row: any = {
      nome_completo: body.nomeCompleto as string | undefined,
      tipo: body.tipo as Database['public']['Enums']['tipo_usuario'] | undefined,
      is_professor: body.isProfessor !== undefined ? Boolean(body.isProfessor) : undefined,
      ativo: body.ativo as boolean | undefined,
      perfil_id: body.perfilId as string | undefined,
      entidade_id: body.entidadeId as string | null | undefined,
    };
    const { data, error } = await sb.from('usuarios').update(row).eq('id', id).select('*').single();
    if (error) throw error;
    return mapUsuario(data);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('usuarios').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ── Perfis ───────────────────────────────────────────────────────────────

const PERFIL_SELECT = '*, perfil_permissoes(*)';

export const perfisApi = {
  async list(p?: QP): Promise<Paginated<PerfilApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('perfis').select(PERFIL_SELECT, { count: 'exact' });
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    const { data, count, error } = await q.order('nome', { ascending: true }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapPerfil), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<PerfilApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('perfis').select(PERFIL_SELECT).eq('id', id).single();
    if (error) throw error;
    return mapPerfil(data);
  },
  async create(body: { nome: string; descricao?: string; permissoes: { modulo: string; acoes: string[] }[] }): Promise<PerfilApi> {
    const sb = createClient();
    const { data: perfil, error } = await sb.from('perfis')
      .insert({ nome: body.nome, descricao: body.descricao }).select('*').single();
    if (error) throw error;
    await gravarPermissoes(sb, perfil.id, body.permissoes);
    return perfisApi.get(perfil.id);
  },
  async update(id: string, body: { nome?: string; descricao?: string; permissoes?: { modulo: string; acoes: string[] }[] }): Promise<PerfilApi> {
    const sb = createClient();
    const { error } = await sb.from('perfis').update({ nome: body.nome, descricao: body.descricao }).eq('id', id);
    if (error) throw error;
    if (body.permissoes) await gravarPermissoes(sb, id, body.permissoes);
    return perfisApi.get(id);
  },
  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('perfis').delete().eq('id', id);
    if (error) throw error;
  },
};

const TODAS_ACOES = ['visualizar', 'criar', 'editar', 'excluir'];

async function gravarPermissoes(
  sb: ReturnType<typeof createClient>,
  perfilId: string,
  permissoes: { modulo: string; acoes: string[] }[],
) {
  const rows = permissoes.flatMap((p) =>
    TODAS_ACOES.map((acao) => ({
      perfil_id: perfilId, modulo: p.modulo, acao, permitido: p.acoes.includes(acao),
    })),
  );
  const { error } = await sb.from('perfil_permissoes')
    .upsert(rows, { onConflict: 'perfil_id,modulo,acao' });
  if (error) throw error;
}

// ── Configurações ────────────────────────────────────────────────────────

function mapConfiguracao(r: any): ConfiguracaoApi {
  return { id: r.id, chave: r.chave, valor: r.valor };
}

export const configuracoesApi = {
  async list(): Promise<ConfiguracaoApi[]> {
    const sb = createClient();
    const { data, error } = await sb.from('configuracoes').select('*').order('chave');
    if (error) throw error;
    return (data ?? []).map(mapConfiguracao);
  },
  async get(chave: string): Promise<ConfiguracaoApi | null> {
    const sb = createClient();
    const { data, error } = await sb.from('configuracoes').select('*').eq('chave', chave).maybeSingle();
    if (error) throw error;
    return data ? mapConfiguracao(data) : null;
  },
  async upsert(chave: string, valor: unknown, descricao?: string): Promise<ConfiguracaoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('configuracoes')
      .upsert({ chave, valor: valor as never, descricao }, { onConflict: 'chave' })
      .select('*').single();
    if (error) throw error;
    return mapConfiguracao(data);
  },
};

// ── Dashboard ────────────────────────────────────────────────────────────

function montarResumo(
  totalBeneficiarios: number,
  aprovados: any[],
  nucleos: { id: string; identificacao: string; em_funcionamento: boolean }[],
  funcionarios: { status: string }[],
  turmas: { id: string; atividade_id: string; vagas_totais: number }[],
  atividades: { id: string; nome: string }[],
  matriculas: { turma_id: string }[],
  recentes: any[],
  totalObjetos: number = 0,
  totalOrganizacoes: number = 0,
): DashboardResumo {
  const nucleoNome = new Map(nucleos.map((n) => [n.id, n.identificacao]));
  const beneficiariosAtivos = aprovados.length;

  const porNucleo = new Map<string, number>();
  for (const b of aprovados) {
    let nid = b.nucleo_id;
    if (!nid && b.beneficiario_turmas && b.beneficiario_turmas.length > 0) {
      nid = b.beneficiario_turmas[0]?.turmas?.nucleo_id;
    }
    if (!nid) continue;
    porNucleo.set(nid, (porNucleo.get(nid) ?? 0) + 1);
  }

  const topNucleos = nucleos
    .map((n) => ({
      id: n.id,
      identificacao: n.identificacao,
      beneficiariosAtivos: porNucleo.get(n.id) ?? 0,
    }))
    .sort((a, b) => b.beneficiariosAtivos - a.beneficiariosAtivos)
    .slice(0, 5);

  const nucleosAtivos = nucleos.filter((n) => n.em_funcionamento).length;
  const funcionariosAtivos = funcionarios.filter((f) => f.status === "ativo" || f.status === "contratado").length;
  const funcionariosLicenca = funcionarios.filter((f) =>
    f.status === "licenca_medica" || f.status === "licenca_maternidade" || f.status === "afastado_inss",
  ).length;

  const ocupacaoPorTurma = new Map<string, number>();
  for (const m of matriculas) ocupacaoPorTurma.set(m.turma_id, (ocupacaoPorTurma.get(m.turma_id) ?? 0) + 1);

  const totalVagas = turmas.reduce((acc, t) => acc + (t.vagas_totais || 0), 0);
  const totalOcupadas = turmas.reduce((acc, t) => acc + (ocupacaoPorTurma.get(t.id) ?? 0), 0);
  const vagasLivres = Math.max(0, totalVagas - totalOcupadas);
  const calcOcupacao = totalVagas > 0 ? (totalOcupadas / totalVagas) * 100 : 0;
  const ocupacaoGlobal = totalOcupadas > 0 && calcOcupacao < 1
    ? Number(calcOcupacao.toFixed(1))
    : Math.round(calcOcupacao);

  const distribuicaoPorModalidade = atividades
    .map((a) => ({
      nome: a.nome,
      total: turmas.filter((t) => t.atividade_id === a.id).reduce((acc, t) => acc + (ocupacaoPorTurma.get(t.id) ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    beneficiariosAtivos,
    totalBeneficiarios,
    nucleosAtivos,
    totalNucleos: nucleos.length,
    totalObjetos,
    totalOrganizacoes,
    funcionariosAtivos,
    funcionariosLicenca,
    totalTurmas: turmas.length,
    totalVagas,
    totalOcupadas,
    vagasLivres,
    ocupacaoGlobal,
    totalModalidades: atividades.length,
    topNucleos,
    distribuicaoPorModalidade,
    recentes: recentes.map((b) => {
      let nomeDoNucleo = b.nucleo_id ? nucleoNome.get(b.nucleo_id) : undefined;
      if (!nomeDoNucleo && b.nucleos?.identificacao) {
        nomeDoNucleo = b.nucleos.identificacao;
      }
      if (!nomeDoNucleo && b.beneficiario_turmas && b.beneficiario_turmas.length > 0) {
        nomeDoNucleo = b.beneficiario_turmas[0]?.turmas?.nucleos?.identificacao;
      }
      return {
        id: b.id,
        nomeCompleto: b.nome_completo,
        status: b.status,
        dataCadastro: b.data_cadastro || b.created_at,
        nucleo: nomeDoNucleo || "—",
      };
    }),
  };
}

export const dashboardApi = {
  async resumo(): Promise<DashboardResumo> {
    const sb = createClient();
    const [
      totalRes,
      aprovadosRes,
      nucleosRes,
      funcionariosRes,
      turmasRes,
      atividadesRes,
      matriculasRes,
      recentesRes,
      objetosRes,
      organizacoesRes,
    ] = await Promise.all([
      sb.from('beneficiarios').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      sb.from('beneficiarios').select('id, nucleo_id, beneficiario_turmas(turmas(nucleo_id))').is('deleted_at', null).eq('status', 'ativo'),
      sb.from('nucleos').select('id, identificacao, em_funcionamento').is('deleted_at', null),
      sb.from('funcionarios').select('status').is('deleted_at', null),
      sb.from('turmas').select('id, atividade_id, vagas_totais').is('deleted_at', null),
      sb.from('atividades').select('id, nome').is('deleted_at', null),
      sb.from('beneficiario_turmas').select('turma_id').is('deleted_at', null),
      sb.from('beneficiarios')
        .select('id, nome_completo, status, data_cadastro, created_at, nucleo_id, nucleos(identificacao), beneficiario_turmas(turmas(nucleos(identificacao)))')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
      sb.from('objetos').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      sb.from('organizacoes').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    ]);

    for (const r of [
      totalRes, aprovadosRes, nucleosRes, funcionariosRes, turmasRes,
      atividadesRes, matriculasRes, recentesRes, objetosRes, organizacoesRes,
    ]) {
      if (r.error) throw r.error;
    }

    return montarResumo(
      totalRes.count ?? 0,
      aprovadosRes.data ?? [],
      nucleosRes.data ?? [],
      funcionariosRes.data ?? [],
      turmasRes.data ?? [],
      atividadesRes.data ?? [],
      matriculasRes.data ?? [],
      recentesRes.data ?? [],
      objetosRes.count ?? 0,
      organizacoesRes.count ?? 0,
    );
  },
};
