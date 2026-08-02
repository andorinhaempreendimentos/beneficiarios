import type { Objeto } from "@/lib/types";

export const objetos: Objeto[] = [
  {
    id: "obj1",
    nome: "Programa Esporte na Comunidade",
    descricao: "Fomento de atividades esportivas em comunidades periféricas",
    termoDeFomento: "TF-2024/001",
    codigoObjeto: "OBJ-001",
    codigoPrograma: "PRG-010",
    nomePrograma: "Esporte para Todos",
    tipoDuracao: "periodo",
    dataInicio: "2024-03-01",
    dataTermino: "2025-02-28",
    status: "ativo",
    criadoEm: "2024-01-15",
  },
  {
    id: "obj2",
    nome: "Corrida Solidária 2024",
    descricao: "Evento beneficente com corrida de rua",
    termoDeFomento: "TF-2024/012",
    codigoObjeto: "OBJ-002",
    tipoDuracao: "pontual",
    dataEvento: "2024-09-15",
    status: "encerrado",
    criadoEm: "2024-06-01",
  },
  {
    id: "obj3",
    nome: "Inclusão pelo Esporte",
    descricao: "Projeto voltado a PcD em modalidades adaptadas",
    codigoObjeto: "OBJ-003",
    codigoPrograma: "PRG-020",
    nomePrograma: "Vida Ativa",
    tipoDuracao: "periodo",
    dataInicio: "2025-01-01",
    dataTermino: "2025-12-31",
    status: "ativo",
    criadoEm: "2024-11-10",
  },
  {
    id: "obj4",
    nome: "Festival de Artes Marciais",
    tipoDuracao: "pontual",
    dataEvento: "2025-05-20",
    status: "planejado",
    criadoEm: "2025-02-01",
  },
];

export function getObjetoById(id: string): Objeto | undefined {
  return objetos.find((o) => o.id === id);
}
