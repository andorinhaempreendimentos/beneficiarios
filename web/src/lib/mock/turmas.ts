import type { Turma } from "@/lib/types";

export const turmas: Turma[] = [
  {
    id: "t1",
    nome: "Futebol Manhã A",
    nucleoId: "n1",
    atividadeId: "a1",
    responsaveis: ["Marcos Alves"],
    horario: "08:00 - 09:30",
    dias: ["Seg", "Qua", "Sex"],
    vagasTotais: 30,
    qtdBeneficiarios: 28,
    exclusiva: false,
    dataInicio: "2023-02-05",
    duracao: "12 meses",
  },
  {
    id: "t2",
    nome: "Futsal Tarde B",
    nucleoId: "n1",
    atividadeId: "a2",
    responsaveis: ["Renata Souza"],
    horario: "14:00 - 15:30",
    dias: ["Ter", "Qui"],
    vagasTotais: 25,
    qtdBeneficiarios: 25,
    exclusiva: true,
    dataInicio: "2023-03-01",
    duracao: "12 meses",
  },
  {
    id: "t3",
    nome: "Funcional Noite",
    nucleoId: "n2",
    atividadeId: "a3",
    responsaveis: ["Carlos Eduardo Lima"],
    horario: "19:00 - 20:00",
    dias: ["Seg", "Qua", "Sex"],
    vagasTotais: 20,
    qtdBeneficiarios: 15,
    exclusiva: false,
    dataInicio: "2023-09-10",
    duracao: "6 meses",
  },
  {
    id: "t4",
    nome: "Jiu-Jitsu Manhã",
    nucleoId: "n5",
    atividadeId: "a5",
    responsaveis: ["Paulo Ricardo"],
    horario: "09:00 - 10:00",
    dias: ["Ter", "Qui", "Sáb"],
    vagasTotais: 22,
    qtdBeneficiarios: 20,
    exclusiva: false,
    dataInicio: "2023-10-02",
    duracao: "12 meses",
  },
];

export function getTurmasByNucleo(nucleoId: string): Turma[] {
  return turmas.filter((t) => t.nucleoId === nucleoId);
}

export function getTurmaById(id: string): Turma | undefined {
  return turmas.find((t) => t.id === id);
}
