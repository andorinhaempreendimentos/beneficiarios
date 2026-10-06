import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qrzszjogxrrjqjkoowoi.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo";
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // 1. Núcleos ativos
    const { data: nucleos, error: errNuc } = await supabase
      .from("nucleos")
      .select("id, identificacao, nome_local")
      .is("deleted_at", null)
      .order("identificacao");

    if (errNuc) throw errNuc;

    // 2. Professores ativos
    const { data: professores, error: errProf } = await supabase
      .from("funcionarios")
      .select("id, nome_completo, nucleo_id, funcao")
      .is("deleted_at", null)
      .ilike("funcao", "%Professor%")
      .order("nome_completo");

    if (errProf) throw errProf;

    // 3. Modalidades / Atividades esportivas
    const { data: atividades, error: errAtiv } = await supabase
      .from("atividades")
      .select("id, nome")
      .not("nome", "ilike", "%Planejamento%")
      .not("nome", "ilike", "%Capacitação%")
      .order("nome");

    if (errAtiv) throw errAtiv;

    // 4. Mapeamento nucleo <-> atividades
    const { data: nucleoAtiv, error: errNA } = await supabase
      .from("nucleo_atividades")
      .select("nucleo_id, atividade_id");

    if (errNA) throw errNA;

    return NextResponse.json({
      nucleos: nucleos || [],
      professores: professores || [],
      atividades: atividades || [],
      nucleoAtividades: nucleoAtiv || [],
    });
  } catch (error: any) {
    console.error("[conferencia-professores GET]", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar dados" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nucleoId,
      nucleoNome,
      professorId,
      professorNome,
      modalidadeId,
      modalidadeNome,
      qtdTurmas,
      dadosTurmas,
      observacoes,
    } = body;

    if (!nucleoNome || !professorNome || !modalidadeNome || !dadosTurmas) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos." }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const qtd = Number(qtdTurmas) || (Array.isArray(dadosTurmas) ? dadosTurmas.length : 1);

    const { data, error } = await supabase
      .from("respostas_conferencia_professores")
      .insert({
        nucleo_id: nucleoId || null,
        nucleo_nome: nucleoNome,
        professor_id: professorId || null,
        professor_nome: professorNome,
        modalidade_id: modalidadeId || null,
        modalidade_nome: modalidadeNome,
        qtd_turmas: qtd,
        dados_turmas: dadosTurmas,
        observacoes: observacoes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("[conferencia-professores POST]", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar resposta" }, { status: 500 });
  }
}
