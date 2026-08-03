import type { Equipamento } from "@/lib/types";

export const equipamentos: Equipamento[] = [
  {
    id: "eq1",
    nome: "Bola de Futebol Oficial",
    categoria: "Esportivo",
    quantidade: 20,
    conservacao: "bom",
    nucleoId: "n1",
    objetoId: "obj1",
    notaFiscal: "NF-2024-0045",
    dataAquisicao: "2024-03-10",
    valorUnitario: 89.9,
    criadoEm: "2024-03-10",
  },
  {
    id: "eq2",
    nome: "Colchonete EVA",
    categoria: "Esportivo",
    quantidade: 40,
    conservacao: "novo",
    nucleoId: "n2",
    objetoId: "obj1",
    notaFiscal: "NF-2024-0102",
    dataAquisicao: "2024-05-15",
    valorUnitario: 35.0,
    criadoEm: "2024-05-15",
  },
  {
    id: "eq3",
    nome: "Notebook Dell Inspiron",
    categoria: "Informática",
    quantidade: 3,
    conservacao: "bom",
    nucleoId: "n1",
    objetoId: "obj1",
    notaFiscal: "NF-2024-0200",
    dataAquisicao: "2024-01-20",
    valorUnitario: 3200.0,
    criadoEm: "2024-01-20",
  },
  {
    id: "eq4",
    nome: "Kimono Jiu-Jitsu Infantil",
    categoria: "Vestuário",
    quantidade: 15,
    conservacao: "regular",
    nucleoId: "n5",
    objetoId: "obj1",
    observacao: "Alguns com costura soltando",
    criadoEm: "2023-11-01",
  },
  {
    id: "eq5",
    nome: "Mesa de Escritório",
    categoria: "Mobiliário",
    quantidade: 5,
    conservacao: "bom",
    nucleoId: "n1",
    dataAquisicao: "2023-06-10",
    valorUnitario: 450.0,
    criadoEm: "2023-06-10",
  },
];

export function getEquipamentoById(id: string): Equipamento | undefined {
  return equipamentos.find((e) => e.id === id);
}
