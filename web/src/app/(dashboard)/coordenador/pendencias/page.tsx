"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Plus,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, PageHeader, Badge, LinkButton, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  pendenciasGeraisApi,
  type PendenciaGeralApi,
  type NucleoApi,
  type Paginated,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;

const gravidadeTone: Record<string, "zinc" | "amber" | "red"> = {
  baixa: "zinc",
  media: "amber",
  alta: "amber",
  critica: "red",
};

const statusTone: Record<string, "red" | "sky" | "green" | "zinc"> = {
  aberta: "red",
  em_andamento: "sky",
  resolvida: "green",
  cancelada: "zinc",
};

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

export default function CoordenadorPendenciasPage() {
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("aberta");
  const [gravidadeFiltro, setGravidadeFiltro] = useState<string>("");
  const [pagina, setPagina] = useState(1);

  // Núcleos atribuídos ao coordenador
  const { data: meusNucleos, loading: loadingNucleos } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  const todosNucleoIds = useMemo(() => {
    return (meusNucleos ?? []).map((n) => n.id);
  }, [meusNucleos]);

  const nucleoIdsFiltrados = useMemo(() => {
    if (!meusNucleos || meusNucleos.length === 0) return [];
    if (nucleoSelecionadoId === "todos") return todosNucleoIds;
    return [nucleoSelecionadoId];
  }, [meusNucleos, nucleoSelecionadoId, todosNucleoIds]);

  const nucleoAtivoUnico = useMemo(() => {
    if (nucleoSelecionadoId === "todos") return null;
    return (meusNucleos ?? []).find((n) => n.id === nucleoSelecionadoId) ?? null;
  }, [meusNucleos, nucleoSelecionadoId]);

  const { data: pageData, loading: loadingPends } = useQuery<Paginated<PendenciaGeralApi>>(
    () =>
      nucleoIdsFiltrados.length > 0
        ? pendenciasGeraisApi.list({
            nucleoIds: nucleoIdsFiltrados,
            status: statusFiltro || undefined,
            gravidade: gravidadeFiltro || undefined,
            page: pagina,
            limit: PER_PAGE,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: PER_PAGE }),
    [JSON.stringify(nucleoIdsFiltrados), statusFiltro, gravidadeFiltro, pagina],
  );

  const pendencias = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (loadingNucleos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-400">Carregando pendências…</div>
      </div>
    );
  }

  const linkNovaPendencia = nucleoAtivoUnico
    ? `/pendencias-gerais/nova?nucleoId=${nucleoAtivoUnico.id}`
    : `/pendencias-gerais/nova`;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/coordenador"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Painel do Coordenador
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Pendências dos Meus Núcleos
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Acompanhamento e resolução de providências técnicas e materiais nos núcleos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LinkButton href={linkNovaPendencia} variant="primary">
            <Plus className="h-4 w-4 mr-1.5" /> Nova Pendência
          </LinkButton>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {meusNucleos && meusNucleos.length > 1 && (
            <select
              value={nucleoSelecionadoId}
              onChange={(e) => {
                setNucleoSelecionadoId(e.target.value);
                setPagina(1);
              }}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos os núcleos ({meusNucleos.length})</option>
              {meusNucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  📍 {n.identificacao}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value);
              setPagina(1);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todos os status</option>
            <option value="aberta">Abertas</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvida">Resolvidas</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <select
            value={gravidadeFiltro}
            onChange={(e) => {
              setGravidadeFiltro(e.target.value);
              setPagina(1);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todas as gravidades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        <span className="text-xs text-zinc-400 self-center">
          {total} {total === 1 ? "registro" : "registros"}
        </span>
      </div>

      {/* Tabela de Pendências */}
      <Card>
        {loadingPends ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Carregando pendências…</div>
        ) : pendencias.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-400">
            Nenhuma pendência encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Título / Descrição</th>
                  <th className="px-4 py-3">Núcleo</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Gravidade</th>
                  <th className="px-4 py-3 text-center">Prazo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pendencias.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 max-w-sm">
                      <Link
                        href={`/pendencias-gerais/${p.id}`}
                        className="font-semibold text-zinc-900 hover:text-sky-600 transition-colors block"
                      >
                        {p.titulo}
                      </Link>
                      {p.descricao && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-xs">
                          {p.descricao}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-zinc-700">
                      {p.nucleo?.identificacao || "Núcleo"}
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-500 capitalize">
                      {p.tipo}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge tone={gravidadeTone[p.gravidade] ?? "zinc"} className="font-semibold uppercase text-[10px]">
                        {p.gravidade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-500 font-mono">
                      {p.prazo ? formatarData(p.prazo) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge tone={statusTone[p.status] ?? "zinc"} className="font-semibold">
                        {statusLabel[p.status] ?? p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/pendencias-gerais/${p.id}`}
                        className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                      >
                        Ver detalhes <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100">
            <Pagination
              currentPage={pagina}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={PER_PAGE}
              onPageChange={setPagina}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
