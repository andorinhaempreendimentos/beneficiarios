export type ModuloPermissao =
  | "objetos"
  | "organizacoes"
  | "nucleos"
  | "turmas"
  | "atividades"
  | "beneficiarios"
  | "funcionarios"
  | "equipamentos"
  | "inscricoes"
  | "relatorios"
  | "configuracoes";

export type AcaoPermissao = "visualizar" | "criar" | "editar" | "excluir" | "aprovar";

export type MatrizPermissoes = Partial<Record<ModuloPermissao, Partial<Record<AcaoPermissao, boolean>>>>;

export interface PerfilGestor {
  id: string;
  nome: string;
  descricao?: string;
  permissoes: MatrizPermissoes;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "admin" | "gestor" | "funcionario";
  perfilGestorId?: string;
  ativo: boolean;
}

export const perfisGestor: PerfilGestor[] = [
  {
    id: "pg1",
    nome: "Gestor Completo",
    descricao: "Acesso total exceto configurações do sistema",
    permissoes: {
      objetos: { visualizar: true, criar: true, editar: true, excluir: false },
      organizacoes: { visualizar: true, criar: true, editar: true, excluir: false },
      nucleos: { visualizar: true, criar: true, editar: true, excluir: false },
      turmas: { visualizar: true, criar: true, editar: true, excluir: false },
      atividades: { visualizar: true, criar: true, editar: true, excluir: false },
      beneficiarios: { visualizar: true, criar: true, editar: true, excluir: false },
      funcionarios: { visualizar: true, criar: true, editar: true, excluir: false },
      equipamentos: { visualizar: true, criar: true, editar: true, excluir: false },
      inscricoes: { visualizar: true, aprovar: true },
      relatorios: { visualizar: true },
      configuracoes: { visualizar: false },
    },
  },
  {
    id: "pg2",
    nome: "Gestor de Inscrições",
    descricao: "Foco em aprovar/recusar inscrições e visualizar beneficiários",
    permissoes: {
      beneficiarios: { visualizar: true },
      inscricoes: { visualizar: true, aprovar: true },
      turmas: { visualizar: true },
      relatorios: { visualizar: true },
    },
  },
  {
    id: "pg3",
    nome: "Gestor Operacional",
    descricao: "Gestão de pessoal e equipamentos",
    permissoes: {
      funcionarios: { visualizar: true, criar: true, editar: true },
      equipamentos: { visualizar: true, criar: true, editar: true },
      nucleos: { visualizar: true },
      turmas: { visualizar: true },
    },
  },
];

export const usuarios: Usuario[] = [
  {
    id: "u1",
    nome: "Carlos Mendes",
    email: "carlos@andorinha.org",
    perfil: "admin",
    ativo: true,
  },
  {
    id: "u2",
    nome: "Ana Souza",
    email: "ana@andorinha.org",
    perfil: "gestor",
    perfilGestorId: "pg1",
    ativo: true,
  },
  {
    id: "u3",
    nome: "Roberto Lima",
    email: "roberto@andorinha.org",
    perfil: "gestor",
    perfilGestorId: "pg2",
    ativo: true,
  },
  {
    id: "u4",
    nome: "Marcos Alves",
    email: "marcos@andorinha.org",
    perfil: "funcionario",
    ativo: true,
  },
  {
    id: "u5",
    nome: "Juliana Ferreira",
    email: "juliana@andorinha.org",
    perfil: "funcionario",
    ativo: false,
  },
];
