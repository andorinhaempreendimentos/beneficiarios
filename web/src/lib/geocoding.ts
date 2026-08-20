export interface Coordenadas {
  latitude: number;
  longitude: number;
}

interface GeocodeParams {
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

/**
 * Busca coordenadas via Photon / Nominatim de forma assíncrona.
 * Não lança erro se não encontrar, retorna null.
 */
export async function obterCoordenadasEndereco(params: GeocodeParams): Promise<Coordenadas | null> {
  const cidade = params.cidade?.trim() || "";
  const estado = params.estado?.trim() || "TO";
  const queries: string[] = [];

  if (params.cep) {
    const cepLimpo = params.cep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      queries.push(`${params.cep}, Brasil`);
    }
  }

  const ruaCompleta = [params.endereco, params.numero].filter(Boolean).join(", ");

  if (ruaCompleta && params.bairro && cidade) {
    queries.push(`${ruaCompleta}, ${params.bairro}, ${cidade}, ${estado}, Brasil`);
  }
  if (params.endereco && cidade) {
    queries.push(`${params.endereco}, ${cidade}, ${estado}, Brasil`);
  }
  if (params.bairro && cidade) {
    queries.push(`${params.bairro}, ${cidade}, ${estado}, Brasil`);
  }
  if (cidade) {
    queries.push(`${cidade}, ${estado}, Brasil`);
  }

  for (const q of queries) {
    // 1. Tentar Photon (OpenStreetMap)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
      const res = await fetch(photonUrl);
      if (res.ok) {
        const data = await res.json();
        if (data?.features?.[0]?.geometry?.coordinates) {
          const [lon, lat] = data.features[0].geometry.coordinates;
          if (typeof lat === "number" && typeof lon === "number") {
            return { latitude: lat, longitude: lon };
          }
        }
      }
    } catch {
      // continua para a próxima tentativa
    }

    // 2. Tentar Nominatim (OpenStreetMap)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=br&limit=1`;
      const res = await fetch(nomUrl, {
        headers: { "User-Agent": "BeneficiariosApp/1.0 (admin@andorinha.org)" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            return { latitude: lat, longitude: lon };
          }
        }
      }
    } catch {
      // continua
    }
  }

  return null;
}
