"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, Download, Link2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { inscricoesApi, nucleosApi, atividadesApi, turmasApi, type Paginated, type InscricaoApi, type NucleoApi, type AtividadeApi, type TurmaApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { statusInscricaoTone, statusInscricaoLabel } from "@/lib/status";
import type { StatusInscricao } from "@/lib/types";
import { ModalLinksInscricao } from "@/components/inscricoes/ModalLinksInscricao";
import { StatusInscricaoBadge } from "@/components/inscricoes/StatusInscricaoBadge";

const PER_PAGE = 20;

const TONE = statusInscricaoTone;
const LABEL = statusInscricaoLabel;
const STATUS_ORDER: StatusInscricao[] = ["pendente", "reservada", "aprovada", "cancelada"];

type Filtro = StatusInscricao | "todas";
const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "reservada", label: "Fila de espera" },
  { value: "aprovada", label: "Aprovadas" },
  { value: "cancelada", label: "Canceladas" },
];

export default function InscricoesPage() {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalLinksOpen, setModalLinksOpen] = useState(false);

  const { data: pageData, loading, refetch } = useQuery<Paginated<InscricaoApi>>(
    () => inscricoesApi.list({ status: filtro !== "todas" ? filtro : undefined, page: pagina, limit: PER_PAGE }),
    [filtro, pagina],
  );
  const { data: pendData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "pendente", limit: 1 }), []);
  const { data: aprovData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "aprovada", limit: 1 }), []);
  const { data: filaData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "reservada", limit: 1 }), []);
  const { data: cancelData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "cancelada", limit: 1 }), []);

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ emFuncionamento: "true", limit: 200 }), []);
  const { data: atividadesData } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 200 }), []);
  const { data: turmasData } = useQuery<Paginated<TurmaApi>>(() => turmasApi.list({ limit: 200 }), []);

  const [actionId, setActionId] = useState<string | null>(null);

  async function handleAcao(id: string, acao: "aprovada" | "cancelada") {
    setActionId(id);
    try {
      if (acao === "aprovada") await inscricoesApi.aprovar(id);
      else await inscricoesApi.cancelar(id);
      refetch();
    } finally { setActionId(null); }
  }

  const lista = (pageData?.data ?? []).slice().sort(
    (a, b) => STATUS_ORDER.indexOf(a.status as StatusInscricao) - STATUS_ORDER.indexOf(b.status as StatusInscricao),
  );
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const rawNucleos = nucleosData?.data ?? [];
  const rawAtividades = atividadesData?.data ?? [];
  const rawTurmas = turmasData?.data ?? [];

  const atividades = rawAtividades.filter((a) => a.disponivelPreInscricao !== false);
  const atividadesPublicasIds = new Set(atividades.map((a) => a.id));

  const turmas = rawTurmas.filter((t) => t.atividadeId && atividadesPublicasIds.has(t.atividadeId));

  const nucleosComTurmasIds = new Set(turmas.map((t) => t.nucleoId).filter(Boolean));
  const nucleos = rawNucleos.filter((n) => n.emFuncionamento !== false && nucleosComTurmasIds.has(n.id));

  const counts: Partial<Record<StatusInscricao, number>> = {
    pendente: pendData?.total ?? 0,
    aprovada: aprovData?.total ?? 0,
    reservada: filaData?.total ?? 0,
    cancelada: cancelData?.total ?? 0,
  };

  const pendentes = counts.pendente ?? 0;

  const handleFiltro = useCallback((s: StatusInscricao) => {
    setFiltro((prev) => (prev === s ? "todas" : s));
    setPagina(1);
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === lista.length && lista.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(lista.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = lista.length > 0 && selectedIds.length === lista.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Inscrições"
        description="Gerencie inscrições recebidas e acesse os links de autocadastro público"
        actions={
          <Button
            onClick={() => setModalLinksOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs cursor-pointer"
          >
            <Link2 className="h-4 w-4" />
            <span>Links de Inscrição Pública</span>
          </Button>
        }
      />

      <ModalLinksInscricao
        open={modalLinksOpen}
        onClose={() => setModalLinksOpen(false)}
        nucleos={rawNucleos}
        atividades={atividades}
        turmas={turmas}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["pendente", "aprovada", "reservada", "cancelada"] as StatusInscricao[]).map((s) => (
          <button key={s} type="button" onClick={() => handleFiltro(s)}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              filtro === s ? "border-sky-200 bg-sky-50 ring-1 ring-sky-300" : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <p className="text-2xl font-bold tabular-nums text-zinc-900">{counts[s]}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{LABEL[s]}</p>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Inscrições recebidas</h3>
            {pendentes > 0 && <p className="mt-0.5 text-xs text-amber-600">{pendentes} aguardando análise</p>}
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <div className="flex items-center gap-1 overflow-x-auto">
              {FILTROS.map((f) => (
                <button key={f.value} type="button" onClick={() => { setFiltro(f.value); setPagina(1); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtro === f.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lista.length === 0 ? (
                  <div className="col-span-full px-5 py-10 text-center text-sm text-zinc-400">Nenhuma inscrição encontrada</div>
                ) : (
                  lista.map((i) => {
                    const turma = turmas.find((t) => t.id === i.turmaId) ?? i.turma;
                    const isSelected = selectedIds.includes(i.id);
                    return (
                      <div
                        key={i.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/30 ring-1 ring-sky-500"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(i.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-medium text-zinc-900 text-sm block">
                                {i.beneficiario?.nomeCompleto ?? i.beneficiarioId}
                              </span>
                              <span className="text-xs text-zinc-400 block">{formatarData(i.criadoEm)}</span>
                            </div>
                          </div>
                          <StatusInscricaoBadge inscricaoId={i.id} statusAtual={i.status} onStatusChange={() => refetch()} />
                        </div>

                        <div className="text-xs text-zinc-600 border-t border-zinc-100 pt-2.5">
                          <span>Turma: </span>
                          <Link href={`/turmas/${i.turmaId}/inscricoes`} className="font-semibold text-zinc-800 hover:text-sky-600 hover:underline">
                            {turma?.nome ?? "—"}
                          </Link>
                        </div>

                        {i.status === "pendente" && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100/60">
                            <button
                              type="button"
                              onClick={() => handleAcao(i.id, "aprovada")}
                              disabled={actionId === i.id}
                              className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors disabled:opacity-40"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcao(i.id, "cancelada")}
                              disabled={actionId === i.id}
                              className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors disabled:opacity-40"
                            >
                              Recusar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wide text-zinc-400 bg-zinc-50/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-3">Beneficiário</th>
                      <th className="px-5 py-3">Turma</th>
                      <th className="px-5 py-3">Data</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((i) => {
                      const turma = turmas.find((t) => t.id === i.turmaId) ?? i.turma;
                      const isSelected = selectedIds.includes(i.id);
                      return (
                        <tr key={i.id} className={`border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(i.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-medium text-zinc-900">
                              {i.beneficiario?.nomeCompleto ?? i.beneficiarioId}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <Link href={`/turmas/${i.turmaId}/inscricoes`} className="text-zinc-600 hover:text-sky-600 hover:underline transition-colors">
                              {turma?.nome ?? "—"}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-500">{formatarData(i.criadoEm)}</td>
                          <td className="px-5 py-3">
                            <StatusInscricaoBadge inscricaoId={i.id} statusAtual={i.status} onStatusChange={() => refetch()} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            {i.status === "pendente" && (
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" title="Aprovar" onClick={() => handleAcao(i.id, "aprovada")}
                                  disabled={actionId === i.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-40">
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button type="button" title="Recusar" onClick={() => handleAcao(i.id, "cancelada")}
                                  disabled={actionId === i.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40">
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {lista.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">Nenhuma inscrição encontrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={lista.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} inscrição(ões)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
