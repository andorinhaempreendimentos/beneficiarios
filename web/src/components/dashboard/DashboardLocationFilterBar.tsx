"use client";

import { useMemo, useEffect } from "react";
import { Globe, MapPin, Filter, Building, Compass, RotateCcw } from "lucide-react";
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
  const {
    estado,
    cidade,
    organizacaoId,
    nucleoId,
    setEstado,
    setCidade,
    setOrganizacaoId,
    setNucleoId,
    limparFiltros,
  } = useLocationFilter();

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

  // Organizações disponíveis para estado e cidade selecionados
  const organizacoesDisponiveis = useMemo(() => {
    const orgMap = new Map<string, string>();
    for (const n of nucleosMapeados) {
      if (estado !== "Todos" && n.estadoUf !== estado) continue;
      if (cidade !== "Todas" && n.cidadeNome !== cidade) continue;

      if (n.organizacao) {
        orgMap.set(n.organizacao.id, n.organizacao.nome);
      }
    }
    return Array.from(orgMap.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [nucleosMapeados, estado, cidade]);

  // Núcleos disponíveis para estado, cidade e organização selecionados
  const nucleosDisponiveis = useMemo(() => {
    return nucleosMapeados
      .filter((n) => {
        if (estado !== "Todos" && n.estadoUf !== estado) return false;
        if (cidade !== "Todas" && n.cidadeNome !== cidade) return false;
        if (organizacaoId !== "Todas" && n.organizacaoId !== organizacaoId) return false;
        return true;
      })
      .sort((a, b) => a.identificacao.localeCompare(b.identificacao, "pt-BR"));
  }, [nucleosMapeados, estado, cidade, organizacaoId]);

  // Validar se organizacaoId ou nucleoId salvos no localStorage sao validos
  useEffect(() => {
    if (organizacaoId !== "Todas" && organizacoesDisponiveis.length > 0) {
      const orgValida = organizacoesDisponiveis.some((o) => o.id === organizacaoId);
      if (!orgValida) {
        setOrganizacaoId("Todas");
      }
    }
  }, [organizacaoId, organizacoesDisponiveis, setOrganizacaoId]);

  useEffect(() => {
    if (nucleoId !== "Todos" && nucleosDisponiveis.length > 0) {
      const nucleoValido = nucleosDisponiveis.some((n) => n.id === nucleoId);
      if (!nucleoValido) {
        setNucleoId("Todos");
      }
    }
  }, [nucleoId, nucleosDisponiveis, setNucleoId]);

  const countFiltrosAtivos = [
    estado !== "Todos",
    cidade !== "Todas",
    organizacaoId !== "Todas",
    nucleoId !== "Todos",
  ].filter(Boolean).length;

  const temFiltroAtivo = countFiltrosAtivos > 0;

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 p-4 shadow-2xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>Filtro de Exibição Regional e Entidades</span>
              {temFiltroAtivo ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                  {countFiltrosAtivos} {countFiltrosAtivos === 1 ? "Filtro Ativo" : "Filtros Ativos"}
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Visão Global
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500">
              Filtre indicadores por Estado, Cidade, Organização ou Núcleo.
            </p>
          </div>
        </div>

        {/* Seletores Encadeados (Estado -> Cidade -> Organização -> Núcleo) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Seletor de Estado */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs">
            <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">UF: Todos</option>
              {estadosDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Cidade */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs">
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

          {/* Seletor de Organização */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs">
            <Building className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <select
              value={organizacaoId}
              onChange={(e) => setOrganizacaoId(e.target.value)}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer max-w-[180px] truncate"
            >
              <option value="Todas">Todas Organizações ({organizacoesDisponiveis.length})</option>
              {organizacoesDisponiveis.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Núcleo */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs">
            <Compass className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <select
              value={nucleoId}
              onChange={(e) => setNucleoId(e.target.value)}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer max-w-[180px] truncate"
            >
              <option value="Todos">Todos os Núcleos ({nucleosDisponiveis.length})</option>
              {nucleosDisponiveis.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.identificacao}
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
