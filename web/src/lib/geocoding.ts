export interface EnderecoSugestao {
  id: string;
  nomeExibicao: string;
  rua: string;
  bairro?: string;
  cidade: string;
  estadoUf: string;
  latitude: number;
  longitude: number;
}

/**
 * Busca sugestões de ruas em tempo real via OpenStreetMap / Nominatim
 * Restringe a busca à cidade e estado selecionados.
 */
export async function buscarSugestoesRuas(
  termo: string,
  cidade: string,
  estadoUf: string
): Promise<EnderecoSugestao[]> {
  const queryLimpa = termo.trim();
  if (!queryLimpa || queryLimpa.length < 2) return [];

  try {
    const consulta = `${queryLimpa}, ${cidade}, ${estadoUf}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      consulta
    )}&countrycodes=br&limit=6`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "AndorinhaBeneficiarios/1.0",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item: any, idx: number) => {
        const addr = item.address || {};
        const rua = addr.road || addr.pedestrian || addr.suburb || item.name || queryLimpa;
        const bairro = addr.suburb || addr.neighbourhood || addr.city_district || "";
        const cid = addr.city || addr.town || addr.municipality || cidade;
        const uf = addr.state_code || estadoUf;

        const nomeFormatado = [rua, bairro, cid].filter(Boolean).join(" - ");

        return {
          id: `${item.place_id || idx}`,
          nomeExibicao: nomeFormatado,
          rua,
          bairro: bairro || undefined,
          cidade: cid,
          estadoUf: uf,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      })
      .filter((item) => !isNaN(item.latitude) && !isNaN(item.longitude));
  } catch (error) {
    console.error("Erro ao buscar sugestões de ruas:", error);
    return [];
  }
}

/**
 * Obtém o nome da rua aproximada a partir de coordenadas GPS (Reverse Geocoding)
 */
export async function obterEnderecoPorCoordenadas(
  latitude: number,
  longitude: number
): Promise<EnderecoSugestao | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "AndorinhaBeneficiarios/1.0",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.address) return null;

    const addr = data.address;
    const rua = addr.road || addr.pedestrian || addr.suburb || data.name || "Sua localização atual";
    const bairro = addr.suburb || addr.neighbourhood || addr.city_district || "";
    const cidade = addr.city || addr.town || addr.municipality || "";
    const estadoUf = addr.state_code || addr.state || "";

    const nomeFormatado = [rua, bairro, cidade].filter(Boolean).join(" - ");

    return {
      id: `${data.place_id || "gps"}`,
      nomeExibicao: nomeFormatado || "Localização identificada via GPS",
      rua,
      bairro: bairro || undefined,
      cidade,
      estadoUf,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Erro no reverse geocoding:", error);
    return null;
  }
}

export interface CoordenadasGeograficas {
  latitude: number;
  longitude: number;
}

/**
 * Obtém coordenadas (latitude/longitude) a partir de um endereço textual estruturado
 */
export async function obterCoordenadasEndereco(params: {
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}): Promise<CoordenadasGeograficas | null> {
  const partes = [
    params.endereco,
    params.numero,
    params.bairro,
    params.cidade,
    params.estado,
    params.cep,
    "Brasil",
  ].filter(Boolean);

  if (partes.length < 2) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      partes.join(", ")
    )}&countrycodes=br&limit=1`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "AndorinhaBeneficiarios/1.0",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter coordenadas do endereço:", error);
    return null;
  }
}

