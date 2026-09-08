"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MapPin, ExternalLink, Search, ChevronDown, Check, X } from "lucide-react";
import { useDicionario } from "@/components/providers/DictionaryProvider";

export interface NucleoMapaData {
  id: string;
  identificacao: string;
  nomeLocal?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string;
  latitude?: number;
  longitude?: number;
  emFuncionamento?: boolean;
  organizacaoId?: string;
  organizacaoNome?: string;
  totalVagas: number;
  totalMatriculados: number;
  vagasLivres: number;
  taxaOcupacao: number;
  atividadeIds?: string[];
}

export interface AtividadeMapaOpcao {
  id: string;
  nome: string;
}

interface MapaPolosProps {
  nucleos: NucleoMapaData[];
  atividades?: AtividadeMapaOpcao[];
  className?: string;
}

function getCorOcupacao(taxa: number): { cor: string; label: string } {
  if (taxa < 50) {
    return { cor: "#dc2626", label: "Menos de 50%" };
  }
  if (taxa < 75) {
    return { cor: "#f59e0b", label: "De 50% a 74,99%" };
  }
  if (taxa < 100) {
    return { cor: "#0284c7", label: "De 75% a 99,99%" };
  }
  return { cor: "#16a34a", label: "100% ou mais" };
}

function criarIconePin(cor: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="28" height="38" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="${cor}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
    </svg>
  `;
}

export function MapaPolos({ nucleos, atividades = [], className = "" }: MapaPolosProps) {
  const { t } = useDicionario();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [filtroNucleoId, setFiltroNucleoId] = useState("");
  const [filtroAtividadeId, setFiltroAtividadeId] = useState("");
  const [nucleoSelecionado, setNucleoSelecionado] = useState<NucleoMapaData | null>(null);
  const [buscaNucleoTexto, setBuscaNucleoTexto] = useState("");
  const [selectNucleoAberto, setSelectNucleoAberto] = useState(false);
  const selectNucleoRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown de núcleo ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectNucleoRef.current && !selectNucleoRef.current.contains(event.target as Node)) {
        setSelectNucleoAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nucleoFiltroAtual = useMemo(() => {
    return nucleos.find((n) => n.id === filtroNucleoId) || null;
  }, [nucleos, filtroNucleoId]);

  const nucleosFiltradosBusca = useMemo(() => {
    if (!buscaNucleoTexto.trim()) return nucleos;
    const termo = buscaNucleoTexto.toLowerCase().trim();
    return nucleos.filter((n) => {
      const nome = (n.identificacao || "").toLowerCase();
      const local = (n.nomeLocal || "").toLowerCase();
      const cidade = (n.cidade || "").toLowerCase();
      const bairro = (n.bairro || "").toLowerCase();
      return nome.includes(termo) || local.includes(termo) || cidade.includes(termo) || bairro.includes(termo);
    });
  }, [nucleos, buscaNucleoTexto]);

  // Lista de atividades disponíveis apenas nos núcleos fornecidos (respeitando o filtro de sessão)
  const atividadesDisponiveis = useMemo(() => {
    const ativIdsPresentes = new Set<string>();
    nucleos.forEach((n) => {
      n.atividadeIds?.forEach((aid) => ativIdsPresentes.add(aid));
    });

    if (atividades.length > 0) {
      return atividades.filter((a) => ativIdsPresentes.has(a.id));
    }
    return [];
  }, [nucleos, atividades]);

  // Aplicar filtros internos de núcleo e atividade sobre a listagem da sessão
  const nucleosExibidos = useMemo(() => {
    return nucleos.filter((n) => {
      if (filtroNucleoId && n.id !== filtroNucleoId) {
        return false;
      }
      if (filtroAtividadeId && (!n.atividadeIds || !n.atividadeIds.includes(filtroAtividadeId))) {
        return false;
      }
      return true;
    });
  }, [nucleos, filtroNucleoId, filtroAtividadeId]);

  // Filtrar apenas núcleos com coordenadas válidas para pinar
  const nucleosComCoords = useMemo(() => {
    return nucleosExibidos.filter(
      (n) => typeof n.latitude === "number" && typeof n.longitude === "number" && !isNaN(n.latitude) && !isNaN(n.longitude)
    );
  }, [nucleosExibidos]);

  // Se o núcleo atualmente selecionado no card sair do filtro, fechar o card
  useEffect(() => {
    if (nucleoSelecionado && !nucleosComCoords.some((n) => n.id === nucleoSelecionado.id)) {
      setNucleoSelecionado(null);
    }
  }, [nucleosComCoords, nucleoSelecionado]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      if (!isMounted) return;

      if (!mapInstanceRef.current) {
        // Centro padrão: Palmas - TO (-10.249091, -48.324285)
        const defaultCenter: [number, number] = [-10.249091, -48.324285];
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          scrollWheelZoom: false,
        });

        // Habilitar zoom por scroll apenas após o usuário clicar no mapa
        map.on("click", () => {
          map.scrollWheelZoom.enable();
        });

        // Desabilitar zoom por scroll quando o mouse sai do mapa para não travar a rolagem da página
        map.getContainer().addEventListener("mouseleave", () => {
          map.scrollWheelZoom.disable();
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Limpar marcadores anteriores
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Adicionar novos marcadores
      const bounds: [number, number][] = [];

      nucleosComCoords.forEach((n) => {
        const { cor } = getCorOcupacao(n.taxaOcupacao);
        const iconHtml = criarIconePin(cor);

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-map-pin",
          iconSize: [28, 38],
          iconAnchor: [14, 38],
          popupAnchor: [0, -38],
        });

        const lat = n.latitude!;
        const lon = n.longitude!;
        bounds.push([lat, lon]);

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          setNucleoSelecionado(n);
        });

        markersRef.current.push(marker);
      });

      // Se filtrou um único núcleo, centralizar nele com zoom de rua aproximado
      if (bounds.length === 1) {
        map.flyTo(bounds[0], 17, { duration: 1.2 });
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [nucleosComCoords]);

  return (
    <div className={`relative -mx-4 -mt-6 lg:-mx-8 flex flex-col overflow-hidden border-b border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {/* Header com Título e Filtros */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            Mapa dos Núcleos
          </h3>
          <span className="ml-1 rounded-full bg-zinc-200/80 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
            {nucleosComCoords.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor Pesquisável de Núcleo com Campo de Busca em Texto */}
          <div ref={selectNucleoRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSelectNucleoAberto((prev) => !prev);
                setBuscaNucleoTexto("");
              }}
              className="flex h-8 items-center justify-between gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-800 shadow-2xs hover:bg-zinc-50 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 cursor-pointer min-w-[170px]"
            >
              <span className="truncate max-w-[140px]">
                {nucleoFiltroAtual ? nucleoFiltroAtual.identificacao : "Todos os núcleos"}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${selectNucleoAberto ? "rotate-180" : ""}`} />
            </button>

            {selectNucleoAberto && (
              <div className="absolute left-0 z-50 mt-1 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                {/* Campo de Busca em Texto */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    autoFocus
                    type="text"
                    value={buscaNucleoTexto}
                    onChange={(e) => setBuscaNucleoTexto(e.target.value)}
                    placeholder="Buscar por nome ou cidade..."
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-7 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  {buscaNucleoTexto && (
                    <button
                      type="button"
                      onClick={() => setBuscaNucleoTexto("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista de Opções Filtradas */}
                <div className="max-h-56 overflow-y-auto space-y-0.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroNucleoId("");
                      setSelectNucleoAberto(false);
                      setBuscaNucleoTexto("");
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                      !filtroNucleoId
                        ? "bg-sky-50 text-sky-700 font-bold dark:bg-sky-950/50 dark:text-sky-300"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>Todos os núcleos</span>
                    {!filtroNucleoId && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />}
                  </button>

                  {nucleosFiltradosBusca.length === 0 ? (
                    <div className="px-2.5 py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                      Nenhum núcleo encontrado.
                    </div>
                  ) : (
                    nucleosFiltradosBusca.map((n) => {
                      const isSelected = n.id === filtroNucleoId;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setFiltroNucleoId(n.id);
                            setSelectNucleoAberto(false);
                            setBuscaNucleoTexto("");
                          }}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-sky-50 text-sky-700 font-bold dark:bg-sky-950/50 dark:text-sky-300"
                              : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="truncate">{n.identificacao}</span>
                            {(n.cidade || n.bairro) && (
                              <span className="text-[10px] text-zinc-400 truncate">
                                {[n.bairro, n.cidade].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dropdown de Atividade */}
          <select
            value={filtroAtividadeId}
            onChange={(e) => setFiltroAtividadeId(e.target.value)}
            className="h-8 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <option value="">Todas as atividades</option>
            {atividadesDisponiveis.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>

          {(filtroNucleoId || filtroAtividadeId) && (
            <button
              type="button"
              onClick={() => {
                setFiltroNucleoId("");
                setFiltroAtividadeId("");
                setBuscaNucleoTexto("");
              }}
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Container do Mapa */}
      <div className="relative h-[440px] w-full bg-zinc-100 dark:bg-zinc-950">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Card Flutuante de Informações ao Clicar no Pin */}
        {nucleoSelecionado && (
          <div className="absolute top-4 left-4 z-1000 max-w-sm w-[90%] sm:w-80 rounded-xl bg-white p-4 shadow-xl border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setNucleoSelecionado(null)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer transition-colors"
              aria-label="Fechar card"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Título com Link */}
            <div className="pr-6">
              <Link
                href={`/nucleos/${nucleoSelecionado.id}`}
                className="text-sm font-bold text-zinc-900 hover:text-sky-600 dark:text-zinc-100 dark:hover:text-sky-400 transition-colors"
              >
                {nucleoSelecionado.identificacao}
              </Link>
              {nucleoSelecionado.nomeLocal && (
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {nucleoSelecionado.nomeLocal}
                </p>
              )}
            </div>

            {/* Gráfico de Ocupação */}
            <div className="my-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <div className="h-16 w-16 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Matriculados", value: nucleoSelecionado.totalMatriculados || 0 },
                        { name: "Vagas Livres", value: Math.max(0, nucleoSelecionado.vagasLivres || (nucleoSelecionado.totalVagas === 0 ? 1 : 0)) },
                      ]}
                      innerRadius={16}
                      outerRadius={28}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill={getCorOcupacao(nucleoSelecionado.taxaOcupacao).cor} />
                      <Cell fill="#e4e4e7" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-0.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-100">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getCorOcupacao(nucleoSelecionado.taxaOcupacao).cor }}
                  />
                  <span>{nucleoSelecionado.taxaOcupacao}% de ocupação</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <strong>{nucleoSelecionado.totalMatriculados}</strong> matriculados / <strong>{nucleoSelecionado.totalVagas}</strong> vagas
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  {nucleoSelecionado.vagasLivres} vagas disponíveis
                </p>
              </div>
            </div>

            {/* Endereço */}
            <div className="text-xs text-zinc-600 dark:text-zinc-300 italic flex flex-col gap-1.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
              <p>
                {[
                  nucleoSelecionado.endereco,
                  nucleoSelecionado.numero ? `nº ${nucleoSelecionado.numero}` : "SN",
                  nucleoSelecionado.bairro,
                  nucleoSelecionado.cidade,
                  nucleoSelecionado.estado,
                ]
                  .filter(Boolean)
                  .join(", ")}
                {nucleoSelecionado.cep ? ` - CEP: ${nucleoSelecionado.cep}` : ""}
              </p>
              {nucleoSelecionado.complemento && (
                <p className="font-normal not-italic text-zinc-500 dark:text-zinc-400">
                  <strong>Complemento:</strong> {nucleoSelecionado.complemento}
                </p>
              )}

              {/* Botão Google Maps */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [
                    nucleoSelecionado.endereco,
                    nucleoSelecionado.numero ? `nº ${nucleoSelecionado.numero}` : "SN",
                    nucleoSelecionado.bairro,
                    nucleoSelecionado.cidade,
                    nucleoSelecionado.estado,
                    nucleoSelecionado.cep ? `CEP ${nucleoSelecionado.cep}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1.5 text-xs font-medium not-italic text-zinc-700 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-sky-950/50 dark:hover:border-sky-800 dark:hover:text-sky-300 transition-all shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>Ver no Google Maps</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Legenda de Ocupação */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-zinc-200 bg-zinc-50/60 px-4 py-2.5 lg:px-8 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Legenda de ocupação:</span>

        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600 shadow-2xs" />
          <span>Menos de 50%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500 shadow-2xs" />
          <span>De 50% a 74,99%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-sky-600 shadow-2xs" />
          <span>De 75% a 99,99%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-600 shadow-2xs" />
          <span>100% ou mais</span>
        </div>
      </div>
    </div>
  );
}
