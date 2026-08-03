import type { StatusBeneficiario, StatusFuncionario, StatusObjeto, StatusOrganizacao, ConservacaoEquipamento, StatusUsuario } from "@/lib/types";

type Tone = "zinc" | "sky" | "green" | "red" | "amber" | "violet";

export const statusBeneficiarioTone: Record<StatusBeneficiario, Tone> = {
  "Novo cadastro": "sky",
  "Comparecer a sede": "amber",
  "Aguardando seletiva": "violet",
  "Fila de espera": "zinc",
  Desistente: "red",
  Aprovado: "green",
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
