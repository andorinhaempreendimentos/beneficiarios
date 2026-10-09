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

// POST: Recebe a inscrição enviada pelo responsável com dados do responsável primeiro e alunos simplificados
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nucleoId,
      nucleoNome,
      responsavel,
      filhos,
    } = body;

    // 1. Identificação do núcleo
    if (!nucleoId || !nucleoNome) {
      return NextResponse.json(
        { error: "Identificação do núcleo é obrigatória." },
        { status: 400 }
      );
    }

    // 2. Validações do responsável (Nome, Telefone e CPF)
    if (!responsavel || !responsavel.nomeCompleto || !responsavel.nomeCompleto.trim()) {
      return NextResponse.json(
        { error: "Por favor, informe o nome completo do responsável." },
        { status: 400 }
      );
    }
    if (!responsavel.whatsapp || !responsavel.whatsapp.trim()) {
      return NextResponse.json(
        { error: "O telefone/WhatsApp do responsável é obrigatório." },
        { status: 400 }
      );
    }
    if (!responsavel.cpf || !responsavel.cpf.trim()) {
      return NextResponse.json(
        { error: "O CPF do responsável é obrigatório." },
        { status: 400 }
      );
    }

    // 3. Normalizar lista de alunos (filhos)
    const listaFilhos = Array.isArray(filhos) ? filhos : [];
    if (listaFilhos.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um aluno antes de enviar." },
        { status: 400 }
      );
    }

    // Validar cada aluno
    for (let i = 0; i < listaFilhos.length; i++) {
      const f = listaFilhos[i];
      if (!f.nomeCompleto || !f.nomeCompleto.trim()) {
        return NextResponse.json(
          { error: `Informe o nome completo do aluno #${i + 1}.` },
          { status: 400 }
        );
      }
      if (!f.dataNascimento) {
        return NextResponse.json(
          { error: `Informe a data de nascimento de ${f.nomeCompleto}.` },
          { status: 400 }
        );
      }
      if (!f.sexo || !["M", "F"].includes(f.sexo)) {
        return NextResponse.json(
          { error: `Selecione o sexo de ${f.nomeCompleto}.` },
          { status: 400 }
        );
      }
      if (!Array.isArray(f.diasParticipacao) || f.diasParticipacao.length === 0) {
        return NextResponse.json(
          { error: `Selecione pelo menos um dia de participação para ${f.nomeCompleto}.` },
          { status: 400 }
        );
      }
    }

    const agora = new Date().toISOString();

    const novosAlunosParaSalvar = listaFilhos.map((f: any, idx: number) => ({
      idTemp: f.idTemp || `resp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      nomeCompleto: f.nomeCompleto.trim().toUpperCase(),
      dataNascimento: f.dataNascimento,
      idade: f.idade !== undefined ? f.idade : null,
      sexo: f.sexo,
      diasParticipacao: f.diasParticipacao, // [{ dia: "Segunda-feira", turno: "Tarde" }]
      origem: "responsavel",
      responsavel: {
        nomeCompleto: responsavel.nomeCompleto.trim(),
        cpf: responsavel.cpf.trim(),
        whatsapp: responsavel.whatsapp.trim(),
      },
      cadastradoEm: agora,
    }));

    const supabase = getSupabaseClient();

    // 4. Salvar cada envio em linha individual para garantir concorrência atômica perfeita (sem race condition)
    // Registro isolado estritamente na tabela de conferência (sem alterar tabelas oficiais).
    const { error: errInsert } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .insert({
        nucleo_id: nucleoId,
        nucleo_nome: nucleoNome,
        professor_nome: `Responsável: ${responsavel.nomeCompleto.trim()}`,
        tem_alunos_pre_existentes: false,
        total_alunos_sistema: 0,
        total_alunos_informado: novosAlunosParaSalvar.length,
        distribuicao_turmas: {},
        alocacoes_alunos: [],
        novos_alunos_cadastrados: novosAlunosParaSalvar,
        observacoes: `Inscrição individual enviada pelo responsável ${responsavel.nomeCompleto.trim()} (WhatsApp: ${responsavel.whatsapp.trim()}, CPF: ${responsavel.cpf.trim()})`,
      });

    if (errInsert) throw errInsert;

    return NextResponse.json({
      success: true,
      totalAlunos: novosAlunosParaSalvar.length,
      alunos: novosAlunosParaSalvar,
      message: `Informações de ${novosAlunosParaSalvar.length} ${novosAlunosParaSalvar.length === 1 ? "aluno enviadas" : "alunos enviadas"} com sucesso!`,
    });
  } catch (error: any) {
    console.error("[cadastro-alunos/responsavel POST]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar informações." },
      { status: 500 }
    );
  }
}
