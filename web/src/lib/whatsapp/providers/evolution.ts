import type {
  WhatsAppProvider,
  WhatsAppProviderType,
  WhatsAppStatus,
  WhatsAppQRCode,
  SendMessageParams,
  SendMessageResult,
  EvolutionConfig,
} from "../types";

export class EvolutionProvider implements WhatsAppProvider {
  readonly providerType: WhatsAppProviderType = "evolution";
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return (this.config.baseUrl || "http://localhost:8080").replace(/\/+$/, "");
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      apikey: this.config.apiKey || "",
    };
  }

  async getStatus(): Promise<WhatsAppStatus> {
    if (!this.config.baseUrl || !this.config.instanceName) {
      return {
        connected: false,
        provider: "evolution",
        error: "Evolution API não configurada.",
      };
    }

    try {
      const url = `${this.getBaseUrl()}/instance/connectionState/${encodeURIComponent(this.config.instanceName)}`;
      const res = await fetch(url, { headers: this.getHeaders(), cache: "no-store" });
      if (!res.ok) {
        return {
          connected: false,
          provider: "evolution",
          error: `Erro ao obter status Evolution API (${res.status})`,
        };
      }
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      const connected = state === "open";
      return {
        connected,
        provider: "evolution",
        rawStatus: state,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: "evolution",
        error: err?.message || "Erro de conexão com Evolution API",
      };
    }
  }

  async getQRCode(): Promise<WhatsAppQRCode> {
    if (!this.config.instanceName) {
      return { error: "Nome da instância não informado." };
    }
    try {
      const url = `${this.getBaseUrl()}/instance/connect/${encodeURIComponent(this.config.instanceName)}`;
      const res = await fetch(url, { headers: this.getHeaders(), cache: "no-store" });
      const data = await res.json();
      return {
        qrcode: data?.base64 || data?.qrcode?.base64,
        pairingCode: data?.pairingCode,
      };
    } catch (err: any) {
      return { error: err?.message || "Erro ao conectar com Evolution API" };
    }
  }

  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}/instance/logout/${encodeURIComponent(this.config.instanceName)}`;
      const res = await fetch(url, { method: "DELETE", headers: this.getHeaders() });
      return { success: res.ok };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async restart(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}/instance/restart/${encodeURIComponent(this.config.instanceName)}`;
      const res = await fetch(url, { method: "POST", headers: this.getHeaders() });
      return { success: res.ok };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      const url = `${this.getBaseUrl()}/message/sendText/${encodeURIComponent(this.config.instanceName)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: params.phone.replace(/\D/g, ""),
          text: params.message,
        }),
      });
      const data = await res.json();
      return {
        success: res.ok,
        messageId: data?.key?.id,
        error: res.ok ? undefined : (data?.message || "Erro ao enviar"),
      };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }
}
