import type { TemaId } from "@/lib/theme";

export interface ConfigAparencia {
  temaId: TemaId;
  nomeSistema: string;
  logoUrl?: string;
}

// Mock em memória — em produção viria do banco via API
let config: ConfigAparencia = {
  temaId: "andorinha",
  nomeSistema: "Andorinha",
};

export function getAparencia(): ConfigAparencia {
  return { ...config };
}

export function setAparencia(next: Partial<ConfigAparencia>): ConfigAparencia {
  config = { ...config, ...next };
  return { ...config };
}
