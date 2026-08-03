import type { Organizacao } from "@/lib/types";

export const organizacoes: Organizacao[] = [
  {
    id: "org1",
    nome: "Instituto Vida Ativa",
    tipo: "Instituto",
    cnpj: "12.345.678/0001-90",
    nomeResponsavel: "Carlos Mendes",
    telefone: "11999887766",
    email: "contato@vidaativa.org.br",
    cep: "01310-100",
    endereco: "Av. Paulista, 1000",
    cidade: "São Paulo",
    estado: "SP",
    objetoId: "obj1",
    status: "ativa",
    criadoEm: "2024-02-10",
  },
  {
    id: "org2",
    nome: "ONG Esporte Solidário",
    tipo: "ONG",
    cnpj: "98.765.432/0001-10",
    nomeResponsavel: "Ana Souza",
    telefone: "21988776655",
    email: "admin@esportesolidario.org",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    objetoId: "obj1",
    status: "ativa",
    criadoEm: "2024-03-15",
  },
  {
    id: "org3",
    nome: "Associação Mãos que Formam",
    tipo: "Associação",
    nomeResponsavel: "Roberto Lima",
    telefone: "31977665544",
    cidade: "Belo Horizonte",
    estado: "MG",
    objetoId: "obj3",
    status: "ativa",
    criadoEm: "2024-05-20",
  },
  {
    id: "org4",
    nome: "Fundação Corrida Livre",
    tipo: "Fundação",
    cnpj: "11.222.333/0001-44",
    nomeResponsavel: "Marcos Oliveira",
    email: "marcos@corridalivre.org",
    cidade: "Curitiba",
    estado: "PR",
    objetoId: "obj2",
    status: "inativa",
    criadoEm: "2024-06-01",
  },
];

export function getOrganizacaoById(id: string): Organizacao | undefined {
  return organizacoes.find((o) => o.id === id);
}
