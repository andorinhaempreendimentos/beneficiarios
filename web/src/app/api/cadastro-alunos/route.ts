import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qrzszjogxrrjqjkoowoi.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo";
  return createClient(url, key);
}

// POST: Salva a lista de alunos cadastrados pelo professor na tabela de respostas (isolamento total)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nucleoId,
      nucleoNome,
      professorNome,
      alunos,
      observacoes,
    } = body;

    if (!nucleoId || !nucleoNome) {
      return NextResponse.json(
        { error: "Identificação do núcleo é obrigatória." },
        { status: 400 }
      );
    }

    if (!Array.isArray(alunos) || alunos.length === 0) {
      return NextResponse.json(
        { error: "A lista deve conter pelo menos 1 aluno cadastrado." },
        { status: 400 }
      );
    }

    // Validar itens obrigatórios de cada aluno
    for (let i = 0; i < alunos.length; i++) {
      const a = alunos[i];
      if (!a.nomeCompleto || !a.nomeCompleto.trim()) {
        return NextResponse.json(
          { error: `Aluno #${i + 1} está com o nome em branco.` },
          { status: 400 }
        );
      }
      if (!a.dataNascimento) {
        return NextResponse.json(
          { error: `Aluno "${a.nomeCompleto}" está sem data de nascimento.` },
          { status: 400 }
        );
      }
      if (!a.sexo || !["M", "F"].includes(a.sexo)) {
        return NextResponse.json(
          { error: `Aluno "${a.nomeCompleto}" está com sexo inválido.` },
          { status: 400 }
        );
      }
      if (!a.turmaId) {
        return NextResponse.json(
          { error: `Aluno "${a.nomeCompleto}" precisa estar associado a uma turma.` },
          { status: 400 }
        );
      }
    }

    // Calcular resumo de alunos por turma para facilidade de auditoria
    const distribuicaoTurmas: Record<string, number> = {};
    alunos.forEach((a) => {
      distribuicaoTurmas[a.turmaId] = (distribuicaoTurmas[a.turmaId] || 0) + 1;
    });

    const supabase = getSupabaseClient();

    // Inserção na tabela dedicada respostas_conferencia_beneficiarios
    // NÃO toca nas tabelas oficiais (beneficiarios / grupos)
    const { data, error } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .insert({
        nucleo_id: nucleoId,
        nucleo_nome: nucleoNome,
        professor_nome: professorNome || null,
        tem_alunos_pre_existentes: false,
        total_alunos_sistema: 0,
        total_alunos_informado: alunos.length,
        distribuicao_turmas: distribuicaoTurmas,
        alocacoes_alunos: [],
        novos_alunos_cadastrados: alunos,
        observacoes: observacoes ? String(observacoes).trim() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      id: data.id,
      totalAlunos: alunos.length,
      message: `Lista de ${alunos.length} alunos salva com sucesso para o núcleo ${nucleoNome}.`,
    });
  } catch (error: any) {
    console.error("[cadastro-alunos POST]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar cadastro de alunos." },
      { status: 500 }
    );
  }
}
