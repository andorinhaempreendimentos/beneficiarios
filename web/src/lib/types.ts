// Tipos centrais do domínio Andorinha (dados mockados nesta etapa estática)

export type StatusUsuario = "ativo" | "inativo" | "bloqueado";

export type AcaoPermissao = "visualizar" | "criar" | "editar" | "excluir";

export type ModuloSistema =
  | "objetos"
  | "organizacoes"
  | "nucleos"
  | "turmas"
  | "inscricoes"
  | "atividades"
  | "beneficiarios"
  | "funcionarios"
  | "equipamentos"
  | "relatorios"
  | "configuracoes"
  | "usuarios";

export interface PermissaoModulo {
  modulo: ModuloSistema;
  acoes: AcaoPermissao[];
}

export interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
  permissoes: PermissaoModulo[];
  criadoEm: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfilId: string;
  status: StatusUsuario;
  fotoUrl?: string;
  criadoEm: string;
  ultimoAcesso?: string;
}

export type StatusFuncionario =
  | "contratado"
  | "voluntario"
  | "demitido"
  | "pendente"
  | "licenca_medica"
  | "licenca_maternidade"
  | "afastado_inss";

export type FuncaoFuncionario =
  | "Agente comunitário"
  | "Articulador social"
  | "Coordenador de núcleo"
  | "Coordenador de projeto"
  | "Coordenador de setor"
  | "Instrutor"
  | "Monitor"
  | "Fisioterapeuta"
  | "Técnico de Enfermagem";

export type AlocacaoFuncionario =
  | "Administração"
  | "Múlti. núcleos"
  | "Nenhum"
  | "Serviços gerais"
  | { nucleoId: string };

export interface DiaJornada {
  dia:
    | "Segunda"
    | "Terça"
    | "Quarta"
    | "Quinta"
    | "Sexta"
    | "Sábado"
    | "Domingo";
  trabalha: boolean;
  entrada?: string;
  saida?: string;
}

export interface Funcionario {
  id: string;
  matricula: string;
  nomeCompleto: string;
  fotoUrl?: string;
  professorResponsavel: boolean;
  cpfCnpj?: string;
  dataNascimento?: string;
  status: StatusFuncionario;
  dataAdmissao: string;
  dataDemissao?: string;
  funcao: FuncaoFuncionario;
  remuneracao?: string;
  nucleoId?: string;
  alocadoEm: string;
  observacao?: string;
  conselho?: "CREFITO" | "COREN";
  registroConselho?: string;
  jornada: DiaJornada[];
}

export interface Nucleo {
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
  totalBeneficiarios: number;
  beneficiariosAtivos: number;
  beneficiariosInativos: number;
}

export interface Turma {
  id: string;
  nome: string;
  nucleoId: string;
  atividadeId: string;
  responsaveis: string[];
  horario: string;
  dias: string[];
  vagasTotais: number;
  qtdBeneficiarios: number;
  exclusiva: boolean;
  statusInicial?: "aprovada" | "pendente" | "reservada";
  dataInicio: string;
  duracao: string;
}

export type CategoriaEquipamento =
  | "Esportivo"
  | "Escritório"
  | "Informática"
  | "Mobiliário"
  | "Vestuário"
  | "Outros";

export type ConservacaoEquipamento = "novo" | "bom" | "regular" | "ruim" | "inservivel";

export interface Equipamento {
  id: string;
  nome: string;
  categoria: CategoriaEquipamento;
  quantidade: number;
  conservacao: ConservacaoEquipamento;
  nucleoId?: string;
  objetoId?: string;
  notaFiscal?: string;
  dataAquisicao?: string;
  valorUnitario?: number;
  fotoUrl?: string;
  observacao?: string;
  criadoEm: string;
}

export type Turno = "manha" | "tarde" | "noite";

export interface PerguntaAtividade {
  id: string;
  pergunta: string;
  disponivelInscricao: boolean;
}

export interface Atividade {
  id: string;
  nome: string;
  disponivelPreInscricao: boolean;
  turnos: Turno[];
  idadeMinima?: number;
  idadeMaxima?: number;
  perguntas: PerguntaAtividade[];
  qtdTurmas: number;
  criadoEm: string;
}

export type TipoDuracao = "pontual" | "periodo";

export type StatusObjeto = "ativo" | "encerrado" | "planejado";

export interface Objeto {
  id: string;
  nome: string;
  descricao?: string;
  termoDeFomento?: string;
  codigoObjeto?: string;
  codigoPrograma?: string;
  nomePrograma?: string;
  tipoDuracao: TipoDuracao;
  dataEvento?: string;
  dataInicio?: string;
  dataTermino?: string;
  status: StatusObjeto;
  criadoEm: string;
}

export type TipoOrganizacao = "Instituto" | "ONG" | "Associação" | "Fundação" | "Outro";

export type StatusOrganizacao = "ativa" | "inativa";

export interface Organizacao {
  id: string;
  nome: string;
  tipo: TipoOrganizacao;
  cnpj?: string;
  nomeResponsavel?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  objetoId?: string;
  status: StatusOrganizacao;
  criadoEm: string;
}

export type StatusBeneficiario = "pendente" | "ativo" | "inativo";

export type StatusInscricao =
  | "pendente"
  | "reservada"
  | "aprovada"
  | "recusada"
  | "expirada"
  | "cancelada";

export type TipoMatricula = "Online" | "Interna";

export interface VinculoTurma {
  turmaId: string;
  status: "Ativo" | "Evadido";
  dataRegistro: string;
}

export interface PerguntaParQ {
  pergunta: string;
  resposta?: "Sim" | "Não";
}

export interface Anexo {
  id: string;
  descricao: string;
  arquivoUrl: string;
}

export type StatusPresenca = "presente" | "falta" | "falta_justificada";

export interface RegistroPresenca {
  id: string;
  turmaId: string;
  data: string; // ISO date "YYYY-MM-DD"
  beneficiarioId: string;
  status: StatusPresenca;
  observacao?: string;
  registradoPor?: string;
  criadoEm: string;
}

export type StatusPonto = "presente" | "falta" | "falta_justificada" | "folga" | "feriado";

export interface RegistroPonto {
  id: string;
  funcionarioId: string;
  data: string; // ISO date "YYYY-MM-DD"
  entradaReal?: string; // "HH:MM"
  saidaReal?: string;   // "HH:MM"
  status: StatusPonto;
  observacao?: string;
  criadoEm: string;
}

export interface ConfirmacaoAtividade {
  id: string;
  funcionarioId: string;
  turmaId: string;
  data: string; // ISO date "YYYY-MM-DD"
  fotoUrl?: string;
  observacao?: string;
  confirmadoEm: string;
}

export interface Beneficiario {
  id: string;
  matricula: string;
  fotoUrl?: string;
  nomeCompleto: string;
  nomeSocial?: string;
  dataNascimento: string;
  raca?: "Preta" | "Parda" | "Branca" | "Amarela" | "Indígena" | "Outras";
  sexo: "Masculino" | "Feminino" | "Não Informar";
  dataCadastro: string;
  pcd: boolean;
  tipoPcd?: string;
  nucleoId?: string;
  status: StatusBeneficiario;
  tipoMatricula: TipoMatricula;
  comorbidades?: string;
  nivelEscolaridade?: string;
  ocupacaoAtual?: string;
  situacaoMoradia?: string;
  beneficioSocioassistencial?: string;
  telefoneResidencial?: string;
  celular: string;
  celularWhatsapp?: "Não informado" | "Sim" | "Não";
  email?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  rg?: string;
  cpf?: string;
  numeroNis?: string;
  moraCom?: string;
  tamanhoUniforme?: string;
  uniformeEntregue?: boolean;
  nomeResponsavel?: string;
  emailResponsavel?: string;
  rgResponsavel?: string;
  cpfResponsavel?: string;
  turmas: VinculoTurma[];
  parQ: PerguntaParQ[];
  atestadoMedicoUrl?: string;
  redeEnsino?: string;
  nomeEscola?: string;
  turno?: string;
  serie?: string;
  turmaEscolar?: string;
  codigoAtleta?: string;
  anexos: Anexo[];
}
