import { NextResponse } from "next/server";
import { loadWhatsAppConfig, createWhatsAppProvider } from "@/lib/whatsapp";

export async function GET() {
  try {
    const config = await loadWhatsAppConfig();
    const provider = createWhatsAppProvider(config);
    const status = await provider.getStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, error: err?.message || "Erro ao consultar status do WhatsApp" },
      { status: 500 }
    );
  }
}
