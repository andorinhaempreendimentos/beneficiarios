export type StatusInscricao = "pendente" | "aprovada" | "fila_espera" | "cancelada";

export interface Inscricao {
  id: string;
  turmaId: string;
  nomeCompleto: string;
  dataNascimento: string;
  celular: string;
  email?: string;
  cpf?: string;
  dataInscricao: string;
  status: StatusInscricao;
}

export const inscricoes: Inscricao[] = [
  {
    id: "ins1",
    turmaId: "t1",
    nomeCompleto: "Ana Paula Ferreira",
    dataNascimento: "2010-03-15",
    celular: "(21) 99001-1234",
    email: "ana@email.com",
    cpf: "123.456.789-00",
    dataInscricao: "2024-07-20",
    status: "pendente",
  },
  {
    id: "ins2",
    turmaId: "t1",
    nomeCompleto: "Carlos Eduardo Lima",
    dataNascimento: "2008-11-02",
    celular: "(21) 98765-4321",
    dataInscricao: "2024-07-21",
    status: "aprovada",
  },
  {
    id: "ins3",
    turmaId: "t2",
    nomeCompleto: "Beatriz Santos",
    dataNascimento: "2012-06-30",
    celular: "(21) 97654-3210",
    email: "bea@email.com",
    dataInscricao: "2024-07-22",
    status: "fila_espera",
  },
  {
    id: "ins4",
    turmaId: "t3",
    nomeCompleto: "Rafael Oliveira",
    dataNascimento: "2005-09-10",
    celular: "(21) 96543-2109",
    cpf: "987.654.321-00",
    dataInscricao: "2024-07-23",
    status: "pendente",
  },
  {
    id: "ins5",
    turmaId: "t1",
    nomeCompleto: "Juliana Costa",
    dataNascimento: "2011-01-25",
    celular: "(21) 95432-1098",
    email: "ju@email.com",
    dataInscricao: "2024-07-24",
    status: "cancelada",
  },
];

export function getInscricoesByTurma(turmaId: string): Inscricao[] {
  return inscricoes.filter((i) => i.turmaId === turmaId);
}
