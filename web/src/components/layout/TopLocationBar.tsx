"use client";

import { useMemo } from "react";
import { Globe, MapPin, Filter, RotateCcw, Moon, Sun } from "lucide-react";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { nucleosApi, type Paginated, type NucleoApi } from "@/lib/api/services";
import { normalizarNucleoLocalizacao } from "@/lib/location";

const ESTADOS_NOMES: Record<string, string> = {
  TO: "Tocantins (TO)",
  PE: "Pernambuco (PE)",
  SP: "São Paulo (SP)",
  RJ: "Rio de Janeiro (RJ)",
  DF: "Distrito Federal (DF)",
  BA: "Bahia (BA)",
  MG: "Minas Gerais (MG)",
};

interface TopLocationBarProps {
  nucleos?: NucleoApi[];
}

export function TopLocationBar({ nucleos: nucleosProp }: TopLocationBarProps = {}) {
  const { modoEscuro, alternarModoEscuro } = useTheme();
  const { estado, cidade, setEstado, setCidade, limparFiltros } = useLocationFilter();
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);

  const nucleos = nucleosProp ?? nucleosData?.data ?? [];

  // Mapear núcleos com estado e cidade centralizados
  const nucleosComUf = useMemo(() => {
    return nucleos.map(normalizarNucleoLocalizacao);
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-2.5 backdrop-blur-xs lg:px-8 shadow-2xs transition-colors">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white shadow-2xs">
          <Globe className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hidden sm:inline-block">
            Filtro da Sessão:
          </span>
          {temFiltroAtivo ? (
            <span className="rounded-full bg-sky-100 dark:bg-sky-950/80 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-800 dark:text-sky-300">
              📍 {[cidade !== "Todas" ? cidade : null, estado !== "Todos" ? estado : null].filter(Boolean).join(" - ")}
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Visão Global (Todos os locais)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Seletor Estado */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <MapPin className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer"
          >
            <option value="Todos" className="dark:bg-zinc-900">Todos os Estados</option>
            {estadosDisponiveis.map((uf) => (
              <option key={uf} value={uf} className="dark:bg-zinc-900">
                {ESTADOS_NOMES[uf] || `Estado (${uf})`}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor Cidade */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <Filter className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer"
          >
            <option value="Todas" className="dark:bg-zinc-900">Todas as Cidades</option>
            {cidadesDisponiveis.map((c) => (
              <option key={c} value={c} className="dark:bg-zinc-900">
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
            className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
            title="Restaurar visão global"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}

        {/* Chaveador de Modo Escuro / Claro */}
        <button
          type="button"
          onClick={alternarModoEscuro}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-amber-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shadow-2xs cursor-pointer ml-1"
          title={modoEscuro ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
          aria-label="Alternar modo de cor"
        >
          {modoEscuro ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600" />}
        </button>
      </div>
    </header>
  );
}
