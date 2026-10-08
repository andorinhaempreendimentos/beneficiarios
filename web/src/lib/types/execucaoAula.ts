export interface ExecucaoSessaoApi {
  id: string;
  turmaId: string;
  nucleoId?: string;
  sessaoId?: string;
  atividadeId?: string;
  professorId: string;
  professorNome?: string;
  data: string;
  horaInicioPrevista: string;
  horaFimPrevista: string;
  horaInicioReal?: string;
  horaFimReal?: string;
  status: "em_andamento" | "concluida" | "pendente_aprovacao" | "rejeitada";
  fotoComprovanteUrl?: string;
  observacoes?: string;
  justificativaRetroativa?: string;
  statusAprovacao: "aprovado" | "pendente_aprovacao" | "rejeitado";
  aprovadoPorUserId?: string;
  aprovadoEm?: string;
  criadoEm: string;
}

export type ExecucaoAulaApi = ExecucaoSessaoApi;

export interface BeneficiarioPresencaApi {
  id: string;
  execucaoAulaId: string;
  beneficiarioId: string;
  status: "presente" | "falta" | "falta_justificada";
  observacao?: string;
}

export interface NucleoConfigRetroativa {
  permitirChamadaRetroativa: boolean;
  toleranciaInicioMinutos: number;
  toleranciaFimMinutos: number;
  diasLimiteRetroativo: number;
}
