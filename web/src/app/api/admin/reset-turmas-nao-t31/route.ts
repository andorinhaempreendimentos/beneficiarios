import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.secret !== "andorinha-reset-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const t31NucleoId = "23efd617-da43-4e3c-944e-ad09e2790c2b";
    const supabase = createAdminClient();

    // 1. Soft-delete em todas as turmas cujo núcleo não seja o Campo T31
    const { data: desativadas, error: errDesat } = await (supabase as any)
      .from("grupos")
      .update({ deleted_at: new Date().toISOString() })
      .neq("nucleo_id", t31NucleoId)
      .is("deleted_at", null)
      .select("id, nome, nucleo_id");

    if (errDesat) {
      return NextResponse.json({ error: errDesat.message }, { status: 500 });
    }

    // 2. Conferir turmas ativas restantes
    const { data: ativas, error: errAtivas } = await (supabase as any)
      .from("grupos")
      .select("id, nome, nucleo_id")
      .is("deleted_at", null);

    if (errAtivas) {
      return NextResponse.json({ error: errAtivas.message }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      totalDesativadas: desativadas?.length || 0,
      totalAtivasRestantes: ativas?.length || 0,
      ativasRestantes: ativas || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro inesperado" }, { status: 500 });
  }
}
