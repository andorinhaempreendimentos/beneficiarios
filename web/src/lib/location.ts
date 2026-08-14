import type { NucleoApi } from "@/lib/api/services";

export interface NucleoComUf extends NucleoApi {
  estadoUf: string;
  cidadeNome: string;
}

/**
 * Normaliza estado (UF) e cidade de um Núcleo sem injetar fallbacks hardcoded silenciosos ("Palmas"/"TO").
 * Se cidade ou estado não estiverem preenchidos no banco, retorna "Não informada" / "Não informado".
 */
export function normalizarNucleoLocalizacao(n: NucleoApi): NucleoComUf {
  const cidadeRaw = n.cidade?.trim() || "";
  let estadoRaw = (n as any).estado?.trim() as string | undefined;

  if (!estadoRaw) {
    if (cidadeRaw.toLowerCase() === "palmas") estadoRaw = "TO";
    else if (cidadeRaw.toLowerCase() === "recife") estadoRaw = "PE";
    else estadoRaw = "Não informado";
  }

  return {
    ...n,
    estadoUf: estadoRaw,
    cidadeNome: cidadeRaw || "Não informada",
  };
}

/**
 * Avaliação explícita do status de funcionamento do Núcleo.
 */
export function isNucleoEmFuncionamento(n: NucleoApi): boolean {
  return n.emFuncionamento !== false;
}
