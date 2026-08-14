"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { UserCheck, UserX, Download, Trash2, Check, RefreshCw, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Badge,
  Card,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Select,
  FilterBar,
  StatCard,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { beneficiariosApi, nucleosApi, atividadesApi, turmasApi, type Paginated, type BeneficiarioApi, type NucleoApi, type AtividadeApi, type TurmaApi } from "@/lib/api/services";
import type { StatusBeneficiario } from "@/lib/types";
import {
  statusBeneficiarioTone,
  statusBeneficiarioLabel,
  normalizarStatusBeneficiario,
  STATUS_BENEFICIARIO_OPCOES,
  tipoMatriculaTone,
  tipoMatriculaLabel,
  normalizarTipoMatricula,
  TIPO_MATRICULA_OPCOES,
} from "@/lib/status";
import { calcularIdade } from "@/lib/utils";

import { StatusBeneficiarioBadge } from "@/components/beneficiarios/StatusBeneficiarioBadge";

import { useLocationFilter } from "@/components/providers/LocationFilterProvider";

const PER_PAGE = 15;
const EMPTY = { nome: "", matricula: "", cpf: "", status: "", atividadeId: "", tipoMatricula: "", nucleoId: "", idadeMin: "", idadeMax: "" };

export default function BeneficiariosPage() {
  const { toast } = useToast();
  const { estado, cidade, organizacaoId, nucleoId } = useLocationFilter();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [beneficiarioParaExcluir, setBeneficiarioParaExcluir] = useState<BeneficiarioApi | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [processando, setProcessando] = useState(false);
  const [modalStatus, setModalStatus] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusBeneficiario | "">("");
  const [modalTransferir, setModalTransferir] = useState(false);
  const [turmaDestinoId, setTurmaDestinoId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setAtivos(filtros);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros]);

  const { data: pageData, loading, refetch } = useQuery<Paginated<BeneficiarioApi>>(
    () => beneficiariosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: atividadesData } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 200 }), []);
  const { data: turmasData } = useQuery<Paginated<TurmaApi>>(() => turmasApi.list({ limit: 200 }), []);

  const nucleos = nucleosData?.data ?? [];
  const atividades = atividadesData?.data ?? [];
  const turmasDisponiveis = turmasData?.data ?? [];
  const rawResultado = pageData?.data ?? [];

  async function alterarStatusLote() {
    if (selectedIds.length === 0 || !novoStatus) return;
    setProcessando(true);
    try {
      await Promise.all(selectedIds.map((id) => beneficiariosApi.update(id, { status: novoStatus })));
      toast.success(`Status de ${selectedIds.length} beneficiário(s) alterado para "${novoStatus}"`);
      setModalStatus(false);
      setNovoStatus("");
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao alterar status: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

  async function transferirParaTurma() {
    if (selectedIds.length === 0 || !turmaDestinoId) return;
    setProcessando(true);
    try {
      await Promise.all(selectedIds.map((id) => turmasApi.matricular(turmaDestinoId, id)));
      toast.success(`${selectedIds.length} beneficiário(s) matricularam-se na nova turma com sucesso`);
      setModalTransferir(false);
      setTurmaDestinoId("");
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao transferir beneficiários: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

  const resultado = useMemo(() => {
    return rawResultado.filter((b) => {
      let estadoUf = b.estado;
      let cidadeNome = b.cidade || b.nucleoNome || b.turmasInfo?.[0]?.nucleoNome || "Não informada";

      const nucleoEncontrado = nucleos.find(
        (n) => n.id === b.nucleoId || n.identificacao === b.nucleoNome || n.identificacao === b.turmasInfo?.[0]?.nucleoNome
      );

      if (nucleoEncontrado) {
        cidadeNome = nucleoEncontrado.cidade || cidadeNome;
        if (!estadoUf) {
          if (cidadeNome.toLowerCase() === "palmas") estadoUf = "TO";
          else if (cidadeNome.toLowerCase() === "recife") estadoUf = "PE";
          else estadoUf = "Não informado";
        }
      } else if (!estadoUf) {
        estadoUf = "Não informado";
      }

      const bateEstado = estado === "Todos" || estadoUf === estado;
      const bateCidade = cidade === "Todas" || cidadeNome === cidade;
      const bateOrg = organizacaoId === "Todas" || (nucleoEncontrado?.organizacaoId === organizacaoId);
      const bateNucleo = nucleoId === "Todos" || (b.nucleoId ?? nucleoEncontrado?.id) === nucleoId;
      return bateEstado && bateCidade && bateOrg && bateNucleo;
    });
  }, [rawResultado, estado, cidade, organizacaoId, nucleoId, nucleos]);
  
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const confirmarExclusao = async () => {
    if (!beneficiarioParaExcluir) return;
    setExcluindo(true);
    try {
      await beneficiariosApi.remove(beneficiarioParaExcluir.id);
      setBeneficiarioParaExcluir(null);
      setPagina(1);
      setAtivos({ ...filtros });
    } catch (err: any) {
      alert("Erro ao excluir beneficiário: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setExcluindo(false);
    }
  };

  const atv = pageData?.data.filter((b) => normalizarStatusBeneficiario(b.status) === "ativo").length ?? 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = resultado.length > 0 && selectedIds.length === resultado.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Beneficiários"
        description="Listagem geral de todos os beneficiários do sistema"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/beneficiarios/novo">Novo Beneficiário</LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total na página (ativos)" value={atv} tone="green" icon={UserCheck} />
        <StatCard label="Total encontrado" value={total} tone="sky" icon={UserX} />
      </div>

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Nome">
          <Input placeholder="Buscar por nome" value={filtros.nome}
            onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))} />
        </Field>
        <Field label="Matrícula">
          <Input placeholder="0000-0000" value={filtros.matricula}
            onChange={(e) => setFiltros((f) => ({ ...f, matricula: e.target.value }))} />
        </Field>
        <Field label="CPF">
          <Input placeholder="000.000.000-00" value={filtros.cpf}
            onChange={(e) => setFiltros((f) => ({ ...f, cpf: e.target.value }))} />
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            {STATUS_BENEFICIARIO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Atividade">
          <Select value={filtros.atividadeId} onChange={(e) => setFiltros((f) => ({ ...f, atividadeId: e.target.value }))}>
            <option value="">Todas</option>
            {atividades.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </Select>
        </Field>
        <Field label="Tipo de matrícula">
          <Select value={filtros.tipoMatricula} onChange={(e) => setFiltros((f) => ({ ...f, tipoMatricula: e.target.value }))}>
            <option value="">Todos</option>
            {TIPO_MATRICULA_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <Field label="Idade mínima">
          <Input type="number" min={0} value={filtros.idadeMin}
            onChange={(e) => setFiltros((f) => ({ ...f, idadeMin: e.target.value }))} />
        </Field>
        <Field label="Idade máxima">
          <Input type="number" min={0} value={filtros.idadeMax}
            onChange={(e) => setFiltros((f) => ({ ...f, idadeMax: e.target.value }))} />
        </Field>
      </FilterBar>

      <Card>
        {loading && (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>
        )}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum beneficiário encontrado.
                  </div>
                ) : (
                  resultado.map((b) => {
                    const isSelected = selectedIds.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className={`group relative overflow-hidden rounded-2xl border transition-all flex flex-col justify-between gap-3 p-4 ${
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
                            onChange={() => toggleSelectOne(b.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-zinc-400 block">{b.matricula}</span>
                            <Link href={`/beneficiarios/${b.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {b.nomeCompleto}
                            </Link>
                          </div>
                          <StatusBeneficiarioBadge beneficiarioId={b.id} statusAtual={b.status} />
                        </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-2">
                        <span>Idade: <strong className="text-zinc-700">{calcularIdade(b.dataNascimento)} anos</strong></span>
                        <Badge tone={tipoMatriculaTone[normalizarTipoMatricula(b.tipoMatricula)]}>
                          {tipoMatriculaLabel[normalizarTipoMatricula(b.tipoMatricula)]}
                        </Badge>
                      </div>

                      {/* Vínculos: Núcleo, Atividade e Turma */}
                      <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2 text-xs">
                        {b.turmasInfo && b.turmasInfo.length > 0 ? (
                          b.turmasInfo.map((t, idx) => (
                            <div key={idx} className="flex flex-col gap-1 rounded-lg bg-zinc-50/80 p-2 border border-zinc-100">
                              {t.nucleoNome && (
                                <div className="flex items-center gap-1.5 text-zinc-600">
                                  <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                                    Núcleo
                                  </span>
                                  <span className="font-medium truncate text-zinc-800">{t.nucleoNome}</span>
                                </div>
                              )}
                              {t.atividadeNome && (
                                <div className="flex items-center gap-1.5 text-zinc-600">
                                  <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                    Atividade
                                  </span>
                                  <span className="font-medium truncate text-zinc-800">{t.atividadeNome}</span>
                                </div>
                              )}
                              {t.turmaNome && (
                                <div className="flex items-center gap-1.5 text-zinc-600">
                                  <span className="shrink-0 rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700">
                                    Turma
                                  </span>
                                  <span className="font-medium truncate text-zinc-800">{t.turmaNome}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : b.nucleoNome ? (
                          <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50/80 p-2 border border-zinc-100">
                            <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                              Núcleo
                            </span>
                            <span className="font-medium truncate text-zinc-800">{b.nucleoNome}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-zinc-400">Sem vínculo ativo</span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100/80 text-xs">
                        <Link href={`/beneficiarios/${b.id}/editar`} className="font-medium text-zinc-700 hover:text-sky-600 hover:underline">
                          Editar
                        </Link>
                        <span className="text-zinc-200">|</span>
                        <button
                          type="button"
                          onClick={() => setBeneficiarioParaExcluir(b)}
                          className="flex items-center gap-1 font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-3">Matrícula</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-5 py-3">Vínculos (Núcleo / Turma)</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum beneficiário encontrado.</td></tr>
                    ) : resultado.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${
                          selectedIds.includes(b.id) ? "bg-sky-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => toggleSelectOne(b.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3 text-zinc-500">{b.matricula}</td>
                        <td className="px-5 py-3">
                          <StatusBeneficiarioBadge beneficiarioId={b.id} statusAtual={b.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Link href={`/beneficiarios/${b.id}`} className="font-medium text-sky-600 hover:underline">{b.nomeCompleto}</Link>
                              <Badge tone={tipoMatriculaTone[normalizarTipoMatricula(b.tipoMatricula)]}>{tipoMatriculaLabel[normalizarTipoMatricula(b.tipoMatricula)]}</Badge>
                            </div>
                            <span className="text-xs text-zinc-400">{calcularIdade(b.dataNascimento)} anos</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {b.turmasInfo && b.turmasInfo.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {b.turmasInfo.map((t, idx) => (
                                <span key={idx} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                  {[t.nucleoNome, t.atividadeNome, t.turmaNome].filter(Boolean).join(" · ")}
                                </span>
                              ))}
                            </div>
                          ) : b.nucleoNome ? (
                            <span className="text-zinc-600">{b.nucleoNome}</span>
                          ) : (
                            <span className="text-zinc-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <Link href={`/beneficiarios/${b.id}/editar`} className="text-zinc-600 font-medium hover:underline">Editar</Link>
                            <span className="text-zinc-300">|</span>
                            <button
                              type="button"
                              onClick={() => setBeneficiarioParaExcluir(b)}
                              className="text-red-600 font-medium hover:underline cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      {beneficiarioParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Excluir Beneficiário</h3>
                <p className="text-xs text-zinc-500">Esta ação moverá o beneficiário para a lixeira.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600">
              Tem certeza que deseja excluir o beneficiário <strong>{beneficiarioParaExcluir.nomeCompleto}</strong> (Matrícula: {beneficiarioParaExcluir.matricula})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBeneficiarioParaExcluir(null)}
                disabled={excluindo}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {excluindo ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={resultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => setModalStatus(true)}
          disabled={processando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Alterar Status ({selectedIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setModalTransferir(true)}
          disabled={processando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>Transferir Turma ({selectedIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} beneficiário(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>

      {/* Modal de Alterar Status em Lote */}
      {modalStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Alterar Status de {selectedIds.length} Beneficiário(s)
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Selecione o novo status que será aplicado a todos os beneficiários selecionados.
            </p>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusBeneficiario)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="" className="dark:bg-zinc-900">Selecione o novo status...</option>
              <option value="pendente" className="dark:bg-zinc-900">Pendente</option>
              <option value="ativo" className="dark:bg-zinc-900">Ativo</option>
              <option value="inativo" className="dark:bg-zinc-900">Inativo</option>
            </select>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setModalStatus(false)}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={alterarStatusLote}
                disabled={!novoStatus || processando}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processando ? "Salvando..." : "Confirmar Alteração"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferir para Outra Turma */}
      {modalTransferir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Transferir {selectedIds.length} Beneficiário(s)
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Selecione a turma de destino para a qual os beneficiários serão matriculados.
            </p>
            <select
              value={turmaDestinoId}
              onChange={(e) => setTurmaDestinoId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="" className="dark:bg-zinc-900">Selecione a turma de destino...</option>
              {turmasDisponiveis.map((t) => (
                <option key={t.id} value={t.id} className="dark:bg-zinc-900">
                  {t.nome} {t.nucleo?.identificacao ? `(${t.nucleo.identificacao})` : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setModalTransferir(false)}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={transferirParaTurma}
                disabled={!turmaDestinoId || processando}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processando ? "Transferindo..." : "Confirmar Transferência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
