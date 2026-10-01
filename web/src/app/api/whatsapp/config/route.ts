import { NextResponse } from "next/server";
import { loadWhatsAppConfig, saveWhatsAppConfig, type WhatsAppConfig } from "@/lib/whatsapp";

export async function GET() {
  try {
    const config = await loadWhatsAppConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro ao carregar configurações" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WhatsAppConfig;
    if (!body || !body.provider) {
      return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
    }
    await saveWhatsAppConfig(body);
    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso!" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro ao salvar configurações" }, { status: 500 });
  }
}
