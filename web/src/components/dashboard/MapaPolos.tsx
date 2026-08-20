"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
}

interface MapaPolosProps {
  nucleos: NucleoMapaData[];
  className?: string;
}

function getCorOcupacao(taxa: number): { cor: string; label: string; bgClass: string; borderClass: string } {
  if (taxa < 50) {
    return {
      cor: "#dc2626",
      label: "Menos de 50%",
      bgClass: "bg-red-600",
      borderClass: "border-red-600",
    };
  }
  if (taxa < 75) {
    return {
      cor: "#f59e0b",
      label: "De 50% a 74,99%",
      bgClass: "bg-amber-500",
      borderClass: "border-amber-500",
    };
  }
  if (taxa < 100) {
    return {
      cor: "#0284c7",
      label: "De 75% a 99,99%",
      bgClass: "bg-sky-600",
      borderClass: "border-sky-600",
    };
  }
  return {
    cor: "#16a34a",
    label: "100% ou mais",
    bgClass: "bg-green-600",
    borderClass: "border-green-600",
  };
}

function criarIconePin(cor: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="28" height="38" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="${cor}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
    </svg>
  `;
  return svg;
}

export function MapaPolos({ nucleos, className = "" }: MapaPolosProps) {
  const { t } = useDicionario();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [nucleoSelecionado, setNucleoSelecionado] = useState<NucleoMapaData | null>(null);

  // Filtrar apenas núcleos com coordenadas válidas
  const nucleosComCoords = nucleos.filter(
    (n) => typeof n.latitude === "number" && typeof n.longitude === "number" && !isNaN(n.latitude) && !isNaN(n.longitude)
  );

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      if (!isMounted) return;

      // Se já existir mapa, limpar marcadores
      if (mapInstanceRef.current) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
      } else {
        // Centro padrão: Palmas - TO (-10.249091, -48.324285)
        const defaultCenter: [number, number] = [-10.249091, -48.324285];
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Adicionar marcadores
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

      // Ajustar visualização do mapa para caber todos os pontos
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [nucleosComCoords]);

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-xs bg-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            {t("mapa_polos", "Mapa dos Polos", true)}
          </h3>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {nucleosComCoords.length} {t("local", "núcleo", true).toLowerCase()}(s) no mapa
        </span>
      </div>

      {/* Container do Mapa */}
      <div className="relative h-[420px] w-full bg-zinc-100 dark:bg-zinc-950">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Card Flutuante de Detalhes ao Clicar no Pin */}
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
            <div className="text-xs text-zinc-600 dark:text-zinc-300 italic flex flex-col gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
              <p>
                {[
                  nucleoSelecionado.endereco,
                  nucleoSelecionado.numero ? `nº ${nucleoSelecionado.numero}` : "SN",
                  nucleoSelecionado.bairro,
                  nucleoSelecionado.cidade || "Palmas",
                  nucleoSelecionado.estado || "TO",
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
            </div>
          </div>
        )}
      </div>

      {/* Legenda de Ocupação */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-zinc-200 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
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
