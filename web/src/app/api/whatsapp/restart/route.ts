import { NextResponse } from "next/server";
import { loadWhatsAppConfig, createWhatsAppProvider } from "@/lib/whatsapp";

export async function POST() {
  try {
    const config = await loadWhatsAppConfig();
    const provider = createWhatsAppProvider(config);
    const result = await provider.restart();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao reiniciar instância" },
      { status: 500 }
    );
  }
}
