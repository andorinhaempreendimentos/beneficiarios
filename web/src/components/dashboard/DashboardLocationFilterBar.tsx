"use client";

import { useMemo } from "react";
import { Globe, MapPin, Filter, RotateCcw } from "lucide-react";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";
import type { NucleoApi } from "@/lib/api/services";
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

interface DashboardLocationFilterBarProps {
  nucleos: NucleoApi[];
}

export function DashboardLocationFilterBar({ nucleos }: DashboardLocationFilterBarProps) {
  const { estado, cidade, setEstado, setCidade, limparFiltros } = useLocationFilter();

  // Mapear núcleos com estado e cidade centralizados
  const nucleosMapeados = useMemo(() => {
    return nucleos.map(normalizarNucleoLocalizacao);
  }, [nucleos]);

  // Lista única de Estados disponíveis
  const estadosDisponiveis = useMemo(() => {
    const ufs = Array.from(new Set(nucleosMapeados.map((n) => n.estadoUf))).sort();
    return ufs;
  }, [nucleosMapeados]);

  // Lista única de Cidades disponíveis para o estado selecionado
  const cidadesDisponiveis = useMemo(() => {
    if (estado === "Todos") {
      return Array.from(new Set(nucleosMapeados.map((n) => n.cidadeNome))).sort();
    }
    return Array.from(
      new Set(
        nucleosMapeados
          .filter((n) => n.estadoUf === estado)
          .map((n) => n.cidadeNome)
      )
    ).sort();
  }, [nucleosMapeados, estado]);

  const temFiltroAtivo = estado !== "Todos" || cidade !== "Todas";

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 p-4 shadow-2xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>Filtro de Exibição Regional</span>
              {temFiltroAtivo ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                  Filtro Ativo na Sessão
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Visão Global
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500">
              Defina qual Estado e Cidade terão seus dados refletidos nos indicadores do painel.
            </p>
          </div>
        </div>

        {/* Seletores de Estado e Cidade */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Seletor de Estado */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs">
            <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">Todos os Estados (UF)</option>
              {estadosDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {ESTADOS_NOMES[uf] || `Estado (${uf})`}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Cidade */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer"
            >
              <option value="Todas">Todas as Cidades</option>
              {cidadesDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Limpar Filtros */}
          {temFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors shadow-2xs cursor-pointer"
              title="Restaurar visão global"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
