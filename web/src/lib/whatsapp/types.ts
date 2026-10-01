export type WhatsAppProviderType = "zapi" | "evolution" | "meta";

export interface ZApiConfig {
  instanceId: string;
  token: string;
  clientToken?: string;
  baseUrl?: string;
}

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface MetaConfig {
  phoneNumberId: string;
  accessToken: string;
  wabaId: string;
}

export interface WhatsAppConfig {
  provider: WhatsAppProviderType;
  zapi: ZApiConfig;
  evolution?: EvolutionConfig;
  meta?: MetaConfig;
}

export interface WhatsAppStatus {
  connected: boolean;
  smartphoneConnected?: boolean;
  phone?: string;
  profileName?: string;
  batteryLevel?: number;
  provider: WhatsAppProviderType;
  rawStatus?: string;
  error?: string;
}

export interface WhatsAppQRCode {
  qrcode?: string; // Data URI base64 (data:image/png;base64,...) ou string bruta
  pairingCode?: string;
  error?: string;
}

export interface SendMessageParams {
  phone: string;
  message: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  zaapId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  readonly providerType: WhatsAppProviderType;
  getStatus(): Promise<WhatsAppStatus>;
  getQRCode(): Promise<WhatsAppQRCode>;
  disconnect(): Promise<{ success: boolean; error?: string }>;
  restart(): Promise<{ success: boolean; error?: string }>;
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
}
