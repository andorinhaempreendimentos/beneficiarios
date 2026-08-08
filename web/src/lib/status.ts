import type { StatusBeneficiario, StatusInscricao, StatusFuncionario, StatusObjeto, StatusOrganizacao, ConservacaoEquipamento, StatusUsuario } from "@/lib/types";

type Tone = "zinc" | "sky" | "green" | "red" | "amber" | "violet";

export const statusBeneficiarioLabel: Record<StatusBeneficiario, string> = {
  pendente: "Pendente",
  ativo: "Ativo",
  inativo: "Inativo",
};

export const statusBeneficiarioTone: Record<StatusBeneficiario, Tone> = {
  pendente: "amber",
  ativo: "green",
  inativo: "zinc",
};

export const STATUS_BENEFICIARIO_OPCOES = (
  Object.keys(statusBeneficiarioLabel) as StatusBeneficiario[]
).map((value) => ({ value, label: statusBeneficiarioLabel[value] }));

/** Traduz status legado (labels antigos) para os três status atuais. */
export function normalizarStatusBeneficiario(valor?: string | null): StatusBeneficiario {
  switch (valor) {
    case "ativo":
    case "Aprovado":
      return "ativo";
    case "inativo":
    case "Desistente":
      return "inativo";
    default:
      return "pendente";
  }
}

export const statusInscricaoLabel: Record<StatusInscricao, string> = {
  pendente: "Pendente",
  reservada: "Fila de espera",
  aprovada: "Aprovada",
  recusada: "Recusada",
  expirada: "Expirada",
  cancelada: "Cancelada",
};

export const statusInscricaoTone: Record<StatusInscricao, Tone> = {
  pendente: "amber",
  reservada: "sky",
  aprovada: "green",
  recusada: "red",
  expirada: "zinc",
  cancelada: "red",
};

export const statusFuncionarioLabel: Record<StatusFuncionario, string> = {
  contratado: "Contratado",
  voluntario: "Voluntário",
  demitido: "Demitido",
  pendente: "Pendente",
  licenca_medica: "Licença Médica",
  licenca_maternidade: "Licença Maternidade",
  afastado_inss: "Afastado INSS",
};

export const statusFuncionarioTone: Record<StatusFuncionario, Tone> = {
  contratado: "green",
  voluntario: "sky",
  demitido: "red",
  pendente: "amber",
  licenca_medica: "violet",
  licenca_maternidade: "violet",
  afastado_inss: "violet",
};

export const statusObjetoLabel: Record<StatusObjeto, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
  planejado: "Planejado",
};

export const statusObjetoTone: Record<StatusObjeto, Tone> = {
  ativo: "green",
  encerrado: "zinc",
  planejado: "sky",
};

export const statusOrganizacaoLabel: Record<StatusOrganizacao, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
};

export const statusOrganizacaoTone: Record<StatusOrganizacao, Tone> = {
  ativa: "green",
  inativa: "zinc",
};

export const conservacaoLabel: Record<ConservacaoEquipamento, string> = {
  novo: "Novo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  inservivel: "Inservível",
};

export const conservacaoTone: Record<ConservacaoEquipamento, Tone> = {
  novo: "sky",
  bom: "green",
  regular: "amber",
  ruim: "red",
  inservivel: "zinc",
};

export const statusUsuarioLabel: Record<StatusUsuario, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
};

export const statusUsuarioTone: Record<StatusUsuario, Tone> = {
  ativo: "green",
  inativo: "zinc",
  bloqueado: "red",
};
