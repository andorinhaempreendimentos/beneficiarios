"use client";

import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { CheckCircle2, XCircle, Download, Link2, Check, Clock } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
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
import {
  inscricoesApi,
  nucleosApi,
  atividadesApi,
  turmasApi,
  organizacoesApi,
  objetosApi,
  type Paginated,
  type InscricaoApi,
  type NucleoApi,
  type AtividadeApi,
  type TurmaApi,
  type OrganizacaoApi,
  type ObjetoApi,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { statusInscricaoTone, statusInscricaoLabel } from "@/lib/status";
import type { StatusInscricao } from "@/lib/types";
import { ModalLinksInscricao } from "@/components/inscricoes/ModalLinksInscricao";
import { StatusInscricaoBadge } from "@/components/inscricoes/StatusInscricaoBadge";

import { useLocationFilter } from "@/components/providers/LocationFilterProvider";

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
  const { toast } = useToast();
  const { estado, cidade, organizacaoId, nucleoId } = useLocationFilter();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalLinksOpen, setModalLinksOpen] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [modalRecusar, setModalRecusar] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");

  async function aprovarEmLote(ids: string[]) {
    if (ids.length === 0) return;
    setProcessando(true);
    try {
      await Promise.all(ids.map((id) => inscricoesApi.aprovar(id)));
      toast.success(`${ids.length} inscrição(ões) aprovada(s) com sucesso!`);
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao aprovar inscrições: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

  async function moverParaFila(ids: string[]) {
    if (ids.length === 0) return;
    setProcessando(true);
    try {
      await Promise.all(ids.map((id) => inscricoesApi.updateStatus(id, "reservada")));
      toast.success(`${ids.length} inscrição(ões) movida(s) para fila de espera`);
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao mover para fila: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

  async function recusarEmLote() {
    if (selectedIds.length === 0) return;
    if (!motivoRecusa.trim()) {
      toast.error("Informe o motivo da recusa");
      return;
    }
    setProcessando(true);
    try {
      await Promise.all(selectedIds.map((id) => inscricoesApi.recusar(id, motivoRecusa)));
      toast.success(`${selectedIds.length} inscrição(ões) recusada(s) com sucesso`);
      setModalRecusar(false);
      setMotivoRecusa("");
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao recusar inscrições: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

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
  const { data: organizacoesData } = useQuery<Paginated<OrganizacaoApi>>(() => organizacoesApi.list({ limit: 200 }), []);
  const { data: objetosData } = useQuery<Paginated<ObjetoApi>>(() => objetosApi.list({ limit: 200 }), []);

  const [actionId, setActionId] = useState<string | null>(null);

  async function handleAcao(id: string, acao: "aprovada" | "cancelada") {
    setActionId(id);
    try {
      if (acao === "aprovada") await inscricoesApi.aprovar(id);
      else await inscricoesApi.cancelar(id);
      refetch();
    } finally { setActionId(null); }
  }

  const rawNucleos = nucleosData?.data ?? [];
  const rawAtividades = atividadesData?.data ?? [];
  const rawTurmas = turmasData?.data ?? [];

  const rawLista = (pageData?.data ?? []).slice().sort(
    (a, b) => STATUS_ORDER.indexOf(a.status as StatusInscricao) - STATUS_ORDER.indexOf(b.status as StatusInscricao),
  );

  const lista = useMemo(() => {
    return rawLista.filter((i: InscricaoApi) => {
      const turma = rawTurmas.find((t) => t.id === i.turmaId) ?? i.turma;
      const nucleo = rawNucleos.find((n) => n.id === (turma?.nucleoId || (i as any).nucleoId));

      let estadoUf = (nucleo as any)?.estado as string | undefined;
      const cidadeNome = nucleo?.cidade || "Não informada";

      if (!estadoUf) {
        if (cidadeNome.toLowerCase() === "palmas") estadoUf = "TO";
        else if (cidadeNome.toLowerCase() === "recife") estadoUf = "PE";
        else estadoUf = "Não informado";
      }

      const bateEstado = estado === "Todos" || estadoUf === estado;
      const bateCidade = cidade === "Todas" || cidadeNome === cidade;
      const bateOrg = organizacaoId === "Todas" || (nucleo?.organizacaoId === organizacaoId);
      const bateNucleo = nucleoId === "Todos" || ((i as any).nucleoId ?? nucleo?.id) === nucleoId;
      return bateEstado && bateCidade && bateOrg && bateNucleo;
    });
  }, [rawLista, estado, cidade, organizacaoId, nucleoId, rawTurmas, rawNucleos]);

  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

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
        organizacoes={organizacoesData?.data ?? []}
        objetos={objetosData?.data ?? []}
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
                    const nucleo = rawNucleos.find((n) => n.id === (turma?.nucleoId || (i as any).nucleoId));
                    const atividade = rawAtividades.find((a) => a.id === (turma?.atividadeId || (i as any).atividadeId));
                    const isSelected = selectedIds.includes(i.id);

                    const nucleoNome = turma?.nucleo?.identificacao || nucleo?.identificacao;
                    const atividadeNome = turma?.atividade?.nome || atividade?.nome;
                    const turmaNome = turma?.nome;

                    return (
                      <div
                        key={i.id}
                        className={`group relative overflow-hidden rounded-2xl border transition-all flex flex-col justify-between gap-3.5 p-4 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/30 ring-2 ring-sky-500/20 shadow-xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Checkbox Elegante no Canto Superior Esquerdo */}
                        <label
                          className={`absolute top-0 left-0 z-10 flex h-8 w-9 items-center justify-center rounded-br-xl border-r border-b transition-all cursor-pointer ${
                            isSelected
                              ? "bg-sky-600 border-sky-600 text-white shadow-2xs"
                              : "bg-zinc-100/90 border-zinc-200/80 text-zinc-400 group-hover:bg-zinc-200/80 group-hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(i.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        {/* Header: Tag Inscrição, Nome & Status */}
                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-800">
                                Inscrição
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {formatarData(i.criadoEm)}
                              </span>
                            </div>
                            <span className="font-bold text-zinc-900 text-sm block">
                              {i.beneficiario?.nomeCompleto ?? i.beneficiarioId}
                            </span>
                          </div>
                          <StatusInscricaoBadge inscricaoId={i.id} statusAtual={i.status} onStatusChange={() => refetch()} />
                        </div>

                        {/* Seção Vínculos da Inscrição: Núcleo, Atividade e Turma */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2 text-xs">
                          <div className="flex flex-col gap-1 rounded-lg bg-zinc-50/80 p-2 border border-zinc-100">
                            {nucleoNome && (
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                                  Núcleo
                                </span>
                                <span className="font-medium truncate text-zinc-800">{nucleoNome}</span>
                              </div>
                            )}
                            {atividadeNome && (
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                  Atividade
                                </span>
                                <span className="font-medium truncate text-zinc-800">{atividadeNome}</span>
                              </div>
                            )}
                            {turmaNome && (
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="shrink-0 rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700">
                                  Turma
                                </span>
                                <Link
                                  href={`/turmas/${i.turmaId}/inscricoes`}
                                  className="font-medium truncate text-zinc-800 hover:text-sky-600 hover:underline"
                                >
                                  {turmaNome}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        {i.status === "pendente" && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100/60">
                            <button
                              type="button"
                              onClick={() => handleAcao(i.id, "aprovada")}
                              disabled={actionId === i.id}
                              className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcao(i.id, "cancelada")}
                              disabled={actionId === i.id}
                              className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
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
          onClick={() => aprovarEmLote(selectedIds)}
          disabled={processando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Aprovar</span>
        </button>

        <button
          type="button"
          onClick={() => moverParaFila(selectedIds)}
          disabled={processando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Mover p/ Fila</span>
        </button>

        <button
          type="button"
          onClick={() => setModalRecusar(true)}
          disabled={processando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Recusar</span>
        </button>

        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} inscrição(ões)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>

      {/* Modal de Recusa em Lote */}
      {modalRecusar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Recusar {selectedIds.length} Inscrição(ões)
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Informe o motivo da recusa. Esta justificativa será registrada no histórico das inscrições.
            </p>
            <textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Motivo da recusa (obrigatório)..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setModalRecusar(false)}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={recusarEmLote}
                disabled={processando || !motivoRecusa.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processando ? "Recusando..." : "Confirmar Recusa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
