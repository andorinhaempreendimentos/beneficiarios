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
    const { data, error } = await supabase
      .from("respostas_conferencia_professores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ respostas: data || [] });
  } catch (err: any) {
    console.error("[respostas GET]", err);
    return NextResponse.json({ error: err.message || "Erro ao buscar respostas" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, ids } = body;

    const targets = ids || (id ? [id] : []);
    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({ error: "Nenhum ID informado para exclusão" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: deletados, error } = await supabase
      .from("respostas_conferencia_professores")
      .delete()
      .in("id", targets)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ success: true, deletedCount: deletados?.length || 0 });
  } catch (err: any) {
    console.error("[respostas DELETE]", err);
    return NextResponse.json({ error: err.message || "Erro ao excluir resposta" }, { status: 500 });
  }
}
