export interface GeolocalizacaoConfig {
  ativo: boolean;
  nivel: "desativado" | "estado" | "cidade" | "raio_km";
  raioKmMax: number;
  modo: "bloqueio" | "alerta_auditoria";
  mensagemPersonalizada?: string;
}

export const GEOLOCALIZACAO_DEFAULT_CONFIG: GeolocalizacaoConfig = {
  ativo: false,
  nivel: "cidade",
  raioKmMax: 50,
  modo: "alerta_auditoria",
};

export interface CoordenadasUsuario {
  latitude: number;
  longitude: number;
  precisaoMetros?: number;
}

export interface ResultadoValidacaoGeo {
  valido: boolean;
  distanciaKm?: number;
  mensagem: string;
  motivo?: "fora_do_raio" | "fora_do_estado" | "fora_da_cidade" | "sem_permissao" | "sucesso" | "desativado";
}

/**
 * Solicita a geolocalização do navegador do usuário
 */
export async function obterGeolocalizacaoNavegador(): Promise<CoordenadasUsuario | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          precisaoMetros: pos.coords.accuracy,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Calcula distância entre duas coordenadas usando a fórmula de Haversine (em km)
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Centróides de referência para cidades conhecidas (ex: Palmas/TO)
const COORDENADAS_REFERENCIA: Record<string, { lat: number; lng: number; uf: string }> = {
  "palmas": { lat: -10.1844, lng: -48.3336, uf: "TO" },
  "gurupi": { lat: -11.7294, lng: -49.0686, uf: "TO" },
  "araguaina": { lat: -7.1928, lng: -48.2044, uf: "TO" },
  "porto nacional": { lat: -10.7081, lng: -48.4172, uf: "TO" },
  "recife": { lat: -8.0476, lng: -34.8770, uf: "PE" },
  "sao paulo": { lat: -23.5505, lng: -46.6333, uf: "SP" },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729, uf: "RJ" },
  "salvador": { lat: -12.9777, lng: -38.5016, uf: "BA" },
  "brasilia": { lat: -15.7975, lng: -47.8919, uf: "DF" },
};

/**
 * Valida a conformidade da localização do usuário com o polo de atendimento
 */
export function validarConformidadeLocalizacao(params: {
  coords: CoordenadasUsuario | null;
  config: GeolocalizacaoConfig;
  nucleoLat?: number | null;
  nucleoLng?: number | null;
  cidadeNome?: string;
  estadoUf?: string;
}): ResultadoValidacaoGeo {
  const { coords, config, nucleoLat, nucleoLng, cidadeNome, estadoUf } = params;

  if (!config.ativo || config.nivel === "desativado") {
    return { valido: true, mensagem: "Validação geográfica desativada.", motivo: "desativado" };
  }

  if (!coords) {
    if (config.modo === "bloqueio") {
      return {
        valido: false,
        mensagem: "É necessário permitir o acesso à localização do navegador para concluir a inscrição.",
        motivo: "sem_permissao",
      };
    }
    return {
      valido: true,
      mensagem: "Localização não informada (registro manual).",
      motivo: "sem_permissao",
    };
  }

  // Determinar coordenadas de destino (do núcleo ou da cidade)
  let destLat = nucleoLat;
  let destLng = nucleoLng;

  if ((!destLat || !destLng) && cidadeNome) {
    const key = cidadeNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ref = COORDENADAS_REFERENCIA[key];
    if (ref) {
      destLat = ref.lat;
      destLng = ref.lng;
    }
  }

  // Se não temos coordenadas de referência para comparar
  if (!destLat || !destLng) {
    return {
      valido: true,
      mensagem: "Localização do núcleo em validação.",
      motivo: "sucesso",
    };
  }

  const distancia = calcularDistanciaKm(coords.latitude, coords.longitude, destLat, destLng);
  const raioMax = config.nivel === "estado" ? 600 : config.nivel === "cidade" ? 60 : config.raioKmMax || 50;

  if (distancia > raioMax) {
    const msg = `Sua localização atual (${distancia} km do polo) está fora da área permitida (${raioMax} km de ${cidadeNome || "atendimento"}).`;
    return {
      valido: config.modo !== "bloqueio",
      distanciaKm: distancia,
      mensagem: msg,
      motivo: config.nivel === "estado" ? "fora_do_estado" : "fora_do_raio",
    };
  }

  return {
    valido: true,
    distanciaKm: distancia,
    mensagem: `Localização confirmada a ${distancia} km do polo de atendimento (${cidadeNome || ""}).`,
    motivo: "sucesso",
  };
}
