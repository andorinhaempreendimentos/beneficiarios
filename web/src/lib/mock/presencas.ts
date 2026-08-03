import type { ConfirmacaoAtividade, RegistroPresenca } from "@/lib/types";

export const presencas: RegistroPresenca[] = [
  // Turma t1 — Futebol Manhã A — aula 2026-07-28 (Seg)
  { id: "pr1",  turmaId: "t1", data: "2026-07-28", beneficiarioId: "b1", status: "presente",          registradoPor: "f1", criadoEm: "2026-07-28T09:40:00Z" },
  { id: "pr2",  turmaId: "t1", data: "2026-07-28", beneficiarioId: "b2", status: "falta",             registradoPor: "f1", criadoEm: "2026-07-28T09:40:00Z" },
  { id: "pr3",  turmaId: "t1", data: "2026-07-28", beneficiarioId: "b4", status: "presente",          registradoPor: "f1", criadoEm: "2026-07-28T09:40:00Z" },
  // Turma t1 — aula 2026-07-30 (Qua)
  { id: "pr4",  turmaId: "t1", data: "2026-07-30", beneficiarioId: "b1", status: "presente",          registradoPor: "f1", criadoEm: "2026-07-30T09:40:00Z" },
  { id: "pr5",  turmaId: "t1", data: "2026-07-30", beneficiarioId: "b2", status: "falta_justificada", registradoPor: "f1", criadoEm: "2026-07-30T09:40:00Z", observacao: "Atestado médico" },
  // Turma t2 — Futsal Tarde B — aula 2026-07-29 (Ter)
  { id: "pr6",  turmaId: "t2", data: "2026-07-29", beneficiarioId: "b3", status: "presente",          registradoPor: "f2", criadoEm: "2026-07-29T14:40:00Z" },
];

export const confirmacoes: ConfirmacaoAtividade[] = [
  {
    id: "ca1",
    funcionarioId: "f1",
    turmaId: "t1",
    data: "2026-07-28",
    fotoUrl: "/mock/confirmacao-futebol-28jul.jpg",
    observacao: "Aula aplicada — aquecimento + jogo reduzido.",
    confirmadoEm: "2026-07-28T09:45:00Z",
  },
  {
    id: "ca2",
    funcionarioId: "f1",
    turmaId: "t1",
    data: "2026-07-30",
    fotoUrl: "/mock/confirmacao-futebol-30jul.jpg",
    confirmadoEm: "2026-07-30T09:42:00Z",
  },
];

export function getPresencasByTurmaData(turmaId: string, data: string): RegistroPresenca[] {
  return presencas.filter((p) => p.turmaId === turmaId && p.data === data);
}

export function getPresencasByTurma(turmaId: string): RegistroPresenca[] {
  return presencas.filter((p) => p.turmaId === turmaId);
}

export function getConfirmacoesByFuncionario(funcionarioId: string): ConfirmacaoAtividade[] {
  return confirmacoes.filter((c) => c.funcionarioId === funcionarioId);
}
