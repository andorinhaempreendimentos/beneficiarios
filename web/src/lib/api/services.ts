import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { StatusInscricao, ExecucaoAulaApi, BeneficiarioPresencaApi } from '@/lib/types';
import { getDataHojeBrasil, getHoraAgoraBrasil } from '@/lib/dateUtils';
export type { ExecucaoAulaApi, BeneficiarioPresencaApi };

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
  mapaNucleos?: Array<{
    id: string;
    identificacao: string;
    nomeLocal?: string;
    cep?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    complemento?: string;
    latitude?: number;
    longitude?: number;
    emFuncionamento: boolean;
    organizacaoId: string;
    organizacaoNome?: string;
    totalVagas: number;
    totalMatriculados: number;
    vagasLivres: number;
    taxaOcupacao: number;
    atividadeIds?: string[];
  }>;
  nucleosDetalhados?: Array<{
    id: string;
    identificacao: string;
    cidade?: string;
    organizacaoId: string;
    organizacao?: {
      id: string;
      nome: string;
      estado?: string;
      cidade?: string;
    };
  }>;
  organizacoes?: Array<{
    id: string;
    nome: string;
    estado?: string;
  }>;
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

export interface ObjetoCargoPrevistoApi {
  id: string;
  objetoId: string;
  cargoNome: string;
  quantidadePrevista: number;
  remuneracaoMensal?: number;
  cargaHorariaSemanal?: string;
}

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
  concedenteId?: string;
  concedente?: {
    id: string;
    nome: string;
    cnpj?: string;
    esfera?: string;
    cidade?: string;
    estado?: string;
    responsavelNome?: string;
    responsavelCargo?: string;
  };
  modalidadeParceria?: 'termo_colaboracao' | 'termo_fomento' | 'acordo_cooperacao';
  numeroProcessoAdm?: string;
  editalNumero?: string;
  contaBancariaBanco?: string;
  contaBancariaAgencia?: string;
  contaBancariaConta?: string;
  metaBeneficiarios: number;
  metaNucleos: number;
  metaAulasAno: number;
  metaFrequenciaMinima: number;
  metaVulnerabilidadeMinima: number;
  metaEventosAno: number;
  metaReunioesAno: number;
  cargosPrevistos?: ObjetoCargoPrevistoApi[];
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
  estado?: string;
  bairro?: string;
  complemento?: string;
  latitude?: number;
  longitude?: number;
  nomeResponsavel?: string;
  telefoneContato?: string;
  organizacaoId: string;
  organizacao?: {
    id: string;
    nome: string;
    objetoId?: string;
    estado?: string;
    cidade?: string;
  };
  dataInicio: string;
  dataFechamento?: string;
  emFuncionamento: boolean;
  disponivelPreInscricao: boolean;
  tipoRestricaoChamada?: 'data' | 'horario';
  permitirChamadaRetroativa?: boolean;
  toleranciaInicioMinutos?: number;
  toleranciaFimMinutos?: number;
  diasLimiteRetroativo?: number;
  atividadeIds?: string[];
  criadoEm: string;
}

export interface AtividadeApi {
  id: string;
  nome: string;
  descricao?: string;
  disponivelPreInscricao: boolean;
  usoInterno: boolean;
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
  funcaoId?: string;
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
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? undefined,
    termoDeFomento: r.termo_de_fomento ?? undefined,
    codigoObjeto: r.codigo_objeto ?? undefined,
    codigoPrograma: r.codigo_programa ?? undefined,
    nomePrograma: r.nome_programa ?? undefined,
    tipoDuracao: r.tipo_duracao,
    dataEvento: r.data_evento ?? undefined,
    dataInicio: r.data_inicio ?? undefined,
    dataTermino: r.data_termino ?? undefined,
    status: r.status,
    concedenteId: r.concedente_id ?? undefined,
    concedente: r.concedentes ? {
      id: r.concedentes.id,
      nome: r.concedentes.nome,
      cnpj: r.concedentes.cnpj ?? undefined,
      esfera: r.concedentes.esfera ?? undefined,
      cidade: r.concedentes.cidade ?? undefined,
      estado: r.concedentes.estado ?? undefined,
      responsavelNome: r.concedentes.responsavel_nome ?? undefined,
      responsavelCargo: r.concedentes.responsavel_cargo ?? undefined,
    } : undefined,
    modalidadeParceria: r.modalidade_parceria ?? undefined,
    numeroProcessoAdm: r.numero_processo_adm ?? undefined,
    editalNumero: r.edital_numero ?? undefined,
    contaBancariaBanco: r.conta_bancaria_banco ?? undefined,
    contaBancariaAgencia: r.conta_bancaria_agencia ?? undefined,
    contaBancariaConta: r.conta_bancaria_conta ?? undefined,
    metaBeneficiarios: r.meta_beneficiarios ?? 0,
    metaNucleos: r.meta_nucleos ?? 0,
    metaAulasAno: r.meta_aulas_ano ?? 0,
    metaFrequenciaMinima: Number(r.meta_frequencia_minima ?? 75),
    metaVulnerabilidadeMinima: Number(r.meta_vulnerabilidade_minima ?? 70),
    metaEventosAno: r.meta_eventos_ano ?? 0,
    metaReunioesAno: r.meta_reunioes_ano ?? 0,
    cargosPrevistos: Array.isArray(r.objeto_cargos_previstos) ? r.objeto_cargos_previstos.map((c: any) => ({
      id: c.id,
      objetoId: c.objeto_id,
      cargoNome: c.cargo_nome,
      quantidadePrevista: c.quantidade_prevista,
      remuneracaoMensal: c.remuneracao_mensal ? Number(c.remuneracao_mensal) : undefined,
      cargaHorariaSemanal: c.carga_horaria_semanal ?? undefined,
    })) : undefined,
    criadoEm: r.created_at,
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
    numero: r.numero ?? undefined, cidade: r.cidade ?? undefined, estado: r.estado ?? undefined, bairro: r.bairro ?? undefined,
    complemento: r.complemento ?? undefined, latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined, nomeResponsavel: r.nome_responsavel ?? undefined,
    telefoneContato: r.telefone_contato ?? undefined, organizacaoId: r.organizacao_id,
    organizacao: r.organizacoes ? {
      id: r.organizacoes.id,
      nome: r.organizacoes.nome,
      objetoId: r.organizacoes.objeto_id ?? undefined,
      estado: r.organizacoes.estado ?? undefined,
      cidade: r.organizacoes.cidade ?? undefined,
    } : undefined,
    dataInicio: r.data_inicio, dataFechamento: r.data_fechamento ?? undefined,
    emFuncionamento: r.em_funcionamento, disponivelPreInscricao: r.disponivel_pre_inscricao,
    tipoRestricaoChamada: (r.tipo_restricao_chamada as 'data' | 'horario') ?? 'data',
    permitirChamadaRetroativa: r.permitir_chamada_retroativa ?? undefined,
    toleranciaInicioMinutos: r.tolerancia_inicio_minutos ?? undefined,
    toleranciaFimMinutos: r.tolerancia_fim_minutos ?? undefined,
    diasLimiteRetroativo: r.dias_limite_retroativo ?? undefined,
    atividadeIds: r.nucleo_atividades ? r.nucleo_atividades.map((na: any) => na.atividade_id) : undefined,
    criadoEm: r.created_at,
  };
}

function mapAtividade(r: any): AtividadeApi {
  return {
    id: r.id,    nome: r.nome,
    descricao: r.descricao ?? undefined,
    disponivelPreInscricao: r.disponivel_pre_inscricao,
    usoInterno: r.uso_interno ?? false,
    tipoAprovacao: r.tipo_aprovacao,
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
    funcaoId: r.funcao_id ?? undefined,
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

function mapExecucaoAula(r: any): ExecucaoAulaApi {
  return {
    id: r.id,
    turmaId: r.turma_id,
    professorId: r.professor_id,
    data: r.data,
    horaInicioPrevista: r.hora_inicio_prevista,
    horaFimPrevista: r.hora_fim_prevista,
    horaInicioReal: r.hora_inicio_real ?? undefined,
    horaFimReal: r.hora_fim_real ?? undefined,
    status: r.status,
    fotoComprovanteUrl: r.foto_comprovante_url ?? undefined,
    observacoes: r.observacoes ?? undefined,
    justificativaRetroativa: r.justificativa_retroativa ?? undefined,
    statusAprovacao: r.status_aprovacao,
    aprovadoPorUserId: r.aprovado_por_user_id ?? undefined,
    aprovadoEm: r.aprovado_em ?? undefined,
    criadoEm: r.criado_em || r.created_at,
  };
}

function mapBeneficiarioPresenca(r: any): BeneficiarioPresencaApi {
  return {
    id: r.id,
    execucaoAulaId: r.execucao_aula_id,
    beneficiarioId: r.beneficiario_id,
    status: r.status,
    observacao: r.observacao ?? undefined,
  };
}

// ── Objetos ──────────────────────────────────────────────────────────────

export const objetosApi = {
  async list(p?: QP): Promise<Paginated<ObjetoApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('objetos').select('*, concedentes(*), objeto_cargos_previstos(*)', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome', `%${p.busca}%`);
    if (p?.status) q = q.eq('status', String(p.status));
    if (p?.concedenteId) q = q.eq('concedente_id', String(p.concedenteId));
    if (p?.tipoDuracao) q = q.eq('tipo_duracao', String(p.tipoDuracao) as Database['public']['Enums']['tipo_duracao_atividade']);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data: (data ?? []).map(mapObjeto), total: count ?? 0, page, limit };
  },
  async get(id: string): Promise<ObjetoApi> {
    const sb = await getSupabase();
    const { data, error } = await sb.from('objetos').select('*, concedentes(*), objeto_cargos_previstos(*)').eq('id', id).single();
    if (error) throw error;
    return mapObjeto(data);
  },
  async create(body: Record<string, unknown>): Promise<ObjetoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('objetos').insert(toObjetoRow(body)).select('*, concedentes(*), objeto_cargos_previstos(*)').single();
    if (error) throw error;
    if (Array.isArray(body.cargosPrevistos) && data?.id) {
      await objetosApi.syncCargos(data.id, body.cargosPrevistos as Partial<ObjetoCargoPrevistoApi>[]);
      return objetosApi.get(data.id);
    }
    return mapObjeto(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<ObjetoApi> {
    const sb = createClient();
    const { data, error } = await sb.from('objetos').update(toObjetoRow(body)).eq('id', id).select('*, concedentes(*), objeto_cargos_previstos(*)').single();
    if (error) throw error;
    if (Array.isArray(body.cargosPrevistos)) {
      await objetosApi.syncCargos(id, body.cargosPrevistos as Partial<ObjetoCargoPrevistoApi>[]);
      return objetosApi.get(id);
    }
    return mapObjeto(data);
  },
  async syncCargos(objetoId: string, cargos: Partial<ObjetoCargoPrevistoApi>[]): Promise<void> {
    const sb = createClient();
    await sb.from('objeto_cargos_previstos').delete().eq('objeto_id', objetoId);
    if (cargos.length > 0) {
      const inserts = cargos.map((c) => ({
        objeto_id: objetoId,
        cargo_nome: String(c.cargoNome ?? ''),
        quantidade_prevista: Number(c.quantidadePrevista ?? 1),
        remuneracao_mensal: c.remuneracaoMensal !== undefined ? Number(c.remuneracaoMensal) : null,
        carga_horaria_semanal: c.cargaHorariaSemanal ?? null,
      }));
      const { error } = await sb.from('objeto_cargos_previstos').insert(inserts);
      if (error) throw error;
    }
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
    concedente_id: (b.concedenteId as string | null | undefined) || null,
    modalidade_parceria: (b.modalidadeParceria as string | null | undefined) || 'termo_colaboracao',
    numero_processo_adm: (b.numeroProcessoAdm as string | null | undefined) || null,
    edital_numero: (b.editalNumero as string | null | undefined) || null,
    conta_bancaria_banco: (b.contaBancariaBanco as string | null | undefined) || null,
    conta_bancaria_agencia: (b.contaBancariaAgencia as string | null | undefined) || null,
    conta_bancaria_conta: (b.contaBancariaConta as string | null | undefined) || null,
    meta_beneficiarios: Number(b.metaBeneficiarios ?? 0),
    meta_nucleos: Number(b.metaNucleos ?? 0),
    meta_aulas_ano: Number(b.metaAulasAno ?? 0),
    meta_frequencia_minima: Number(b.metaFrequenciaMinima ?? 75),
    meta_vulnerabilidade_minima: Number(b.metaVulnerabilidadeMinima ?? 70),
    meta_eventos_ano: Number(b.metaEventosAno ?? 0),
    meta_reunioes_ano: Number(b.metaReunioesAno ?? 0),
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
    estado: b.estado as string | null | undefined,
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
    tipo_restricao_chamada: b.tipoRestricaoChamada as 'data' | 'horario' | undefined,
    permitir_chamada_retroativa: b.permitirChamadaRetroativa as boolean | undefined,
    tolerancia_inicio_minutos: b.toleranciaInicioMinutos as number | null | undefined,
    tolerancia_fim_minutos: b.toleranciaFimMinutos as number | null | undefined,
    dias_limite_retroativo: b.diasLimiteRetroativo as number | null | undefined,
  } as any;
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
  async listarBeneficiarios(turmaId: string): Promise<BeneficiarioApi[]> {
    const sb = createClient();
    const { data: bTurmas, error } = await (sb.from('beneficiario_turmas') as any)
      .select(`
        turma_id,
        beneficiarios(*, nucleos(identificacao))
      `)
      .eq('turma_id', turmaId)
      .is('deleted_at', null)
      .eq('status', 'ativo');

    if (error) throw error;
    return (bTurmas ?? [])
      .map((bt: any) => bt.beneficiarios ? mapBeneficiario(bt.beneficiarios) : null)
      .filter(Boolean) as BeneficiarioApi[];
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
    if (p?.turmaId) {
      const { data: vinculos, error: eV } = await sb
        .from('beneficiario_turmas')
        .select('beneficiario_id')
        .eq('turma_id', String(p.turmaId))
        .is('deleted_at', null);
      if (eV) throw eV;
      beneficiarioIds = Array.from(new Set((vinculos ?? []).map((v) => v.beneficiario_id)));
      if (beneficiarioIds.length === 0) return { data: [], total: 0, page, limit };
    } else if (p?.atividadeId) {
      const { data: turmas, error: eT } = await sb.from('turmas').select('id').eq('atividade_id', String(p.atividadeId));
      if (eT) throw eT;
      const turmaIds = (turmas ?? []).map((t) => t.id);
      const { data: vinculos, error: eV } = await sb.from('beneficiario_turmas').select('beneficiario_id').in('turma_id', turmaIds.length ? turmaIds : ['00000000-0000-0000-0000-000000000000']);
      if (eV) throw eV;
      beneficiarioIds = Array.from(new Set((vinculos ?? []).map((v) => v.beneficiario_id)));
      if (beneficiarioIds.length === 0) return { data: [], total: 0, page, limit };
    }
    const BENEFICIARIO_FULL_SELECT = '*, nucleos(*), beneficiario_turmas(*, turmas(*, nucleos(*), atividades(*)))';
    let q = sb.from('beneficiarios').select(BENEFICIARIO_FULL_SELECT, { count: 'exact' }).is('deleted_at', null);
    if (p?.nome) q = q.ilike('nome_completo', `%${p.nome}%`);
    if (p?.matricula) q = q.ilike('matricula', `%${p.matricula}%`);
    if (p?.cpf) q = q.ilike('cpf', `%${p.cpf}%`);
    if (p?.status) q = q.eq('status', String(p.status));
    if (p?.tipoMatricula) q = q.eq('tipo_matricula', String(p.tipoMatricula));
    if (p?.nucleoId) q = q.eq('nucleo_id', String(p.nucleoId));
    if (beneficiarioIds) q = q.in('id', beneficiarioIds);
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
      if (beneficiarioIds) qFallback = qFallback.in('id', beneficiarioIds);
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

  async search(term: string, limit = 20): Promise<{ id: string; nomeCompleto: string; cpf?: string }[]> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('beneficiarios')
      .select('id, nome_completo, cpf')
      .is('deleted_at', null)
      .ilike('nome_completo', `%${term}%`)
      .order('nome_completo', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      nomeCompleto: r.nome_completo,
      cpf: r.cpf,
    }));
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
  permiteLogin: boolean;
  exigeConselho: boolean;
  perfilId: string;
  criadoEm: string;
}

function mapFuncao(r: any): FuncaoApi {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? undefined,
    permiteLogin: Boolean(r.permite_login ?? r.permiteLogin ?? false),
    exigeConselho: Boolean(r.exige_conselho ?? r.exigeConselho ?? false),
    perfilId: r.perfil_id ?? '',
    criadoEm: r.created_at,
  };
}

// UUID do perfil Professor / Instrutor para sinalizador is_professor
const PERFIL_PROFESSOR = 'b9def33a-a2a0-477d-8580-ec213d642808';

export const funcoesApi = {
  async list(): Promise<FuncaoApi[]> {
    const sb = await getSupabase();
    const { data } = await (sb.from('funcoes' as any) as any)
      .select('*')
      .is('deleted_at', null)
      .order('nome', { ascending: true });
    return (data ?? []).map(mapFuncao);
  },
  async create(body: { nome: string; descricao?: string; permiteLogin?: boolean; exigeConselho?: boolean; perfilId: string }): Promise<FuncaoApi> {
    const sb = createClient();
    const payload = {
      nome: body.nome,
      descricao: body.descricao,
      permite_login: body.permiteLogin ?? false,
      exige_conselho: body.exigeConselho ?? false,
      perfil_id: body.perfilId,
    };
    const { data, error } = await (sb.from('funcoes' as any) as any).insert(payload).select('*').single();
    if (error) throw error;
    return mapFuncao(data);
  },
  async update(id: string, body: { nome?: string; descricao?: string; permiteLogin?: boolean; exigeConselho?: boolean; perfilId?: string }): Promise<FuncaoApi> {
    const sb = createClient();
    const payload: any = {};
    if (body.nome !== undefined) payload.nome = body.nome;
    if (body.descricao !== undefined) payload.descricao = body.descricao;
    if (body.permiteLogin !== undefined) payload.permite_login = body.permiteLogin;
    if (body.exigeConselho !== undefined) payload.exige_conselho = body.exigeConselho;
    if (body.perfilId !== undefined) payload.perfil_id = body.perfilId;
    const { data, error } = await (sb.from('funcoes' as any) as any).update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    await sincronizarTodosFuncionariosUsuarios().catch(() => {});
    return mapFuncao(data);
  },
  async delete(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await (sb.from('funcoes' as any) as any).update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ── Funcionários ─────────────────────────────────────────────────────────

export const funcionariosApi = {
  async list(p?: QP): Promise<Paginated<FuncionarioApi>> {
    const sb = await getSupabase();
    const { page, limit, from, to } = paginar(num(p?.page), num(p?.limit));
    let q = sb.from('funcionarios').select('*, funcoes:funcao_id(id, nome, perfil_id, permite_login, exige_conselho)', { count: 'exact' }).is('deleted_at', null);
    if (p?.busca) q = q.ilike('nome_completo', `%${p.busca}%`);
    if (p?.funcaoId) q = q.eq('funcao_id', String(p.funcaoId));
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
    const { data, error } = await sb.from('funcionarios').select('*, funcoes:funcao_id(id, nome, perfil_id, permite_login, exige_conselho)').eq('id', id).single();
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
    await resolverESincronizar(sb, data);
    return mapFuncionario(data);
  },
  async update(id: string, body: Record<string, unknown>): Promise<FuncionarioApi> {
    const sb = createClient();
    const { data, error } = await sb.from('funcionarios').update(toFuncionarioRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    await resolverESincronizar(sb, data);
    return mapFuncionario(data);
  },

  async remove(id: string): Promise<void> {
    const sb = createClient();
    const { error } = await sb.from('funcionarios').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

/** Resolve perfil_id do cargo da tabela funcoes via funcao_id e sincroniza o usuario */
async function resolverESincronizar(sb: ReturnType<typeof createClient>, data: any) {
  let funcDb: any = null;
  if (data.funcao_id) {
    const { data: f } = await (sb.from('funcoes' as any) as any)
      .select('id, nome, permite_login, perfil_id')
      .eq('id', data.funcao_id)
      .maybeSingle();
    funcDb = f;
  }
  const permite = Boolean(funcDb?.permite_login);
  const perfilId: string | undefined = funcDb?.perfil_id ?? undefined;
  await sincronizarUsuarioFuncionario(
    sb, data.id, data.nome_completo, data.email ?? undefined, data.status ?? undefined, permite, perfilId
  );
}

export async function sincronizarTodosFuncionariosUsuarios() {
  const sb = await getSupabase();
  const { data: funcs } = await sb.from('funcionarios').select('*').is('deleted_at', null);
  if (!funcs || funcs.length === 0) return;

  const { data: funcoesDb } = await (sb.from('funcoes' as any) as any).select('id, nome, permite_login, perfil_id');
  const funcoesMapById = new Map((funcoesDb ?? []).map((fd: any) => [fd.id, fd]));

  for (const f of funcs) {
    const funcDb: any = f.funcao_id ? funcoesMapById.get(f.funcao_id) : null;
    const permite = Boolean(funcDb?.permite_login);
    const perfilId: string | undefined = funcDb?.perfil_id ?? undefined;

    await sincronizarUsuarioFuncionario(sb as any, f.id, f.nome_completo, f.email, f.status, permite, perfilId);
  }
}

async function sincronizarUsuarioFuncionario(
  sb: ReturnType<typeof createClient>,
  funcionarioId: string,
  nomeCompleto: string,
  email: string | null | undefined,
  status: string | undefined,
  loginHabilitado: boolean,
  perfilId?: string,
) {
  const slugNome = nomeCompleto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

  const emailLower = (email && email.trim())
    ? email.trim().toLowerCase()
    : `${slugNome || 'funcionario'}@andorinha.local`;

  if (!email || !email.trim()) {
    try { await sb.from('funcionarios').update({ email: emailLower }).eq('id', funcionarioId); } catch (_) {}
  }

  const isAtivo = status === 'ativo' || status === 'contratado';
  // is_professor: true apenas quando perfil for exatamente o de Professor/Instrutor
  const isProf = perfilId === PERFIL_PROFESSOR;

  const { data: usrExistente } = await sb.from('usuarios')
    .select('id, email')
    .or(`entidade_id.eq.${funcionarioId},email.eq.${emailLower}`)
    .maybeSingle();

  if (loginHabilitado && isAtivo) {
    const usuarioRow = {
      email: emailLower,
      nome_completo: nomeCompleto,
      tipo: 'funcionario' as const,
      is_professor: isProf,
      ativo: true,
      perfil_id: perfilId || null,
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
    funcao_id: uuidOrNull(b.funcaoId) as any,
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
  } as any;
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
  async inscreverPublico(dadosBeneficiario: Record<string, unknown>, turmaId: string, observacoes?: string, respostas?: unknown): Promise<{ id: string; status: StatusInscricao; matricula: string; beneficiarioId: string; turmaId: string }> {
    const sb = createClient();
    const { data, error } = await sb.rpc('inscrever_beneficiario_publico' as any, {
      p_dados_beneficiario: dadosBeneficiario as never,
      p_turma_id: turmaId,
      p_observacoes: observacoes,
      p_respostas: respostas as never,
    });
    if (error) throw error;
    return data as any;
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
    await sincronizarTodosFuncionariosUsuarios().catch(() => {});
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

function extrairOrganizacoes(nucleos: any[]): { id: string; nome: string; estado?: string }[] {
  const orgMap = new Map<string, { id: string; nome: string; estado?: string }>();
  for (const n of nucleos) {
    if (n.organizacoes && !orgMap.has(n.organizacoes.id)) {
      orgMap.set(n.organizacoes.id, {
        id: n.organizacoes.id,
        nome: n.organizacoes.nome,
        estado: n.organizacoes.estado ?? undefined,
      });
    } else if (n.organizacao && !orgMap.has(n.organizacao.id)) {
      orgMap.set(n.organizacao.id, {
        id: n.organizacao.id,
        nome: n.organizacao.nome,
        estado: n.organizacao.estado ?? undefined,
      });
    }
  }
  return Array.from(orgMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function montarResumo(
  totalBeneficiarios: number,
  aprovados: any[],
  nucleos: any[],
  funcionarios: { status: string }[],
  turmas: { id: string; atividade_id: string; vagas_totais: number }[],
  atividades: { id: string; nome: string; disponivel_pre_inscricao?: boolean }[],
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

  const atividadesEsportivas = atividades.filter(
    (a) => a.disponivel_pre_inscricao !== false && !a.nome.toLowerCase().includes("planejamento")
  );

  const distribuicaoPorModalidade = atividadesEsportivas
    .map((a) => ({
      nome: a.nome,
      total: turmas.filter((t) => t.atividade_id === a.id).reduce((acc, t) => acc + (ocupacaoPorTurma.get(t.id) ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);

  const turmasPorNucleo = new Map<string, { vagas: number; ids: string[]; atividadeIds: Set<string> }>();
  for (const t of turmas) {
    const nid = (t as any).nucleo_id;
    if (!nid) continue;
    const atual = turmasPorNucleo.get(nid) || { vagas: 0, ids: [], atividadeIds: new Set<string>() };
    atual.vagas += t.vagas_totais || 0;
    atual.ids.push(t.id);
    if (t.atividade_id) atual.atividadeIds.add(t.atividade_id);
    turmasPorNucleo.set(nid, atual);
  }

  const mapaNucleos = nucleos.map((n) => {
    const infoTurmas = turmasPorNucleo.get(n.id) || { vagas: 0, ids: [], atividadeIds: new Set<string>() };
    const vagasDoNucleo = infoTurmas.vagas;
    let matriculadosDoNucleo = 0;
    for (const tid of infoTurmas.ids) {
      matriculadosDoNucleo += ocupacaoPorTurma.get(tid) || 0;
    }
    if (matriculadosDoNucleo === 0 && porNucleo.has(n.id)) {
      matriculadosDoNucleo = porNucleo.get(n.id) || 0;
    }
    const taxaOcupacao = vagasDoNucleo > 0 ? (matriculadosDoNucleo / vagasDoNucleo) * 100 : 0;

    const ativSet = new Set<string>(infoTurmas.atividadeIds);
    if (Array.isArray(n.nucleo_atividades)) {
      n.nucleo_atividades.forEach((na: any) => {
        if (na?.atividade_id) ativSet.add(na.atividade_id);
      });
    }

    return {
      id: n.id,
      identificacao: n.identificacao,
      nomeLocal: n.nome_local ?? undefined,
      cep: n.cep ?? undefined,
      endereco: n.endereco ?? undefined,
      numero: n.numero ?? undefined,
      bairro: n.bairro ?? undefined,
      cidade: n.cidade ?? undefined,
      estado: n.estado ?? undefined,
      complemento: n.complemento ?? undefined,
      latitude: n.latitude ? Number(n.latitude) : undefined,
      longitude: n.longitude ? Number(n.longitude) : undefined,
      emFuncionamento: n.em_funcionamento !== false,
      organizacaoId: n.organizacao_id || n.organizacaoId,
      organizacaoNome: (n.organizacoes || n.organizacao)?.nome,
      totalVagas: vagasDoNucleo,
      totalMatriculados: matriculadosDoNucleo,
      vagasLivres: Math.max(0, vagasDoNucleo - matriculadosDoNucleo),
      taxaOcupacao: Number(taxaOcupacao.toFixed(1)),
      atividadeIds: Array.from(ativSet),
    };
  });

  const nucleosDetalhados = nucleos.map((n) => ({
    id: n.id,
    identificacao: n.identificacao,
    cidade: n.cidade ?? undefined,
    estado: n.estado ?? undefined,
    organizacaoId: n.organizacao_id || n.organizacaoId,
    organizacao: n.organizacoes || n.organizacao ? {
      id: (n.organizacoes || n.organizacao).id,
      nome: (n.organizacoes || n.organizacao).nome,
      estado: (n.organizacoes || n.organizacao).estado ?? undefined,
      cidade: (n.organizacoes || n.organizacao).cidade ?? undefined,
    } : undefined,
  }));

  const organizacoes = extrairOrganizacoes(nucleos);

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
    totalModalidades: atividadesEsportivas.length,
    topNucleos,
    distribuicaoPorModalidade,
    mapaNucleos,
    nucleosDetalhados,
    organizacoes,
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
      sb.from('nucleos').select('id, identificacao, nome_local, cep, endereco, numero, bairro, cidade, estado, complemento, latitude, longitude, em_funcionamento, organizacao_id, organizacoes(id, nome, estado, cidade), nucleo_atividades(atividade_id)').is('deleted_at', null),
      sb.from('funcionarios').select('status').is('deleted_at', null),
      sb.from('turmas').select('id, nucleo_id, atividade_id, vagas_totais').is('deleted_at', null),
      sb.from('atividades').select('id, nome, disponivel_pre_inscricao').is('deleted_at', null),
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

export interface SlotAulaGrid {
  id: string;
  turmaId: string;
  turmaNome: string;
  dia: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';
  diaSemanaNum: number;
  inicio: number;
  fim: number;
  horaInicioRaw?: string;
  horaFimRaw?: string;
  duracaoHoras?: number;
  atividadeId?: string;
  atividadeNome?: string;
  nucleoId?: string;
  nucleoNome?: string;
}

export const areaProfessorApi = {
  async getDadosProfessor(userId: string) {
    const sb = createClient();

    const { data: usuario } = await (sb.from('usuarios') as any)
      .select('id, nome_completo, email, tipo, perfil_id, entidade_id')
      .eq('id', userId)
      .maybeSingle();

    const funcionarioId = usuario?.entidade_id;

    let funcionario = null;
    if (funcionarioId) {
      const { data: f } = await (sb.from('funcionarios') as any)
        .select('*, nucleos(*)')
        .eq('id', funcionarioId)
        .maybeSingle();
      funcionario = f ? mapFuncionario(f) : null;
    }

    const isAdmin = usuario?.tipo === 'admin';

    let turmaIds: string[] = [];
    if (!isAdmin && funcionarioId) {
      const { data: resp } = await (sb.from('turma_responsaveis') as any)
        .select('turma_id')
        .eq('funcionario_id', funcionarioId);
      turmaIds = (resp ?? []).map((r: any) => r.turma_id);
    }

    let queryTurmas = sb.from('turmas').select(`
      *,
      nucleos(*),
      atividades(*),
      turma_horarios(*),
      turma_responsaveis(*, funcionarios(nome_completo))
    `).is('deleted_at', null);

    if (!isAdmin && turmaIds.length > 0) {
      queryTurmas = queryTurmas.in('id', turmaIds);
    } else if (!isAdmin && funcionarioId) {
      if (funcionario?.nucleoId) {
        queryTurmas = queryTurmas.eq('nucleo_id', funcionario.nucleoId);
      }
    }

    const { data: turmasRaw } = await queryTurmas;
    const turmasMapped = (turmasRaw ?? []).map(mapTurma);

    const slotsGrid: SlotAulaGrid[] = [];
    (turmasRaw ?? []).forEach((t: any) => {
      const horarios = t.turma_horarios ?? [];
      horarios.forEach((th: any) => {
        const hInicioStr = String(th.hora_inicio || '08:00');
        const hFimStr = String(th.hora_fim || '10:00');
        const [hIn, mIn] = hInicioStr.split(':').map(Number);
        const [hFim, mFim] = hFimStr.split(':').map(Number);
        const inicioDec = (hIn || 0) + ((mIn || 0) / 60);
        const fimDec = (hFim || 0) + ((mFim || 0) / 60);
        const duracao = Math.max(0.5, fimDec - inicioDec);

        slotsGrid.push({
          id: th.id || `${t.id}-${th.dia_semana}`,
          turmaId: t.id,
          turmaNome: t.nome,
          dia: (DIA_KEY_MAP[th.dia_semana] as any) || 'Seg',
          diaSemanaNum: th.dia_semana,
          inicio: isNaN(hIn) ? 8 : hIn,
          fim: isNaN(hFim) ? 10 : hFim,
          horaInicioRaw: hInicioStr.slice(0, 5),
          horaFimRaw: hFimStr.slice(0, 5),
          duracaoHoras: Number(duracao.toFixed(2)),
          atividadeId: t.atividade_id,
          atividadeNome: t.atividades?.nome,
          nucleoId: t.nucleo_id,
          nucleoNome: t.nucleos?.identificacao,
        });
      });
    });

    const targetTurmaIds = turmasMapped.map((t) => t.id);
    let beneficiariosMapped: BeneficiarioApi[] = [];

    if (targetTurmaIds.length > 0) {
      const { data: bTurmas } = await (sb.from('beneficiario_turmas') as any)
        .select(`
          turma_id,
          beneficiarios(*, nucleos(identificacao))
        `)
        .in('turma_id', targetTurmaIds)
        .is('deleted_at', null)
        .eq('status', 'ativo');

      const bMap = new Map<string, any>();
      (bTurmas ?? []).forEach((bt: any) => {
        if (bt.beneficiarios) {
          bMap.set(bt.beneficiarios.id, mapBeneficiario(bt.beneficiarios));
        }
      });
      beneficiariosMapped = Array.from(bMap.values());
    }

    // Buscar registro de ponto hoje para o colaborador
    let pontoHoje: { entrada?: string; saida?: string; registrado: boolean } = { registrado: false };
    if (funcionarioId) {
      const dataHojeStr = new Date().toISOString().split('T')[0];
      const { data: pontos } = await (sb.from('registros_ponto') as any)
        .select('*')
        .eq('funcionario_id', funcionarioId)
        .eq('data', dataHojeStr);

      if (pontos && pontos.length > 0) {
        const entrada = pontos.find((p: any) => p.tipo === 'entrada')?.hora;
        const saida = pontos.find((p: any) => p.tipo === 'saida')?.hora;
        pontoHoje = {
          entrada: entrada ? String(entrada).slice(0, 5) : undefined,
          saida: saida ? String(saida).slice(0, 5) : undefined,
          registrado: Boolean(entrada || saida),
        };
      }
    }

    return {
      usuario,
      funcionario,
      turmas: turmasMapped,
      slotsGrid,
      beneficiarios: beneficiariosMapped,
      pontoHoje,
      isAdmin,
    };
  },

  async salvarPresencas(payload: { turmaId: string; dataAula: string; presencas: Array<{ beneficiarioId: string; presente: boolean }> }) {
    const sb = createClient();
    const rows = payload.presencas.map((p) => ({
      turma_id: payload.turmaId,
      data: payload.dataAula,
      beneficiario_id: p.beneficiarioId,
      presente: p.presente,
      status: p.presente ? 'presente' : 'falta',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await (sb.from('registros_presenca') as any)
      .upsert(rows, { onConflict: 'turma_id,data,beneficiario_id' });

    if (error) throw error;
    return true;
  },

  async salvarAplicacaoAtividade(payload: { turmaId: string; funcionarioId: string; dataAula: string; horaInicio: string; horaFim?: string; descricao: string; fotoUrl?: string }) {
    const sb = createClient();
    const { error: errConf } = await (sb.from('confirmacoes_atividade') as any).insert({
      turma_id: payload.turmaId,
      enviado_por: payload.funcionarioId,
      data: payload.dataAula,
      observacao: payload.descricao,
      storage_key: payload.fotoUrl || null,
    });

    if (errConf) console.warn("Aviso ao salvar confirmacoes_atividade:", errConf.message);

    const { error: errPonto } = await (sb.from('registros_ponto') as any).insert({
      funcionario_id: payload.funcionarioId,
      data: payload.dataAula,
      tipo: 'entrada',
      hora: payload.horaInicio,
      status: 'confirmado',
      observacao: `Atividade ministrada na turma: ${payload.descricao}`,
    });

    if (errPonto) console.warn("Aviso ao salvar registros_ponto:", errPonto.message);

    return true;
  },

  async buscarPresencasTurma(turmaId: string, dataAula?: string) {
    const sb = createClient();
    let q = (sb.from('registros_presenca') as any)
      .select('*')
      .eq('turma_id', turmaId);
    if (dataAula) {
      q = q.eq('data', dataAula);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async salvarBatidaPonto(payload: { funcionarioId: string; tipo: 'entrada' | 'saida'; data?: string; hora?: string; observacao?: string }) {
    const sb = createClient();
    const dataHoje = payload.data || getDataHojeBrasil();
    const horaAtual = payload.hora || `${getHoraAgoraBrasil()}:00`;
    
    const { data, error } = await (sb.from('registros_ponto') as any).insert({
      funcionario_id: payload.funcionarioId,
      data: dataHoje,
      tipo: payload.tipo,
      hora: horaAtual,
      status: 'ok',
      observacao: payload.observacao || null,
    }).select().single();

    if (error && !error.message?.includes('duplicate key')) throw error;
    return data || true;
  },

  async uploadComprovacao(file: File | Blob, nomeArquivo: string): Promise<string> {
    const sb = createClient();
    const extension = nomeArquivo.split('.').pop() || 'jpg';
    const path = `atividades/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const { data, error } = await sb.storage.from('comprovacoes').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (error) throw error;
    return data.path;
  },
};

export const professoresApi = areaProfessorApi;

export const execucoesAulaApi = {
  async iniciarAula(params: {
    turmaId: string;
    professorId: string;
    data: string;
    horaInicioPrevista: string;
    horaFimPrevista: string;
    justificativaRetroativa?: string;
  }): Promise<ExecucaoAulaApi> {
    const sb = createClient();
    const now = new Date();
    const horaPonto = `${getHoraAgoraBrasil()}:00`;
    const isPendente = Boolean(params.justificativaRetroativa && params.justificativaRetroativa.trim().length > 0);

    // Bloqueio absoluto: data futura
    const hojeISO = now.toISOString().slice(0, 10);
    if (params.data > hojeISO) {
      throw new Error('Não é permitido iniciar uma aula em data futura.');
    }

    // Bloqueia se tiver aula auto-encerrada pendente de confirmação
    const { data: autoEncerradas } = await (sb as any).from('execucoes_aula')
      .select('id')
      .eq('professor_id', params.professorId)
      .eq('status', 'encerrada_automaticamente')
      .limit(1)
      .maybeSingle();

    if (autoEncerradas) {
      throw new Error('Você possui uma aula encerrada automaticamente que precisa ser confirmada antes de iniciar uma nova.');
    }

    // Evita duplicatas: se já existir aula em andamento para a turma na data, retorna ela
    const { data: existente } = await (sb as any).from('execucoes_aula')
      .select('*')
      .eq('turma_id', params.turmaId)
      .eq('data', params.data)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existente) {
      return mapExecucaoAula(existente);
    }

    const payload = {
      turma_id: params.turmaId,
      professor_id: params.professorId,
      data: params.data,
      hora_inicio_prevista: params.horaInicioPrevista,
      hora_fim_prevista: params.horaFimPrevista,
      hora_inicio_real: now.toISOString(),
      status: isPendente ? 'pendente_aprovacao' : 'em_andamento',
      status_aprovacao: isPendente ? 'pendente_aprovacao' : 'aprovado',
      justificativa_retroativa: params.justificativaRetroativa || null,
    };

    const { data, error } = await (sb as any).from('execucoes_aula')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const mapped = mapExecucaoAula(data);

    if (!isPendente && params.professorId) {
      try {
        await (sb as any).from('registros_ponto').insert({
          funcionario_id: params.professorId,
          data: params.data,
          tipo: 'entrada',
          hora: horaPonto,
          status: 'ok',
          observacao: `Início de aula - Turma ${params.turmaId}`,
        });
      } catch (e) {
        console.warn('Aviso ao registrar ponto de entrada:', e);
      }
    }

    return mapped;
  },

  async salvarPresencas(
    execucaoAulaId: string,
    presencas: Array<{
      beneficiarioId: string;
      status: 'presente' | 'falta' | 'falta_justificada';
      observacao?: string;
    }>
  ): Promise<BeneficiarioPresencaApi[]> {
    if (!presencas || presencas.length === 0) return [];
    const sb = createClient();
    const rows = presencas.map((p) => ({
      execucao_aula_id: execucaoAulaId,
      beneficiario_id: p.beneficiarioId,
      status: p.status,
      observacao: p.observacao || null,
    }));

    const { data: upsertData, error: upsertErr } = await (sb as any).from('beneficiario_presencas')
      .upsert(rows, { onConflict: 'execucao_aula_id,beneficiario_id' })
      .select('*');

    if (upsertErr) {
      await (sb as any).from('beneficiario_presencas')
        .delete()
        .eq('execucao_aula_id', execucaoAulaId);

      const { data: insData, error: insErr } = await (sb as any).from('beneficiario_presencas')
        .insert(rows)
        .select('*');

      if (insErr) throw insErr;
      return (insData ?? []).map(mapBeneficiarioPresenca);
    }

    return (upsertData ?? []).map(mapBeneficiarioPresenca);
  },

  async getPresencas(execucaoAulaId: string): Promise<BeneficiarioPresencaApi[]> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('beneficiario_presencas')
      .select('*')
      .eq('execucao_aula_id', execucaoAulaId);

    if (error) throw error;
    return (data ?? []).map(mapBeneficiarioPresenca);
  },

  async getExecucao(turmaId: string, data?: string): Promise<ExecucaoAulaApi | null> {
    const sb = await getSupabase();

    // 1. Prioridade: se houver aula em andamento para esta turma, recupera ela
    const { data: emAndamento, error: errAndamento } = await (sb as any).from('execucoes_aula')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('status', 'em_andamento')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!errAndamento && emAndamento) {
      return mapExecucaoAula(emAndamento);
    }

    // 2. Se informada a data, busca por data
    if (data) {
      const { data: execData, error } = await (sb as any).from('execucoes_aula')
        .select('*')
        .eq('turma_id', turmaId)
        .eq('data', data)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return execData ? mapExecucaoAula(execData) : null;
    }

    return null;
  },

  async getById(id: string): Promise<ExecucaoAulaApi | null> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('execucoes_aula')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapExecucaoAula(data) : null;
  },

  async finalizarAula(
    id: string,
    params: { fotoComprovanteUrl: string; observacoes?: string }
  ): Promise<ExecucaoAulaApi> {
    const sb = createClient();
    const now = new Date();
    const horaPonto = `${getHoraAgoraBrasil()}:00`;

    const { data: execData, error } = await (sb as any).from('execucoes_aula')
      .update({
        hora_fim_real: now.toISOString(),
        status: 'concluida',
        foto_comprovante_url: params.fotoComprovanteUrl,
        observacoes: params.observacoes || null,
        atualizado_em: now.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    const mapped = mapExecucaoAula(execData);

    if (mapped.professorId) {
      try {
        await (sb as any).from('registros_ponto').insert({
          funcionario_id: mapped.professorId,
          data: mapped.data,
          tipo: 'saida',
          hora: horaPonto,
          status: 'ok',
          observacao: `Fim de aula - Turma ${mapped.turmaId}`,
        });
      } catch (e) {
        console.warn('Aviso ao registrar ponto de saída:', e);
      }
    }

    return mapped;
  },

  async listPendencias(p?: { nucleoId?: string }): Promise<ExecucaoAulaApi[]> {
    const sb = createClient();
    let q = (sb as any).from('execucoes_aula')
      .select('*, turmas!inner(id, nucleo_id)')
      .eq('status_aprovacao', 'pendente_aprovacao');

    if (p?.nucleoId) {
      q = q.eq('turmas.nucleo_id', p.nucleoId);
    }

    const { data, error } = await q.order('criado_em', { ascending: false });
    if (error) {
      let simpleQ = (sb as any).from('execucoes_aula')
        .select('*')
        .eq('status_aprovacao', 'pendente_aprovacao')
        .order('criado_em', { ascending: false });
      const { data: simpleData, error: simpleErr } = await simpleQ;
      if (simpleErr) throw simpleErr;
      return (simpleData ?? []).map(mapExecucaoAula);
    }
    return (data ?? []).map(mapExecucaoAula);
  },

  async countPendencias(): Promise<number> {
    const sb = await getSupabase();
    const { count, error } = await (sb as any).from('execucoes_aula')
      .select('id', { count: 'exact', head: true })
      .eq('status_aprovacao', 'pendente_aprovacao');
    if (error) return 0;
    return count ?? 0;
  },

  async avaliarPendencia(
    id: string,
    params: { aprovado: boolean; userId: string; motivoRejeicao?: string }
  ): Promise<ExecucaoAulaApi> {
    const sb = createClient();
    const now = new Date().toISOString();
    const status = params.aprovado ? 'concluida' : 'rejeitada';
    const statusAprovacao = params.aprovado ? 'aprovado' : 'rejeitado';

    const updatePayload: any = {
      status,
      status_aprovacao: statusAprovacao,
      aprovado_por_user_id: params.userId,
      aprovado_em: now,
    };

    if (params.motivoRejeicao) {
      updatePayload.observacoes = params.motivoRejeicao;
    }

    const { data: execData, error } = await (sb as any).from('execucoes_aula')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    const mapped = mapExecucaoAula(execData);

    if (params.aprovado && mapped.professorId) {
      try {
        const horaEntrada = mapped.horaInicioReal || mapped.horaInicioPrevista || '08:00';
        const horaSaida = mapped.horaFimReal || mapped.horaFimPrevista || '10:00';

        await (sb as any).from('registros_ponto').insert([
          {
            funcionario_id: mapped.professorId,
            data: mapped.data,
            tipo: 'entrada',
            hora: horaEntrada.length === 5 ? `${horaEntrada}:00` : horaEntrada,
            status: 'ok',
            observacao: `Aprovação de aula retroativa - Turma ${mapped.turmaId}`,
          },
          {
            funcionario_id: mapped.professorId,
            data: mapped.data,
            tipo: 'saida',
            hora: horaSaida.length === 5 ? `${horaSaida}:00` : horaSaida,
            status: 'ok',
            observacao: `Aprovação de aula retroativa - Turma ${mapped.turmaId}`,
          },
        ]);
      } catch (e) {
        console.warn('Aviso ao registrar ponto na aprovação:', e);
      }
    }

    return mapped;
  },

  async listAll(p?: { turmaId?: string; professorId?: string; status?: string; data?: string; limit?: number }): Promise<ExecucaoAulaApi[]> {
    const sb = await getSupabase();
    let q = (sb as any).from('execucoes_aula').select('*');

    if (p?.turmaId) q = q.eq('turma_id', p.turmaId);
    if (p?.professorId) q = q.eq('professor_id', p.professorId);
    if (p?.status) q = q.eq('status', p.status);
    if (p?.data) q = q.eq('data', p.data);

    const { data, error } = await q.order('criado_em', { ascending: false }).limit(p?.limit || 200);
    if (error) throw error;
    return (data ?? []).map(mapExecucaoAula);
  },

  async getAutoEncerradas(professorId: string): Promise<ExecucaoAulaApi[]> {
    const sb = await getSupabase();
    const { data, error } = await (sb as any).from('execucoes_aula')
      .select('*')
      .eq('professor_id', professorId)
      .eq('status', 'encerrada_automaticamente')
      .order('criado_em', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapExecucaoAula);
  },

  async confirmarEncerramento(
    id: string,
    params: {
      fotoComprovanteUrl?: string;
      observacoes?: string;
      divergencia?: boolean;
      justificativaDivergencia?: string;
    }
  ): Promise<ExecucaoAulaApi> {
    const sb = createClient();
    const updatePayload: Record<string, unknown> = {
      status: 'concluida',
      atualizado_em: new Date().toISOString(),
    };

    if (params.fotoComprovanteUrl) {
      updatePayload.foto_comprovante_url = params.fotoComprovanteUrl;
    }

    if (params.divergencia && params.justificativaDivergencia) {
      updatePayload.status_aprovacao = 'pendente_aprovacao';
      updatePayload.observacoes = `[DIVERGÊNCIA DE HORÁRIO] ${params.justificativaDivergencia}`;
    } else if (params.observacoes) {
      updatePayload.observacoes = params.observacoes;
    }

    const { data, error } = await (sb as any).from('execucoes_aula')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return mapExecucaoAula(data);
  },
};

export const registrosPontoApi = {
  async listByFuncionarioMes(funcionarioId: string, ano: number, mes: number) {
    const sb = await getSupabase();
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`;
    const { data, error } = await (sb as any).from('registros_ponto')
      .select('*')
      .eq('funcionario_id', funcionarioId)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async salvar(funcionarioId: string, registros: { data: string; entrada?: string; saida?: string; observacao?: string }[]): Promise<void> {
    const sb = createClient();
    for (const reg of registros) {
      if (reg.entrada) {
        await (sb as any).from('registros_ponto').upsert({
          funcionario_id: funcionarioId,
          data: reg.data,
          tipo: 'entrada',
          hora: reg.entrada + ':00',
          status: 'presente',
          observacao: reg.observacao || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'funcionario_id,data,tipo', ignoreDuplicates: false });
      }
      if (reg.saida) {
        await (sb as any).from('registros_ponto').upsert({
          funcionario_id: funcionarioId,
          data: reg.data,
          tipo: 'saida',
          hora: reg.saida + ':00',
          status: 'presente',
          observacao: reg.observacao || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'funcionario_id,data,tipo', ignoreDuplicates: false });
      }
    }
  },
};

// ============================================================
// Re-exports: Estoque, Supervisao, Pendencias
// ============================================================
export type { MaterialApi, EstoqueNucleoApi, MovimentacaoEstoqueApi, TermoEntregaApi } from './estoque';
export { materiaisApi, estoqueNucleosApi, movimentacoesEstoqueApi, termosEntregaApi } from './estoque';

export type { AvaliacaoNivel, SupervisaoFotoApi, SupervisaoApi } from './supervisoes';
export { supervisoesApi, supervisoesFotosApi } from './supervisoes';

export type { TipoPendencia, GravidadePendencia, StatusPendencia, PendenciaGeralApi } from './pendencias';
export { pendenciasGeraisApi } from './pendencias';

export type { ConcedenteApi } from './concedentes';
export { concedentesApi } from './concedentes';

export type { TipoAtividadeComplementar, AtividadeComplementarApi } from './atividadesComplementares';
export { atividadesComplementaresApi } from './atividadesComplementares';

export type {
  AlertaProntidao,
  IndicadorMetaExecucao,
  ExecucaoNucleoItem,
  DemonstrativoBeneficiarios,
  FrequenciaNucleoItem,
  AulaRealizadaItem,
  VisitaSupervisaoItem,
  CargoRHItem,
  ProfissionalItem,
  MaterialItem,
  FotoComprovacaoItem,
  OcorrenciaItem,
  DadosRelatorioPrestacaoContas,
} from './prestacaoContas';
export { prestacaoContasApi } from './prestacaoContas';
