import type {
  WhatsAppProvider,
  WhatsAppProviderType,
  WhatsAppStatus,
  WhatsAppQRCode,
  SendMessageParams,
  SendMessageResult,
  ZApiConfig,
} from "../types";

export class ZApiProvider implements WhatsAppProvider {
  readonly providerType: WhatsAppProviderType = "zapi";
  private config: ZApiConfig;

  constructor(config: ZApiConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    const root = (this.config.baseUrl || "https://api.z-api.io").replace(/\/+$/, "");
    const instanceId = encodeURIComponent(this.config.instanceId.trim());
    const token = encodeURIComponent(this.config.token.trim());
    return `${root}/instances/${instanceId}/token/${token}`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.clientToken?.trim()) {
      headers["Client-Token"] = this.config.clientToken.trim();
    }
    return headers;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
      return `55${digits}`;
    }
    return digits;
  }

  async getStatus(): Promise<WhatsAppStatus> {
    if (!this.config.instanceId?.trim() || !this.config.token?.trim()) {
      return {
        connected: false,
        provider: "zapi",
        error: "Credenciais da Z-API não configuradas (ID da Instância ou Token ausente).",
      };
    }

    try {
      const url = `${this.getBaseUrl()}/status`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          connected: false,
          provider: "zapi",
          error: `Erro ao consultar status na Z-API (${res.status}): ${text}`,
        };
      }

      const data = await res.json();
      const connected = Boolean(data.connected);

      let phone: string | undefined;
      let profileName: string | undefined;
      let batteryLevel: number | undefined;

      // Se conectado, tentar obter dados complementares do aparelho
      if (connected) {
        try {
          const devRes = await fetch(`${this.getBaseUrl()}/device`, {
            method: "GET",
            headers: this.getHeaders(),
            cache: "no-store",
          });
          if (devRes.ok) {
            const devData = await devRes.json();
            phone = devData.phone || devData.wid;
            profileName = devData.name || devData.pushname;
            batteryLevel = typeof devData.battery === "number" ? devData.battery : undefined;
          }
        } catch {
          // Erro silencioso em endpoint complementar
        }
      }

      return {
        connected,
        smartphoneConnected: data.smartphoneConnected ?? connected,
        phone,
        profileName,
        batteryLevel,
        provider: "zapi",
        rawStatus: JSON.stringify(data),
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: "zapi",
        error: err?.message || "Falha de conexão com a Z-API",
      };
    }
  }

  async getQRCode(): Promise<WhatsAppQRCode> {
    if (!this.config.instanceId?.trim() || !this.config.token?.trim()) {
      return { error: "Credenciais da Z-API não configuradas." };
    }

    try {
      const url = `${this.getBaseUrl()}/qr-code/image`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        return { error: `Erro Z-API (${res.status}): ${text}` };
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const qr = data.value || data.qrcode || data.qr;
        return { qrcode: qr };
      } else {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return { qrcode: `data:image/png;base64,${base64}` };
      }
    } catch (err: any) {
      return { error: err?.message || "Falha ao obter QR Code da Z-API" };
    }
  }

  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}/disconnect`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: text };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro ao desconectar instância" };
    }
  }

  async restart(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}/restart`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: text };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro ao reiniciar instância" };
    }
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    if (!params.phone?.trim() || !params.message?.trim()) {
      return { success: false, error: "Telefone e mensagem são obrigatórios." };
    }

    try {
      const normalizedPhone = this.normalizePhone(params.phone);
      const url = `${this.getBaseUrl()}/send-text`;
      const res = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone: normalizedPhone,
          message: params.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.message || data.error || `Erro Z-API ${res.status}`,
        };
      }

      return {
        success: true,
        messageId: data.messageId || data.id,
        zaapId: data.zaapId,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Falha na comunicação ao enviar mensagem",
      };
    }
  }
}
