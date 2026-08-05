import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
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
  status: 'ativo' | 'encerrado' | 'planejado';
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
  objetoId?: string;
  status: 'ativa' | 'inativa';
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
  dataInicio: string;
  dataFechamento?: string;
  emFuncionamento: boolean;
  disponivelPreInscricao: boolean;
  criadoEm: string;
}

export interface AtividadeApi {
  id: string;
  nome: string;
  disponivelPreInscricao: boolean;
  turnos: string[];
  idadeMinima?: number;
  idadeMaxima?: number;
  perguntas: { id: string; pergunta: string; disponivelInscricao: boolean }[];
  criadoEm: string;
}

export interface TurmaApi {
  id: string;
  nome: string;
  nucleoId: string;
  atividadeId: string;
  responsaveis: string[];
  vagasTotais: number;
  exclusiva: boolean;
  dataInicio: string;
  criadoEm: string;
  nucleo?: NucleoApi;
  atividade?: AtividadeApi;
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
  status: string;
  tipoMatricula: string;
  celular: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cpf?: string;
  fotoUrl?: string;
  criadoEm: string;
}

export interface FuncionarioApi {
  id: string;
  matricula: string;
  nomeCompleto: string;
  fotoUrl?: string;
  status: string;
  funcao: string;
  dataAdmissao: string;
  nucleoId?: string;
  alocadoEm: string;
  criadoEm: string;
}

export interface EquipamentoApi {
  id: string;
  nome: string;
  categoria: string;
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
  criadoEm: string;
  turma?: TurmaApi;
  beneficiario?: BeneficiarioApi;
}

export interface UsuarioApi {
  id: string;
  email: string;
  nomeCompleto: string;
  tipo: string;
  ativo: boolean;
  perfilId: string;
  entidadeId?: string;
  criadoEm: string;
}

export interface PerfilApi {
  id: string;
  nome: string;
  descricao?: string;
  permissoes: { modulo: string; acoes: string[] }[];
  criadoEm: string;
}

export interface ConfiguracaoApi {
  id: string;
  chave: string;
  valor: string;
}

// ── Helpers de query ───────────────────────────────────────────────────────

type QP = Record<string, string | number | boolean | undefined>;

function qs(params?: QP): string {
  if (!params) return '';
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

// ── Serviços ───────────────────────────────────────────────────────────────

const V1 = '/api/v1';

// Objetos
export const objetosApi = {
  list: (p?: QP) => apiGet<Paginated<ObjetoApi>>(`${V1}/objetos${qs(p)}`),
  get: (id: string) => apiGet<ObjetoApi>(`${V1}/objetos/${id}`),
  create: (body: unknown) => apiPost<ObjetoApi>(`${V1}/objetos`, body),
  update: (id: string, body: unknown) => apiPut<ObjetoApi>(`${V1}/objetos/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/objetos/${id}`),
};

// Organizações
export const organizacoesApi = {
  list: (p?: QP) => apiGet<Paginated<OrganizacaoApi>>(`${V1}/organizacoes${qs(p)}`),
  get: (id: string) => apiGet<OrganizacaoApi>(`${V1}/organizacoes/${id}`),
  create: (body: unknown) => apiPost<OrganizacaoApi>(`${V1}/organizacoes`, body),
  update: (id: string, body: unknown) => apiPut<OrganizacaoApi>(`${V1}/organizacoes/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/organizacoes/${id}`),
};

// Núcleos
export const nucleosApi = {
  list: (p?: QP) => apiGet<Paginated<NucleoApi>>(`${V1}/nucleos${qs(p)}`),
  get: (id: string) => apiGet<NucleoApi>(`${V1}/nucleos/${id}`),
  create: (body: unknown) => apiPost<NucleoApi>(`${V1}/nucleos`, body),
  update: (id: string, body: unknown) => apiPut<NucleoApi>(`${V1}/nucleos/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/nucleos/${id}`),
};

// Atividades
export const atividadesApi = {
  list: (p?: QP) => apiGet<Paginated<AtividadeApi>>(`${V1}/atividades${qs(p)}`),
  get: (id: string) => apiGet<AtividadeApi>(`${V1}/atividades/${id}`),
  create: (body: unknown) => apiPost<AtividadeApi>(`${V1}/atividades`, body),
  update: (id: string, body: unknown) => apiPut<AtividadeApi>(`${V1}/atividades/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/atividades/${id}`),
};

// Turmas
export const turmasApi = {
  list: (p?: QP) => apiGet<Paginated<TurmaApi>>(`${V1}/turmas${qs(p)}`),
  get: (id: string) => apiGet<TurmaApi>(`${V1}/turmas/${id}`),
  create: (body: unknown) => apiPost<TurmaApi>(`${V1}/turmas`, body),
  update: (id: string, body: unknown) => apiPut<TurmaApi>(`${V1}/turmas/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/turmas/${id}`),
};

// Beneficiários
export const beneficiariosApi = {
  list: (p?: QP) => apiGet<Paginated<BeneficiarioApi>>(`${V1}/beneficiarios${qs(p)}`),
  get: (id: string) => apiGet<BeneficiarioApi>(`${V1}/beneficiarios/${id}`),
  create: (body: unknown) => apiPost<BeneficiarioApi>(`${V1}/beneficiarios`, body),
  update: (id: string, body: unknown) => apiPut<BeneficiarioApi>(`${V1}/beneficiarios/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/beneficiarios/${id}`),
};

// Funcionários
export const funcionariosApi = {
  list: (p?: QP) => apiGet<Paginated<FuncionarioApi>>(`${V1}/funcionarios${qs(p)}`),
  get: (id: string) => apiGet<FuncionarioApi>(`${V1}/funcionarios/${id}`),
  create: (body: unknown) => apiPost<FuncionarioApi>(`${V1}/funcionarios`, body),
  update: (id: string, body: unknown) => apiPut<FuncionarioApi>(`${V1}/funcionarios/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/funcionarios/${id}`),
};

// Equipamentos
export const equipamentosApi = {
  list: (p?: QP) => apiGet<Paginated<EquipamentoApi>>(`${V1}/equipamentos${qs(p)}`),
  get: (id: string) => apiGet<EquipamentoApi>(`${V1}/equipamentos/${id}`),
  create: (body: unknown) => apiPost<EquipamentoApi>(`${V1}/equipamentos`, body),
  update: (id: string, body: unknown) => apiPut<EquipamentoApi>(`${V1}/equipamentos/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/equipamentos/${id}`),
};

// Inscrições
export const inscricoesApi = {
  list: (p?: QP) => apiGet<Paginated<InscricaoApi>>(`${V1}/inscricoes${qs(p)}`),
  get: (id: string) => apiGet<InscricaoApi>(`${V1}/inscricoes/${id}`),
  create: (body: unknown) => apiPost<InscricaoApi>(`${V1}/inscricoes`, body),
  update: (id: string, body: unknown) => apiPut<InscricaoApi>(`${V1}/inscricoes/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/inscricoes/${id}`),
};

// Usuários
export const usuariosApi = {
  list: (p?: QP) => apiGet<Paginated<UsuarioApi>>(`${V1}/usuarios${qs(p)}`),
  get: (id: string) => apiGet<UsuarioApi>(`${V1}/usuarios/${id}`),
  create: (body: unknown) => apiPost<UsuarioApi>(`${V1}/usuarios`, body),
  update: (id: string, body: unknown) => apiPut<UsuarioApi>(`${V1}/usuarios/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/usuarios/${id}`),
};

// Perfis
export const perfisApi = {
  list: (p?: QP) => apiGet<Paginated<PerfilApi>>(`${V1}/usuarios/perfis${qs(p)}`),
  get: (id: string) => apiGet<PerfilApi>(`${V1}/usuarios/perfis/${id}`),
  create: (body: unknown) => apiPost<PerfilApi>(`${V1}/usuarios/perfis`, body),
  update: (id: string, body: unknown) => apiPut<PerfilApi>(`${V1}/usuarios/perfis/${id}`, body),
  remove: (id: string) => apiDelete(`${V1}/usuarios/perfis/${id}`),
};

// Configurações
export const configuracoesApi = {
  list: () => apiGet<ConfiguracaoApi[]>(`${V1}/configuracoes`),
  get: (chave: string) => apiGet<ConfiguracaoApi>(`${V1}/configuracoes/${chave}`),
  upsert: (chave: string, valor: string) => apiPut<ConfiguracaoApi>(`${V1}/configuracoes`, { chave, valor }),
  remove: (chave: string) => apiDelete(`${V1}/configuracoes/${chave}`),
};

// IBGE
export const ibgeApi = {
  ufs: () => apiGet<{ id: number; sigla: string; nome: string }[]>(`${V1}/ibge/ufs`),
  municipios: (uf: string) => apiGet<{ id: number; nome: string }[]>(`${V1}/ibge/ufs/${uf}/municipios`),
};

// Presença
export const presencaApi = {
  list: (p?: QP) => apiGet<Paginated<{ id: string; turmaId: string; beneficiarioId: string; data: string; status: string; criadoEm: string }>>(`${V1}/presenca${qs(p)}`),
  registrar: (body: unknown) => apiPost(`${V1}/presenca`, body),
};

// Ponto
export const pontoApi = {
  list: (p?: QP) => apiGet<Paginated<{ id: string; funcionarioId: string; data: string; status: string; criadoEm: string }>>(`${V1}/ponto${qs(p)}`),
  registrar: (body: unknown) => apiPost(`${V1}/ponto`, body),
};

// Relatórios
export const relatoriosApi = {
  download: (modulo: string, format: 'pdf' | 'excel', params?: QP) =>
    `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/relatorios/${modulo}?format=${format}${params ? '&' + Object.entries(params).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join('&') : ''}`,
};
