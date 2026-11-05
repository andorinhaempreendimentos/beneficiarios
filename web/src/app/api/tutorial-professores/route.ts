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

// GET: Retorna lista de polos esportivos
export async function GET() {
  const polos = professores
    .map(p => ({ id: p.id, polo: p.polo }))
    .sort((a, b) => a.polo.localeCompare(b.polo));

  return NextResponse.json({ polos });
}

// POST: Validação por Núcleo + WhatsApp (últimos 8 dígitos)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poloId, telefone } = body;

    if (!poloId || !telefone) {
      return NextResponse.json(
        { success: false, erro: "Selecione o seu núcleo e informe o seu WhatsApp." },
        { status: 400 }
      );
    }

    const prof = professores.find(p => p.id === poloId);
    if (!prof) {
      return NextResponse.json(
        { success: false, erro: "Núcleo esportivo não encontrado." },
        { status: 404 }
      );
    }

    // Validar Telefone (compara os últimos 8 dígitos)
    const telDig = String(telefone).replace(/\D/g, "");
    const telDigClean = telDig.startsWith("55") ? telDig.slice(2) : telDig;

    if (telDigClean.length < 8) {
      return NextResponse.json({
        success: false,
        erro: "Por favor, digite um número de WhatsApp válido com DDD."
      });
    }

    const matchTelefone = prof.telefones.some(t => {
      const tClean = t.startsWith("55") ? t.slice(2) : t;
      return tClean.endsWith(telDigClean.slice(-8)) || telDigClean.endsWith(tClean.slice(-8));
    });

    if (!matchTelefone) {
      return NextResponse.json({
        success: false,
        erro: "O número de WhatsApp informado não confere com o cadastro deste núcleo esportivo."
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
