import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Caminho não informado" }, { status: 400 });
  }

  // 1. Validar autenticação do usuário
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 2. Limpar caminho do arquivo
  let cleanPath = decodeURIComponent(path).trim();
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);
  if (cleanPath.startsWith("comprovacoes/")) cleanPath = cleanPath.replace("comprovacoes/", "");

  // 3. Obter arquivo diretamente do Supabase Storage e entregar bytes ao navegador
  try {
    const { data, error } = await supabase.storage
      .from("comprovacoes")
      .download(cleanPath);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    const buffer = await data.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": data.type || "image/jpeg",
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao obter comprovante" },
      { status: 500 }
    );
  }
}
