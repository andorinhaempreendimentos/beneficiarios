// Tipos centrais do domínio Andorinha (dados mockados nesta etapa estática)

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
  dataInicio: string;
  duracao: string;
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

export type StatusBeneficiario =
  | "Novo cadastro"
  | "Comparecer a sede"
  | "Aguardando seletiva"
  | "Fila de espera"
  | "Desistente"
  | "Aprovado";

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
