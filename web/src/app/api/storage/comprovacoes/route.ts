import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // 3. Obter URL assinada no Supabase Storage
  try {
    const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : supabase;

    const { data, error } = await storageClient.storage
      .from("comprovacoes")
      .createSignedUrl(cleanPath, 300);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao obter comprovante" },
      { status: 500 }
    );
  }
}
