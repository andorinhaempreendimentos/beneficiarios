import type { RegistroPonto } from "@/lib/types";

export const registrosPonto: RegistroPonto[] = [
  // f1 — Marcos Alves — julho 2026
  { id: "pt1",  funcionarioId: "f1", data: "2026-07-28", entradaReal: "07:58", saidaReal: "15:55", status: "presente", criadoEm: "2026-07-28T15:55:00Z" },
  { id: "pt2",  funcionarioId: "f1", data: "2026-07-29", entradaReal: "08:02", saidaReal: "16:01", status: "presente", criadoEm: "2026-07-29T16:01:00Z" },
  { id: "pt3",  funcionarioId: "f1", data: "2026-07-30", entradaReal: "08:10", saidaReal: "16:05", status: "presente", criadoEm: "2026-07-30T16:05:00Z" },
  { id: "pt4",  funcionarioId: "f1", data: "2026-07-31", entradaReal: "08:00", saidaReal: "16:00", status: "presente", criadoEm: "2026-07-31T16:00:00Z" },
  { id: "pt5",  funcionarioId: "f1", data: "2026-08-01", status: "folga",   criadoEm: "2026-08-01T00:00:00Z" },
  // f2 — Renata Souza
  { id: "pt6",  funcionarioId: "f2", data: "2026-07-28", entradaReal: "13:00", saidaReal: "20:58", status: "presente", criadoEm: "2026-07-28T20:58:00Z" },
  { id: "pt7",  funcionarioId: "f2", data: "2026-07-29", status: "falta_justificada", observacao: "Consulta médica", criadoEm: "2026-07-29T08:00:00Z" },
  { id: "pt8",  funcionarioId: "f2", data: "2026-07-30", entradaReal: "13:05", saidaReal: "21:00", status: "presente", criadoEm: "2026-07-30T21:00:00Z" },
  // f5 — Paulo Ricardo (licença médica)
  { id: "pt9",  funcionarioId: "f5", data: "2026-07-28", status: "falta_justificada", observacao: "Licença médica vigente", criadoEm: "2026-07-28T00:00:00Z" },
  { id: "pt10", funcionarioId: "f5", data: "2026-07-29", status: "falta_justificada", observacao: "Licença médica vigente", criadoEm: "2026-07-29T00:00:00Z" },
];

export function getPontoByFuncionario(funcionarioId: string): RegistroPonto[] {
  return registrosPonto.filter((p) => p.funcionarioId === funcionarioId);
}

export function getPontoByFuncionarioMes(funcionarioId: string, ano: number, mes: number): RegistroPonto[] {
  const prefix = `${ano}-${String(mes).padStart(2, "0")}`;
  return registrosPonto.filter((p) => p.funcionarioId === funcionarioId && p.data.startsWith(prefix));
}
