"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Crosshair,
  Search,
  Loader2,
  X,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import {
  buscarSugestoesRuas,
  obterEnderecoPorCoordenadas,
  type EnderecoSugestao,
} from "@/lib/geocoding";
import { obterGeolocalizacaoNavegador } from "@/lib/geolocation";

export interface ReferenciaLocalizacao {
  latitude: number;
  longitude: number;
  descricao: string;
  origem: "gps" | "manual";
}

interface LocalizadorProximidadeProps {
  cidade: string;
  estadoUf: string;
  localizacaoAtiva: ReferenciaLocalizacao | null;
  onSelecionarLocalizacao: (loc: ReferenciaLocalizacao | null) => void;
}

export function LocalizadorProximidade({
  cidade,
  estadoUf,
  localizacaoAtiva,
  onSelecionarLocalizacao,
}: LocalizadorProximidadeProps) {
  const [textoBusca, setTextoBusca] = useState("");
  const [sugestoes, setSugestoes] = useState<EnderecoSugestao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [localizandoGps, setLocalizandoGps] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fecha o dropdown se o usuário clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Busca sugestões de ruas com debounce
  const handleTextoChange = (valor: string) => {
    setTextoBusca(valor);
    setErroLocalizacao(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (valor.trim().length < 2) {
      setSugestoes([]);
      setDropdownAberto(false);
      return;
    }

    setBuscando(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const resultados = await buscarSugestoesRuas(valor, cidade, estadoUf);
        setSugestoes(resultados);
        setDropdownAberto(resultados.length > 0);
      } catch {
        setSugestoes([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
  };

  // Seleciona uma sugestão do autocomplete
  const handleSelecionarSugestao = (sug: EnderecoSugestao) => {
    setTextoBusca(sug.nomeExibicao);
    setDropdownAberto(false);
    setErroLocalizacao(null);
    onSelecionarLocalizacao({
      latitude: sug.latitude,
      longitude: sug.longitude,
      descricao: sug.nomeExibicao,
      origem: "manual",
    });
  };

  // Aciona o GPS automático com Reverse Geocoding
  const handleLocalizarPorGps = async () => {
    setLocalizandoGps(true);
    setErroLocalizacao(null);

    try {
      const coords = await obterGeolocalizacaoNavegador();
      if (!coords) {
        setErroLocalizacao("Permissão de GPS negada ou indisponível. Você pode digitar o nome da rua abaixo.");
        setLocalizandoGps(false);
        return;
      }

      // Fazer reverse geocoding para descobrir o nome da rua
      const enderecoGps = await obterEnderecoPorCoordenadas(coords.latitude, coords.longitude);
      const desc = enderecoGps?.nomeExibicao || `Sua localização GPS em ${cidade}`;

      setTextoBusca(desc);
      onSelecionarLocalizacao({
        latitude: coords.latitude,
        longitude: coords.longitude,
        descricao: desc,
        origem: "gps",
      });
    } catch {
      setErroLocalizacao("Não foi possível obter sua localização exata. Digite sua rua manualmente.");
    } finally {
      setLocalizandoGps(false);
    }
  };

  // Limpar localização e retornar à ordenação padrão
  const handleLimpar = () => {
    setTextoBusca("");
    setSugestoes([]);
    setDropdownAberto(false);
    setErroLocalizacao(null);
    onSelecionarLocalizacao(null);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-sky-600" />
            <span>Encontrar Núcleos Mais Próximos</span>
          </h3>
          <p className="text-[11px] text-zinc-500">
            Use o GPS ou digite sua rua/bairro para ordenar os polos por proximidade de você.
          </p>
        </div>

        {/* Botão de 1-Clique: Núcleos perto de mim */}
        <button
          type="button"
          onClick={handleLocalizarPorGps}
          disabled={localizandoGps}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-sky-700 transition cursor-pointer disabled:opacity-60 shrink-0"
        >
          {localizandoGps ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Detectando sua rua...</span>
            </>
          ) : (
            <>
              <Crosshair className="h-3.5 w-3.5" />
              <span>Núcleos perto de mim</span>
            </>
          )}
        </button>
      </div>

      {/* Campo de Busca com Autocomplete de Ruas */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {buscando ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
            ) : (
              <Search className="h-4 w-4 text-zinc-400" />
            )}
          </div>

          <input
            type="text"
            value={textoBusca}
            onChange={(e) => handleTextoChange(e.target.value)}
            onFocus={() => sugestoes.length > 0 && setDropdownAberto(true)}
            placeholder={`Digite o nome da sua rua ou bairro em ${cidade}...`}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-8 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />

          {textoBusca && (
            <button
              type="button"
              onClick={handleLimpar}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown com sugestões de ruas da cidade */}
        {dropdownAberto && sugestoes.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Ruas encontradas em {cidade}
            </div>
            <ul className="max-h-56 overflow-y-auto divide-y divide-zinc-100">
              {sugestoes.map((sug) => (
                <li key={sug.id}>
                  <button
                    type="button"
                    onClick={() => handleSelecionarSugestao(sug)}
                    className="w-full flex items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-800 hover:bg-sky-50 hover:text-sky-900 transition cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-900 block">{sug.rua}</span>
                      <span className="text-[11px] text-zinc-500">
                        {[sug.bairro, sug.cidade, sug.estadoUf].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Banner de Endereço Ativo */}
      {localizacaoAtiva && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="truncate">
              Ordenando polos a partir de: <strong>{localizacaoAtiva.descricao}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleLimpar}
            className="text-[11px] font-bold text-emerald-800 hover:underline shrink-0 cursor-pointer"
          >
            Remover filtro
          </button>
        </div>
      )}

      {/* Mensagem de Erro / Alerta */}
      {erroLocalizacao && (
        <p className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
          {erroLocalizacao}
        </p>
      )}
    </div>
  );
}
