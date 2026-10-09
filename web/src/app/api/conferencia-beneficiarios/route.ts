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

// GET: Retorna lista consolidada dos 20 núcleos com status de resposta para o painel
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

    // 2. Professores da conferência 1
    const { data: conf1List } = await supabase
      .from("respostas_conferencia_professores")
      .select("nucleo_id, nucleo_nome, professor_nome, modalidade_nome, qtd_turmas");

    const conf1Map: Record<string, any> = {};
    (conf1List || []).forEach((c) => {
      if (c.nucleo_id) conf1Map[c.nucleo_id] = c;
      if (c.nucleo_nome) conf1Map[c.nucleo_nome] = c;
    });

    // 3. Contagem de alunos oficiais no banco por núcleo via RPC segura
    const { data: contagensRpc } = await supabase.rpc("get_contagem_alunos_nucleos");

    const contagemAlunosMap: Record<string, number> = {};
    (contagensRpc || []).forEach((c: any) => {
      if (c.nucleo_id) {
        contagemAlunosMap[c.nucleo_id] = Number(c.total_alunos) || 0;
      }
    });

    // 4. Respostas já enviadas na conferência 2
    const { data: respostas, error: errResp } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (errResp) throw errResp;

    const respostasPorNucleoMap: Record<string, any> = {};
    (respostas || []).forEach((r) => {
      if (!r.nucleo_id) return;
      if (!respostasPorNucleoMap[r.nucleo_id]) {
        respostasPorNucleoMap[r.nucleo_id] = {
          ...r,
          novos_alunos_cadastrados: Array.isArray(r.novos_alunos_cadastrados)
            ? [...r.novos_alunos_cadastrados]
            : [],
          envios_individuais: [r],
        };
      } else {
        const principal = respostasPorNucleoMap[r.nucleo_id];
        principal.envios_individuais.push(r);

        const alunosExtras = Array.isArray(r.novos_alunos_cadastrados)
          ? r.novos_alunos_cadastrados
          : [];
        principal.novos_alunos_cadastrados.push(...alunosExtras);

        principal.total_alunos_informado = Math.max(
          principal.total_alunos_informado,
          principal.novos_alunos_cadastrados.length
        );
      }
    });

    // 5. Montar lista enriquecida dos 20 núcleos
    const listaConsolidada = (nucleos || []).map((n) => {
      const conf1 = conf1Map[n.id] || conf1Map[n.identificacao] || {};
      const totalAlunos = contagemAlunosMap[n.id] || 0;
      const resposta = respostasPorNucleoMap[n.id] || null;

      return {
        id: n.id,
        identificacao: n.identificacao,
        nomeLocal: n.nome_local,
        professorNome: conf1.professor_nome || "Não identificado",
        modalidadeNome: conf1.modalidade_nome || "Futebol de Campo",
        temAlunosPreExistentes: totalAlunos > 0,
        totalAlunosSistema: totalAlunos,
        respondido: Boolean(resposta),
        resposta,
      };
    });

    return NextResponse.json({
      nucleos: listaConsolidada,
      totalNucleos: listaConsolidada.length,
      totalRespondidos: listaConsolidada.filter((i) => i.respondido).length,
      respostasCompletas: respostas || [],
    });
  } catch (error: any) {
    console.error("[conferencia-beneficiarios GET]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar núcleos" },
      { status: 500 }
    );
  }
}

// POST: Salva resposta enviada pelo professor na tabela isolada
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nucleoId,
      nucleoNome,
      professorNome,
      temAlunosPreExistentes,
      totalAlunosSistema,
      totalAlunosInformado,
      distribuicaoTurmas,
      alocacoesAlunos,
      novosAlunosCadastrados,
      observacoes,
    } = body;

    if (!nucleoId || !nucleoNome) {
      return NextResponse.json(
        { error: "Identificação do núcleo é obrigatória." },
        { status: 400 }
      );
    }

    if (totalAlunosInformado === undefined || totalAlunosInformado === null) {
      return NextResponse.json(
        { error: "Quantidade de alunos deve ser informada." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .insert({
        nucleo_id: nucleoId,
        nucleo_nome: nucleoNome,
        professor_nome: professorNome || null,
        tem_alunos_pre_existentes: Boolean(temAlunosPreExistentes),
        total_alunos_sistema: Number(totalAlunosSistema) || 0,
        total_alunos_informado: Number(totalAlunosInformado) || 0,
        distribuicao_turmas: distribuicaoTurmas || {},
        alocacoes_alunos: alocacoesAlunos || [],
        novos_alunos_cadastrados: novosAlunosCadastrados || [],
        observacoes: observacoes ? String(observacoes).trim() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Resposta salva com sucesso na conferência de beneficiários.",
    });
  } catch (error: any) {
    console.error("[conferencia-beneficiarios POST]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar resposta da conferência." },
      { status: 500 }
    );
  }
}

// DELETE: Permite coordenador excluir uma resposta para liberar novo envio
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da resposta obrigatório." }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Resposta removida." });
  } catch (error: any) {
    console.error("[conferencia-beneficiarios DELETE]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir resposta." },
      { status: 500 }
    );
  }
}
