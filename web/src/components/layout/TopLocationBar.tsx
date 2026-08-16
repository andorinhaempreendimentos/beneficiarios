"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { Globe, MapPin, Filter, Building, Compass, RotateCcw, Moon, Sun, Bell } from "lucide-react";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { nucleosApi, execucoesAulaApi, type Paginated, type NucleoApi } from "@/lib/api/services";
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
  const { user } = useAuth();
  const isAdmin = user && user.tipo !== 'funcionario' && !user.isProfessor;
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

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const rawNucleos = nucleosProp ?? nucleosData?.data ?? [];

  // Mapear núcleos com estado e cidade centralizados
  const nucleosMapeados = useMemo(() => {
    return rawNucleos.map(normalizarNucleoLocalizacao);
  }, [rawNucleos]);

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

  // Todas as Organizações (lista completa sem filtro geográfico) para validação de ID
  const todasOrganizacoes = useMemo(() => {
    const orgMap = new Map<string, string>();
    for (const n of nucleosMapeados) {
      if (n.organizacao) {
        orgMap.set(n.organizacao.id, n.organizacao.nome);
      }
    }
    return Array.from(orgMap.entries()).map(([id, nome]) => ({ id, nome }));
  }, [nucleosMapeados]);

  // Validar se organizacaoId ou nucleoId salvos no localStorage sao validos (contra a lista completa)
  useEffect(() => {
    if (organizacaoId !== "Todas" && todasOrganizacoes.length > 0) {
      const orgValida = todasOrganizacoes.some((o) => o.id === organizacaoId);
      if (!orgValida) {
        setOrganizacaoId("Todas");
      }
    }
  }, [organizacaoId, todasOrganizacoes, setOrganizacaoId]);

  useEffect(() => {
    if (nucleoId !== "Todos" && nucleosMapeados.length > 0) {
      const nucleoValido = nucleosMapeados.some((n) => n.id === nucleoId);
      if (!nucleoValido) {
        setNucleoId("Todos");
      }
    }
  }, [nucleoId, nucleosMapeados, setNucleoId]);

  const countFiltrosAtivos = [
    estado !== "Todos",
    cidade !== "Todas",
    organizacaoId !== "Todas",
    nucleoId !== "Todos",
  ].filter(Boolean).length;

  const temFiltroAtivo = countFiltrosAtivos > 0;

  // Pendências para admin/coordenador
  const { data: pendenciasCount } = useQuery<number>(
    () => (isAdmin ? execucoesAulaApi.countPendencias() : Promise.resolve(0)),
    [isAdmin]
  );

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
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Seletor Estado */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <MapPin className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer"
          >
            <option value="Todos" className="dark:bg-zinc-900">UF: Todos</option>
            {estadosDisponiveis.map((uf) => (
              <option key={uf} value={uf} className="dark:bg-zinc-900">
                {uf}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor Cidade */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <Filter className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer"
          >
            <option value="Todas" className="dark:bg-zinc-900">Cidade: Todas</option>
            {cidadesDisponiveis.map((c) => (
              <option key={c} value={c} className="dark:bg-zinc-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor Organização */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <Building className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={organizacaoId}
            onChange={(e) => setOrganizacaoId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer max-w-[180px] truncate"
            title="Filtrar por Organização"
          >
            <option value="Todas" className="dark:bg-zinc-900">Org: Todas ({organizacoesDisponiveis.length})</option>
            {organizacoesDisponiveis.map((org) => (
              <option key={org.id} value={org.id} title={org.nome} className="dark:bg-zinc-900">
                {org.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor Núcleo */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <Compass className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={nucleoId}
            onChange={(e) => setNucleoId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer max-w-[180px] truncate"
            title="Filtrar por Núcleo"
          >
            <option value="Todos" className="dark:bg-zinc-900">Núcleo: Todos ({nucleosDisponiveis.length})</option>
            {nucleosDisponiveis.map((n) => (
              <option key={n.id} value={n.id} title={n.identificacao} className="dark:bg-zinc-900">
                {n.identificacao}
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

        {/* Pendências */}
        {isAdmin && (pendenciasCount ?? 0) > 0 && (
          <Link
            href="/aulas?status=pendente_aprovacao"
            className="relative flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors shadow-2xs"
            title={`${pendenciasCount} pendência(s) de aprovação`}
          >
            <Bell className="h-3 w-3" />
            <span className="hidden sm:inline">Pendências</span>
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {pendenciasCount}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
