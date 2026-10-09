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

// POST: Recebe a inscrição enviada pelo responsável (com 1 ou mais filhos)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nucleoId,
      nucleoNome,
      responsavel,
      filhos,
      aluno, // fallback caso venha no formato antigo
    } = body;

    // 1. Identificação do núcleo
    if (!nucleoId || !nucleoNome) {
      return NextResponse.json(
        { error: "Identificação do núcleo é obrigatória." },
        { status: 400 }
      );
    }

    // 2. Validações do responsável
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

    // 3. Normalizar lista de filhos
    const listaFilhosRaw = Array.isArray(filhos) && filhos.length > 0 ? filhos : aluno ? [aluno] : [];
    if (listaFilhosRaw.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um filho antes de enviar a inscrição." },
        { status: 400 }
      );
    }

    // Validar cada filho
    for (let i = 0; i < listaFilhosRaw.length; i++) {
      const f = listaFilhosRaw[i];
      if (!f.nomeCompleto || !f.nomeCompleto.trim()) {
        return NextResponse.json(
          { error: `Informe o nome completo do filho #${i + 1}.` },
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
    }

    const agora = new Date().toISOString();

    const novosAlunosParaSalvar = listaFilhosRaw.map((f: any, idx: number) => ({
      idTemp: f.idTemp || `resp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      nomeCompleto: f.nomeCompleto.trim().toUpperCase(),
      dataNascimento: f.dataNascimento,
      idade: f.idade !== undefined ? f.idade : null,
      sexo: f.sexo,
      cpf: f.cpf ? String(f.cpf).trim() : null,
      diasSemana: Array.isArray(f.diasSemana) ? f.diasSemana : [],
      turno: f.turno || "Tarde",
      turmaId: f.turmaId || null,
      turmaNome: f.turmaNome || null,
      origem: "responsavel",
      responsavel: {
        nomeCompleto: responsavel.nomeCompleto.trim(),
        cpf: responsavel.cpf.trim(),
        whatsapp: responsavel.whatsapp.trim(),
      },
      observacoes: f.observacoes ? String(f.observacoes).trim() : null,
      cadastradoEm: agora,
    }));

    const supabase = getSupabaseClient();

    // 4. Buscar registro existente na tabela de conferência
    const { data: registroExistente } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .select("id, novos_alunos_cadastrados, total_alunos_informado")
      .eq("nucleo_id", nucleoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (registroExistente) {
      const listaAtual = Array.isArray(registroExistente.novos_alunos_cadastrados)
        ? registroExistente.novos_alunos_cadastrados
        : [];

      const listaAtualizada = [...novosAlunosParaSalvar, ...listaAtual];
      const novoTotal = (registroExistente.total_alunos_informado || 0) + novosAlunosParaSalvar.length;

      const { error: errUpdate } = await supabase
        .from("respostas_conferencia_beneficiarios")
        .update({
          novos_alunos_cadastrados: listaAtualizada,
          total_alunos_informado: novoTotal,
          updated_at: agora,
        })
        .eq("id", registroExistente.id);

      if (errUpdate) throw errUpdate;
    } else {
      const { error: errInsert } = await supabase
        .from("respostas_conferencia_beneficiarios")
        .insert({
          nucleo_id: nucleoId,
          nucleo_nome: nucleoNome,
          professor_nome: null,
          tem_alunos_pre_existentes: false,
          total_alunos_sistema: 0,
          total_alunos_informado: novosAlunosParaSalvar.length,
          distribuicao_turmas: {},
          alocacoes_alunos: [],
          novos_alunos_cadastrados: novosAlunosParaSalvar,
          observacoes: "Inscrições enviadas por responsáveis",
        });

      if (errInsert) throw errInsert;
    }

    return NextResponse.json({
      success: true,
      totalFilhos: novosAlunosParaSalvar.length,
      filhos: novosAlunosParaSalvar.map((f: any) => ({
        nomeCompleto: f.nomeCompleto,
        diasSemana: f.diasSemana,
        turno: f.turno,
      })),
      message: `Inscrição de ${novosAlunosParaSalvar.length} ${novosAlunosParaSalvar.length === 1 ? "aluno" : "alunos"} realizada com sucesso!`,
    });
  } catch (error: any) {
    console.error("[cadastro-alunos/responsavel POST]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar inscrição do responsável." },
      { status: 500 }
    );
  }
}
