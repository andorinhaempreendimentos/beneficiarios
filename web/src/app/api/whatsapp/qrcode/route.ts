import { NextResponse } from "next/server";
import { loadWhatsAppConfig, createWhatsAppProvider } from "@/lib/whatsapp";

export async function GET() {
  try {
    const config = await loadWhatsAppConfig();
    const provider = createWhatsAppProvider(config);
    const qr = await provider.getQRCode();
    return NextResponse.json(qr);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao obter QR Code" },
      { status: 500 }
    );
  }
}
