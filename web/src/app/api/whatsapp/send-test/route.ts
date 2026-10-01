import { NextResponse } from "next/server";
import { loadWhatsAppConfig, createWhatsAppProvider } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();
    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Informe o número de telefone e o texto da mensagem." },
        { status: 400 }
      );
    }

    const config = await loadWhatsAppConfig();
    const provider = createWhatsAppProvider(config);
    const result = await provider.sendMessage({ phone, message });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao disparar mensagem de teste" },
      { status: 500 }
    );
  }
}
