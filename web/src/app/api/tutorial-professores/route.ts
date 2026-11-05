import { NextResponse } from "next/server";
import professoresData from "@/data/professores-tutorial.json";

interface ProfessorRegistro {
  id: string;
  polo: string;
  professor: string;
  partes: string[];
  telefones: string[];
  email: string;
  senha: string;
}

const professores: ProfessorRegistro[] = professoresData as ProfessorRegistro[];

// Pools de distratores para as etapas
const POOL_PRIMEIROS_NOMES = [
  "Aleksandro", "Vagno", "Hallid", "João", "Carlos", "Paulo",
  "Sthefferson", "Caíque", "Jorge", "Renato", "Felipe", "Luiz",
  "Ramon", "Alexandre", "Kaio", "Marcos", "Romário", "Wilton", "Rivaldo", "Rolnan"
];

const POOL_SEGUNDOS_NOMES = [
  "Soares", "Rodrigues", "Luz", "Vitor", "Henrique", "Roberto",
  "Mafra", "Cirilo", "Martins", "Gomes", "Ribeiro", "Carlos",
  "Batista", "Silva", "Sousa", "Alves", "Pereira", "Ferreira"
];

const POOL_TERCEIROS_NOMES = [
  "Santos", "dos Santos", "Rodrigues", "de Souza", "Husein", "Mendonça", "Araújo", "Nogueira",
  "Vieira", "Costa", "Silva", "de Castro", "Alves", "Oliveira",
  "Ribeiro", "Ferreira", "Rocha", "Dias", "de Oliveira", "da Silva", "Lima"
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// GET: Retorna lista de polos ou as opções de nomes misturados para um polo
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const poloId = searchParams.get("poloId");

  // Se não passou poloId, retorna apenas a lista de polos (sem expor senhas/telefones)
  if (!poloId) {
    const polos = professores
      .map(p => ({ id: p.id, polo: p.polo }))
      .sort((a, b) => a.polo.localeCompare(b.polo));

    return NextResponse.json({ polos });
  }

  // Se passou poloId, gera as etapas e opções misturadas para o desafio
  const prof = professores.find(p => p.id === poloId);
  if (!prof) {
    return NextResponse.json({ erro: "Polo não encontrado." }, { status: 404 });
  }

  const totalPartes = prof.partes.length;
  const etapas = prof.partes.map((parteCerta, idx) => {
    let rotulo = "1º Nome";
    let pool = POOL_PRIMEIROS_NOMES;

    if (idx === 1) {
      rotulo = "2º Nome";
      pool = POOL_SEGUNDOS_NOMES;
    } else if (idx === 2) {
      rotulo = totalPartes === 3 ? "Sobrenome Final" : "3º Nome";
      pool = POOL_TERCEIROS_NOMES;
    } else if (idx === 3) {
      rotulo = "Sobrenome Final";
      pool = POOL_TERCEIROS_NOMES;
    }

    const distratores = pool
      .filter(p => p !== parteCerta)
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    const opcoes = shuffle([parteCerta, ...distratores]);

    return {
      etapa: idx,
      rotulo,
      opcoes
    };
  });

  return NextResponse.json({
    poloId: prof.id,
    poloNome: prof.polo,
    totalPartes,
    etapas
  });
}

// POST: Validação estrita dos dados (Polo + Telefone + Partes do Nome)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poloId, telefone, partesEscolhidas } = body;

    if (!poloId || !telefone || !Array.isArray(partesEscolhidas)) {
      return NextResponse.json(
        { success: false, erro: "Dados incompletos para validação." },
        { status: 400 }
      );
    }

    const prof = professores.find(p => p.id === poloId);
    if (!prof) {
      return NextResponse.json(
        { success: false, erro: "Polo não encontrado." },
        { status: 404 }
      );
    }

    // 1. Validar Telefone (compara os últimos 8 dígitos)
    const telDig = String(telefone).replace(/\D/g, "");
    const telDigClean = telDig.startsWith("55") ? telDig.slice(2) : telDig;

    const matchTelefone = prof.telefones.some(t => {
      const tClean = t.startsWith("55") ? t.slice(2) : t;
      return tClean.endsWith(telDigClean.slice(-8)) || telDigClean.endsWith(tClean.slice(-8));
    });

    if (!matchTelefone) {
      return NextResponse.json({
        success: false,
        erro: "O número de telefone não confere com o cadastro deste polo esportivo."
      });
    }

    // 2. Validar se preencheu todas as partes
    if (partesEscolhidas.length < prof.partes.length) {
      return NextResponse.json({
        success: false,
        erro: "Você precisa escolher todas as partes do seu nome."
      });
    }

    // 3. Validar se acertou o 1º, 2º e demais nomes
    const acertou = prof.partes.every((parteExata, idx) => {
      return partesEscolhidas[idx] === parteExata;
    });

    if (!acertou) {
      const nomeTentado = partesEscolhidas.join(" ");
      return NextResponse.json({
        success: false,
        erro: `O nome montado ("${nomeTentado}") não confere com o professor deste núcleo. Clique em 'Reiniciar Nome' e tente novamente.`
      });
    }

    // Sucesso: Libera as credenciais do professor
    return NextResponse.json({
      success: true,
      professor: {
        nome: prof.professor,
        polo: prof.polo,
        email: prof.email,
        senha: prof.senha
      }
    });

  } catch {
    return NextResponse.json(
      { success: false, erro: "Erro interno no servidor ao validar acesso." },
      { status: 500 }
    );
  }
}
