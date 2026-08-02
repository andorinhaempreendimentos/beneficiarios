import type { Atividade } from "@/lib/types";

export const atividades: Atividade[] = [
  {
    id: "a1",
    nome: "Futebol",
    disponivelPreInscricao: true,
    turnos: ["manha", "tarde"],
    idadeMinima: 6,
    idadeMaxima: 17,
    perguntas: [
      { id: "p1", pergunta: "Já jogou futebol antes?", disponivelInscricao: true },
    ],
    qtdTurmas: 6,
    criadoEm: "2022-03-10",
  },
  {
    id: "a2",
    nome: "Futsal",
    disponivelPreInscricao: true,
    turnos: ["tarde", "noite"],
    idadeMinima: 8,
    idadeMaxima: 16,
    perguntas: [],
    qtdTurmas: 4,
    criadoEm: "2022-03-10",
  },
  {
    id: "a3",
    nome: "Funcional",
    disponivelPreInscricao: true,
    turnos: ["manha", "noite"],
    idadeMinima: 14,
    perguntas: [
      { id: "p2", pergunta: "Possui alguma lesão atual?", disponivelInscricao: true },
    ],
    qtdTurmas: 3,
    criadoEm: "2023-01-05",
  },
  {
    id: "a4",
    nome: "Karatê",
    disponivelPreInscricao: false,
    turnos: ["tarde"],
    idadeMinima: 5,
    perguntas: [],
    qtdTurmas: 2,
    criadoEm: "2023-06-18",
  },
  {
    id: "a5",
    nome: "Jiu-Jitsu",
    disponivelPreInscricao: true,
    turnos: ["manha", "tarde", "noite"],
    idadeMinima: 7,
    perguntas: [
      { id: "p3", pergunta: "Possui faixa em outra modalidade?", disponivelInscricao: false },
    ],
    qtdTurmas: 5,
    criadoEm: "2021-11-22",
  },
];

export function getAtividadeById(id: string): Atividade | undefined {
  return atividades.find((a) => a.id === id);
}
