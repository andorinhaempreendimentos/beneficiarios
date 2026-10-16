import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SENHA_CORRETA = "Datalake123#";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qrzszjogxrrjqjkoowoi.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo";
  return createClient(url, key);
}

function validarSenha(req: Request): boolean {
  // 1. Header customizado
  const headerSenha = req.headers.get("x-datalake-senha");
  if (headerSenha === SENHA_CORRETA) return true;

  // 2. Query string
  const url = new URL(req.url);
  const querySenha = url.searchParams.get("senha");
  if (querySenha === SENHA_CORRETA) return true;

  return false;
}

export async function GET(req: Request) {
  try {
    if (!validarSenha(req)) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Senha inválida ou ausente." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Buscar todos os 20 núcleos oficiais para termos o mapa completo de metas
    const { data: nucleos, error: errNucleos } = await supabase
      .from("nucleos")
      .select("id, identificacao, nome_local")
      .is("deleted_at", null)
      .order("identificacao", { ascending: true });

    if (errNucleos) {
      console.error("[Datalake API] Erro ao buscar nucleos:", errNucleos);
      return NextResponse.json({ error: "Erro ao buscar núcleos." }, { status: 500 });
    }

    // 2. Buscar registros da view do datalake
    const { data: alunos, error: errAlunos } = await supabase
      .from("vw_datalake_beneficiarios")
      .select("*")
      .order("nucleo_nome", { ascending: true })
      .order("nome_completo", { ascending: true });

    if (errAlunos) {
      console.error("[Datalake API] Erro ao consultar vw_datalake_beneficiarios:", errAlunos);
      return NextResponse.json(
        { error: "Erro ao carregar dados do datalake." },
        { status: 500 }
      );
    }

    const listaAlunos = alunos || [];

    // 3. Agregar métricas por núcleo e gerais
    let totalBanco = 0;
    let totalFormulario = 0;

    // Mapa de contadores por nucleo_id
    const statsPorNucleo: Record<
      string,
      { banco: number; formulario: number; total: number }
    > = {};

    listaAlunos.forEach((a) => {
      if (a.origem === "banco_ativo") {
        totalBanco++;
      } else {
        totalFormulario++;
      }

      const nId = a.nucleo_id || "sem_nucleo";
      if (!statsPorNucleo[nId]) {
        statsPorNucleo[nId] = { banco: 0, formulario: 0, total: 0 };
      }

      if (a.origem === "banco_ativo") {
        statsPorNucleo[nId].banco++;
      } else {
        statsPorNucleo[nId].formulario++;
      }
      statsPorNucleo[nId].total++;
    });

    // 4. Montar cards de metas para todos os 20 núcleos
    const nucleosMetas = (nucleos || []).map((n) => {
      const stats = statsPorNucleo[n.id] || { banco: 0, formulario: 0, total: 0 };
      const meta = 100;
      const pct = Math.min(100, Math.round((stats.total / meta) * 100));

      return {
        id: n.id,
        nome: n.identificacao,
        nomeLocal: n.nome_local,
        totalBanco: stats.banco,
        totalFormulario: stats.formulario,
        totalGeral: stats.total,
        meta,
        percentual: pct,
        statusMeta: stats.total >= meta ? "atingida" : stats.total > 0 ? "em_andamento" : "zerado",
      };
    });

    return NextResponse.json({
      success: true,
      resumo: {
        totalGeral: listaAlunos.length,
        totalBanco,
        totalFormulario,
        totalNucleos: (nucleos || []).length,
        atualizadoEm: new Date().toISOString(),
      },
      nucleosMetas,
      alunos: listaAlunos,
    });
  } catch (error: any) {
    console.error("[Datalake API] Exceção:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const senha = body?.senha;

    if (senha !== SENHA_CORRETA) {
      return NextResponse.json(
        { error: "Senha de acesso incorreta." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      mensagem: "Autenticação bem-sucedida.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Erro na autenticação." }, { status: 500 });
  }
}
