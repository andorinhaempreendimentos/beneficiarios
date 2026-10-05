"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  Building2,
  Users,
  Clock,
  Calendar,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { Card, PageHeader, Badge, LinkButton, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  turmasApi,
  type TurmaApi,
  type NucleoApi,
  type Paginated,
} from "@/lib/api/services";

const PER_PAGE = 15;

export default function CoordenadorTurmasPage() {
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");
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

  const { data: pageData, loading: loadingTurmas } = useQuery<Paginated<TurmaApi>>(
    () =>
      nucleoIdsFiltrados.length > 0
        ? turmasApi.list({
            nucleoIds: nucleoIdsFiltrados,
            busca: busca.trim() || undefined,
            page: pagina,
            limit: PER_PAGE,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: PER_PAGE }),
    [JSON.stringify(nucleoIdsFiltrados), busca, pagina],
  );

  const turmas = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (loadingNucleos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-400">Carregando turmas dos núcleos…</div>
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
            Turmas dos Meus Núcleos
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Acompanhamento das turmas esportivas, horários e professores responsáveis
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap flex-1">
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

          <input
            type="text"
            placeholder="Buscar por nome da turma..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 flex-1 max-w-xs"
          />
        </div>

        <span className="text-xs text-zinc-400 self-center">
          {total} {total === 1 ? "turma encontrada" : "turmas encontradas"}
        </span>
      </div>

      {/* Tabela de Turmas */}
      <Card>
        {loadingTurmas ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Carregando turmas…</div>
        ) : turmas.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-400">
            Nenhuma turma encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Turma</th>
                  <th className="px-4 py-3">Núcleo</th>
                  <th className="px-4 py-3">Professor Responsável</th>
                  <th className="px-4 py-3 text-center">Idade</th>
                  <th className="px-4 py-3 text-center">Alunos / Capacidade</th>
                  <th className="px-4 py-3">Dias / Horários</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {turmas.map((t) => {
                  const profNome =
                    (t as any).turma_responsaveis?.[0]?.funcionarios?.nome_completo ||
                    (t as any).turma_responsaveis?.[0]?.nome ||
                    "—";

                  const horarios = (t as any).turma_horarios ?? [];
                  const horariosFormatados = horarios.length > 0
                    ? horarios.map((h: any) => `${h.dia_semana || h.dia}: ${h.hora_inicio || h.inicio}`).slice(0, 2).join(", ")
                    : "—";

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-zinc-900">
                        <Link href={`/turmas/${t.id}`} className="hover:text-sky-600 transition-colors">
                          {t.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-700">
                        {t.nucleo?.identificacao || "Núcleo"}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-800">
                        {profNome}
                      </td>
                      <td className="px-4 py-3.5 text-center text-zinc-600">
                        {t.idadeMinima != null && t.idadeMaxima != null ? `${t.idadeMinima} a ${t.idadeMaxima} anos` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-zinc-900">
                          {t.vagasOcupadas ?? 0}
                        </span>
                        {t.vagasTotais != null && (
                          <span className="text-zinc-400 text-[11px] ml-1">
                            / {t.vagasTotais}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 font-mono text-[11px]">
                        {horariosFormatados}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/turmas/${t.id}/presenca`}
                            className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          >
                            <ClipboardList className="h-3 w-3" /> Frequência
                          </Link>
                          <Link
                            href={`/turmas/${t.id}`}
                            className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                          >
                            Ver detalhes <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
