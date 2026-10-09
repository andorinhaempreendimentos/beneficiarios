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

// POST: Recebe a inscrição individual enviada pelo responsável e salva com isolamento total
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nucleoId,
      nucleoNome,
      aluno,
      responsavel,
      observacoes,
    } = body;

    // 1. Validações básicas de identificação do núcleo
    if (!nucleoId || !nucleoNome) {
      return NextResponse.json(
        { error: "Identificação do núcleo é obrigatória." },
        { status: 400 }
      );
    }

    // 2. Validações do aluno (filho)
    if (!aluno || !aluno.nomeCompleto || !aluno.nomeCompleto.trim()) {
      return NextResponse.json(
        { error: "Por favor, informe o nome completo do aluno." },
        { status: 400 }
      );
    }
    if (!aluno.dataNascimento) {
      return NextResponse.json(
        { error: "A data de nascimento do aluno é obrigatória." },
        { status: 400 }
      );
    }
    if (!aluno.sexo || !["M", "F"].includes(aluno.sexo)) {
      return NextResponse.json(
        { error: "O sexo do aluno deve ser Masculino (M) ou Feminino (F)." },
        { status: 400 }
      );
    }
    if (!aluno.turmaId) {
      return NextResponse.json(
        { error: "Selecione a turma de interesse para o aluno." },
        { status: 400 }
      );
    }

    // 3. Validações do responsável
    if (!responsavel || !responsavel.nomeCompleto || !responsavel.nomeCompleto.trim()) {
      return NextResponse.json(
        { error: "Por favor, informe o nome do responsável." },
        { status: 400 }
      );
    }
    if (!responsavel.whatsapp || !responsavel.whatsapp.trim()) {
      return NextResponse.json(
        { error: "O telefone/WhatsApp do responsável é obrigatório para contato." },
        { status: 400 }
      );
    }

    const alunoCompleto = {
      idTemp: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nomeCompleto: aluno.nomeCompleto.trim().toUpperCase(),
      dataNascimento: aluno.dataNascimento,
      idade: aluno.idade !== undefined ? aluno.idade : null,
      sexo: aluno.sexo,
      cpf: aluno.cpf ? String(aluno.cpf).trim() : null,
      turmaId: aluno.turmaId,
      turmaNome: aluno.turmaNome || "Turma Selecionada",
      turmaIdentificador: aluno.turmaIdentificador || "",
      origem: "responsavel",
      responsavel: {
        nomeCompleto: responsavel.nomeCompleto.trim(),
        parentesco: responsavel.parentesco || "Responsável Legal",
        whatsapp: responsavel.whatsapp.trim(),
      },
      observacoes: observacoes ? String(observacoes).trim() : null,
      cadastradoEm: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();

    // 4. Verificar se já existe registro de conferência/cadastro para este núcleo
    const { data: registroExistente } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .select("id, novos_alunos_cadastrados, total_alunos_informado, distribuicao_turmas")
      .eq("nucleo_id", nucleoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (registroExistente) {
      // Anexar aluno à lista existente
      const listaAtual = Array.isArray(registroExistente.novos_alunos_cadastrados)
        ? registroExistente.novos_alunos_cadastrados
        : [];

      const listaAtualizada = [alunoCompleto, ...listaAtual];
      const novoTotal = (registroExistente.total_alunos_informado || 0) + 1;

      const distribuicaoAtual: Record<string, number> =
        typeof registroExistente.distribuicao_turmas === "object" && registroExistente.distribuicao_turmas !== null
          ? { ...registroExistente.distribuicao_turmas }
          : {};
      distribuicaoAtual[aluno.turmaId] = (distribuicaoAtual[aluno.turmaId] || 0) + 1;

      const { error: errUpdate } = await supabase
        .from("respostas_conferencia_beneficiarios")
        .update({
          novos_alunos_cadastrados: listaAtualizada,
          total_alunos_informado: novoTotal,
          distribuicao_turmas: distribuicaoAtual,
          updated_at: new Date().toISOString(),
        })
        .eq("id", registroExistente.id);

      if (errUpdate) throw errUpdate;
    } else {
      // Criar primeiro registro do núcleo
      const distribuicaoInicial: Record<string, number> = {
        [aluno.turmaId]: 1,
      };

      const { error: errInsert } = await supabase
        .from("respostas_conferencia_beneficiarios")
        .insert({
          nucleo_id: nucleoId,
          nucleo_nome: nucleoNome,
          professor_nome: null,
          tem_alunos_pre_existentes: false,
          total_alunos_sistema: 0,
          total_alunos_informado: 1,
          distribuicao_turmas: distribuicaoInicial,
          alocacoes_alunos: [],
          novos_alunos_cadastrados: [alunoCompleto],
          observacoes: "Cadastro iniciado por responsável",
        });

      if (errInsert) throw errInsert;
    }

    return NextResponse.json({
      success: true,
      alunoId: alunoCompleto.idTemp,
      alunoNome: alunoCompleto.nomeCompleto,
      message: `Inscrição de ${alunoCompleto.nomeCompleto} realizada com sucesso! A equipe entrará em contato via WhatsApp.`,
    });
  } catch (error: any) {
    console.error("[cadastro-alunos/responsavel POST]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar inscrição do aluno." },
      { status: 500 }
    );
  }
}
