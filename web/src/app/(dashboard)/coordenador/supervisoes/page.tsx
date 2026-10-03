"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  FileText,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, PageHeader, Badge, LinkButton, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  supervisoesApi,
  type SupervisaoApi,
  type NucleoApi,
  type Paginated,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;

export default function CoordenadorSupervisoesPage() {
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
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

  const { data: pageData, loading: loadingSups } = useQuery<Paginated<SupervisaoApi>>(
    () =>
      nucleoIdsFiltrados.length > 0
        ? supervisoesApi.list({
            nucleoIds: nucleoIdsFiltrados,
            status: statusFiltro || undefined,
            page: pagina,
            limit: PER_PAGE,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: PER_PAGE }),
    [JSON.stringify(nucleoIdsFiltrados), statusFiltro, pagina],
  );

  const supervisoes = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (loadingNucleos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-400">Carregando supervisões…</div>
      </div>
    );
  }

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
            Supervisões dos Meus Núcleos
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Histórico e relatórios de acompanhamento in loco das atividades
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LinkButton href="/supervisoes/relatorio-mensal" variant="secondary">
            <FileText className="h-4 w-4 mr-1.5" /> Relatório Mensal
          </LinkButton>
          <LinkButton href="/supervisoes/nova" variant="primary">
            <Plus className="h-4 w-4 mr-1.5" /> Nova Supervisão
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
            <option value="finalizada">Finalizada</option>
            <option value="rascunho">Rascunho</option>
          </select>
        </div>

        <span className="text-xs text-zinc-400 self-center">
          {total} {total === 1 ? "registro encontrado" : "registros encontrados"}
        </span>
      </div>

      {/* Tabela de Supervisões */}
      <Card>
        {loadingSups ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Carregando supervisões…</div>
        ) : supervisoes.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-400">
            Nenhuma supervisão encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-4 py-3">Núcleo</th>
                  <th className="px-4 py-3 text-center">Horário</th>
                  <th className="px-4 py-3 text-center">Professor</th>
                  <th className="px-4 py-3 text-center">Presentes</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {supervisoes.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-zinc-900">
                      {formatarData(s.dataSupervisao)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-zinc-800">
                      {s.nucleo?.identificacao || "Núcleo"}
                      {s.nucleo?.regiao && (
                        <span className="text-zinc-400 font-normal ml-1">
                          ({s.nucleo.regiao})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-500 font-mono">
                      {s.horaEntrada ? `${s.horaEntrada}${s.horaSaida ? ` - ${s.horaSaida}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={s.professorPresente ? "text-emerald-700 font-medium" : "text-zinc-400"}>
                        {s.professorPresente ? "Presente" : "Ausente / —"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-zinc-900">
                        {s.beneficiariosPresentes ?? "—"}
                      </span>
                      {s.beneficiariosEsperados != null && (
                        <span className="text-zinc-400 text-[11px] ml-1">
                          / {s.beneficiariosEsperados}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge tone={s.status === "finalizada" ? "green" : "amber"} className="font-semibold">
                        {s.status === "finalizada" ? "Finalizada" : "Rascunho"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === "rascunho" && (
                          <Link
                            href={`/supervisoes/${s.id}/editar`}
                            className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            Editar
                          </Link>
                        )}
                        <Link
                          href={`/supervisoes/${s.id}`}
                          className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                        >
                          Ver <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
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
