import { createAdminClient } from "@/lib/supabase/admin";
import { ZApiProvider } from "./providers/zapi";
import { EvolutionProvider } from "./providers/evolution";
import type { WhatsAppConfig, WhatsAppProvider } from "./types";

export * from "./types";
export * from "./providers/zapi";
export * from "./providers/evolution";

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  provider: "zapi",
  zapi: {
    instanceId: "",
    token: "",
    clientToken: "",
    baseUrl: "https://api.z-api.io",
  },
  evolution: {
    baseUrl: "",
    apiKey: "",
    instanceName: "",
  },
};

/**
 * Cria a instância do provedor configurado
 */
export function createWhatsAppProvider(config: WhatsAppConfig): WhatsAppProvider {
  switch (config.provider) {
    case "zapi":
      return new ZApiProvider(config.zapi);
    case "evolution":
      if (!config.evolution) {
        throw new Error("Configuração da Evolution API ausente.");
      }
      return new EvolutionProvider(config.evolution);
    default:
      return new ZApiProvider(config.zapi);
  }
}

/**
 * Carrega a configuração gravada no banco Supabase
 */
export async function loadWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("configuracoes")
      .select("valor")
      .eq("chave", "whatsapp_gateway")
      .maybeSingle();

    if (error || !data?.valor) {
      // Tentar chave legada whatsapp_zapi se existir
      const { data: legacyData } = await sb
        .from("configuracoes")
        .select("valor")
        .eq("chave", "whatsapp_zapi")
        .maybeSingle();

      if (legacyData?.valor && typeof legacyData.valor === "object") {
        const val = legacyData.valor as any;
        return {
          ...DEFAULT_WHATSAPP_CONFIG,
          provider: "zapi",
          zapi: {
            instanceId: val.instanceId || val.instance_id || "",
            token: val.token || "",
            clientToken: val.clientToken || val.client_token || "",
            baseUrl: val.baseUrl || val.base_url || "https://api.z-api.io",
          },
        };
      }

      return DEFAULT_WHATSAPP_CONFIG;
    }

    const val = data.valor as any;
    return {
      provider: val.provider || "zapi",
      zapi: {
        instanceId: val.zapi?.instanceId || "",
        token: val.zapi?.token || "",
        clientToken: val.zapi?.clientToken || "",
        baseUrl: val.zapi?.baseUrl || "https://api.z-api.io",
      },
      evolution: {
        baseUrl: val.evolution?.baseUrl || "",
        apiKey: val.evolution?.apiKey || "",
        instanceName: val.evolution?.instanceName || "",
      },
    };
  } catch (err) {
    console.error("Erro ao carregar configuracoes de WhatsApp:", err);
    return DEFAULT_WHATSAPP_CONFIG;
  }
}

/**
 * Salva a configuração no banco Supabase
 */
export async function saveWhatsAppConfig(config: WhatsAppConfig): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from("configuracoes").upsert(
    {
      chave: "whatsapp_gateway",
      valor: config as any,
      descricao: "Configuração do Gateway de WhatsApp (Multi-Provedores)",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "chave" }
  );

  if (error) {
    throw new Error(`Erro ao salvar configuração: ${error.message}`);
  }
}
