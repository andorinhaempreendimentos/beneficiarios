"use client";

import { useMemo } from "react";
import { Globe, MapPin, Filter, RotateCcw } from "lucide-react";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { nucleosApi, type Paginated, type NucleoApi } from "@/lib/api/services";

const ESTADOS_NOMES: Record<string, string> = {
  TO: "Tocantins (TO)",
  PE: "Pernambuco (PE)",
  SP: "São Paulo (SP)",
  RJ: "Rio de Janeiro (RJ)",
  DF: "Distrito Federal (DF)",
  BA: "Bahia (BA)",
  MG: "Minas Gerais (MG)",
};

export function TopLocationBar() {
  const { estado, cidade, setEstado, setCidade, limparFiltros } = useLocationFilter();
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);

  const nucleos = nucleosData?.data ?? [];

  // Mapear núcleos com estado e cidade
  const nucleosComUf = useMemo(() => {
    return nucleos.map((n) => {
      let estadoUf = (n as any).estado as string | undefined;
      if (!estadoUf) {
        if (n.cidade?.toLowerCase() === "palmas") estadoUf = "TO";
        else if (n.cidade?.toLowerCase() === "recife") estadoUf = "PE";
        else estadoUf = "TO";
      }
      return {
        ...n,
        estadoUf,
        cidadeNome: n.cidade || "Palmas",
      };
    });
  }, [nucleos]);

  // Lista única de Estados disponíveis
  const estadosDisponiveis = useMemo(() => {
    const ufs = Array.from(new Set(nucleosComUf.map((n) => n.estadoUf))).sort();
    return ufs;
  }, [nucleosComUf]);

  // Lista única de Cidades disponíveis para o estado selecionado
  const cidadesDisponiveis = useMemo(() => {
    if (estado === "Todos") {
      return Array.from(new Set(nucleosComUf.map((n) => n.cidadeNome))).sort();
    }
    return Array.from(
      new Set(
        nucleosComUf
          .filter((n) => n.estadoUf === estado)
          .map((n) => n.cidadeNome)
      )
    ).sort();
  }, [nucleosComUf, estado]);

  const temFiltroAtivo = estado !== "Todos" || cidade !== "Todas";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur-xs lg:px-8 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white shadow-2xs">
          <Globe className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-900 hidden sm:inline-block">
            Filtro da Sessão:
          </span>
          {temFiltroAtivo ? (
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-800">
              📍 {[cidade !== "Todas" ? cidade : null, estado !== "Todos" ? estado : null].filter(Boolean).join(" - ")}
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
              Visão Global (Todos os locais)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Seletor Estado */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-2xs">
          <MapPin className="h-3 w-3 text-sky-600 shrink-0" />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-hidden cursor-pointer"
          >
            <option value="Todos">Todos os Estados</option>
            {estadosDisponiveis.map((uf) => (
              <option key={uf} value={uf}>
                {ESTADOS_NOMES[uf] || `Estado (${uf})`}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor Cidade */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-2xs">
          <Filter className="h-3 w-3 text-sky-600 shrink-0" />
          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-hidden cursor-pointer"
          >
            <option value="Todas">Todas as Cidades</option>
            {cidadesDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Limpar Filtros */}
        {temFiltroAtivo && (
          <button
            type="button"
            onClick={limparFiltros}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors shadow-2xs cursor-pointer"
            title="Restaurar visão global"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>
    </header>
  );
}
