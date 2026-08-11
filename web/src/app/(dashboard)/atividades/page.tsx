"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Download, Trash2, Dumbbell, Building2, Users, Sun, Calendar, Check } from "lucide-react";
import {
  Badge,
  Card,
  FilterBar,
  Field,
  Input,
  Select,
  LinkButton,
  PageHeader,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  atividadesApi,
  turmasApi,
  nucleosApi,
  beneficiariosApi,
  type Paginated,
  type AtividadeApi,
  type TurmaApi,
  type NucleoApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const TURNO_LABEL: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
const PER_PAGE = 15;
const EMPTY = { busca: "", turno: "", disponivelPreInscricao: "" };

export default function AtividadesPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [atividadeParaExcluir, setAtividadeParaExcluir] = useState<AtividadeApi | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const { data: pageData, loading, refetch } = useQuery<Paginated<AtividadeApi>>(
    () => atividadesApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: turmasData } = useQuery<Paginated<TurmaApi>>(() => turmasApi.list({ limit: 500 }), []);
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 500 }), []);
  const { data: beneficiariosData } = useQuery<Paginated<BeneficiarioApi>>(() => beneficiariosApi.list({ limit: 1000 }), []);

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const turmas = turmasData?.data ?? [];
  const nucleos = nucleosData?.data ?? [];
  const beneficiarios = beneficiariosData?.data ?? [];

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const confirmarExclusao = async () => {
    if (!atividadeParaExcluir) return;
    setExcluindo(true);
    try {
      await atividadesApi.remove(atividadeParaExcluir.id);
      setAtividadeParaExcluir(null);
      setPagina(1);
      refetch();
    } catch (err: any) {
      alert("Erro ao excluir atividade: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setExcluindo(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((a) => a.id));
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
        title="Atividades"
        description="Modalidades esportivas, culturais e educacionais oferecidas no projeto"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/atividades/novo">Nova atividade</LinkButton>
          </div>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome da atividade" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Turno">
          <Select value={filtros.turno} onChange={(e) => setFiltros((f) => ({ ...f, turno: e.target.value }))}>
            <option value="">Todos</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </Select>
        </Field>
        <Field label="Pré-inscrição">
          <Select value={filtros.disponivelPreInscricao} onChange={(e) => setFiltros((f) => ({ ...f, disponivelPreInscricao: e.target.value }))}>
            <option value="">Todas</option>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhuma atividade encontrada.
                  </div>
                ) : (
                  resultado.map((a) => {
                    const isSelected = selectedIds.includes(a.id);

                    // 1. Turmas da Atividade
                    const turmasDaAtividade = turmas.filter((t) => t.atividadeId === a.id);
                    const turmaIds = new Set(turmasDaAtividade.map((t) => t.id));

                    // 2. Núcleos que possuem a Atividade
                    const nucleoIdsFromTurmas = new Set(turmasDaAtividade.map((t) => t.nucleoId).filter(Boolean));
                    const nucleosDaAtividade = nucleos.filter(
                      (n) => nucleoIdsFromTurmas.has(n.id) || (n.atividadeIds && n.atividadeIds.includes(a.id))
                    );

                    // 3. Beneficiários Matriculados na Atividade
                    const beneficiariosDaAtividade = beneficiarios.filter((b) =>
                      b.turmasInfo?.some((ti) => ti.turmaId && turmaIds.has(ti.turmaId))
                    );

                    return (
                      <div
                        key={a.id}
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
                            onChange={() => toggleSelectOne(a.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        {/* Header: Tag Atividade, Nome & Badge Pré-inscrição */}
                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">
                                Atividade
                              </span>
                            </div>
                            <Link href={`/atividades/${a.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {a.nome}
                            </Link>
                          </div>
                          <Badge tone={a.disponivelPreInscricao ? "green" : "zinc"}>
                            {a.disponivelPreInscricao ? "Pré-inscrição Ativa" : "Interna"}
                          </Badge>
                        </div>

                        {/* Turnos & Faixa Etária */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Sun className="h-3.5 w-3.5 text-amber-600" />
                              <span className="font-semibold text-zinc-700">Turnos:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {a.turnos.length > 0 ? (
                                a.turnos.map((t) => (
                                  <span key={t} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                                    {TURNO_LABEL[t] ?? t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-400">Todos</span>
                              )}
                            </div>
                          </div>

                          {(a.idadeMinima || a.idadeMaxima) && (
                            <div className="text-[11px] text-zinc-500">
                              Faixa etária: <strong>{a.idadeMinima ?? 6} a {a.idadeMaxima ?? 17} anos</strong>
                            </div>
                          )}
                        </div>

                        {/* Grade de Indicadores: Núcleos, Turmas e Beneficiários */}
                        <div className="grid grid-cols-3 gap-1.5 text-[11px] border-t border-zinc-100 pt-2.5">
                          <div className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1.5 text-violet-800 border border-violet-100 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                            <span>{nucleosDaAtividade.length} Núcleos</span>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1.5 text-sky-800 border border-sky-100 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                            <span>{turmasDaAtividade.length} Turmas</span>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800 border border-amber-100 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                            <span>{beneficiariosDaAtividade.length} Alunos</span>
                          </div>
                        </div>

                        {/* Botões de Ação: Editar e Excluir */}
                        <div className="flex items-center justify-end gap-2 border-t border-zinc-100/60 pt-2.5">
                          <Link
                            href={`/atividades/${a.id}/editar`}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors shadow-2xs"
                          >
                            Editar
                          </Link>

                          <button
                            type="button"
                            onClick={() => setAtividadeParaExcluir(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
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
                      <th className="px-5 py-3">Atividade</th>
                      <th className="px-5 py-3">Turnos</th>
                      <th className="px-5 py-3 text-center">Núcleos</th>
                      <th className="px-5 py-3 text-center">Turmas</th>
                      <th className="px-5 py-3 text-center">Beneficiários</th>
                      <th className="px-5 py-3">Pré-inscrição</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhuma atividade encontrada.</td></tr>
                    ) : resultado.map((a) => {
                      const isSelected = selectedIds.includes(a.id);
                      const turmasDaAtividade = turmas.filter((t) => t.atividadeId === a.id);
                      const turmaIds = new Set(turmasDaAtividade.map((t) => t.id));

                      const nucleoIdsFromTurmas = new Set(turmasDaAtividade.map((t) => t.nucleoId).filter(Boolean));
                      const nucleosDaAtividade = nucleos.filter(
                        (n) => nucleoIdsFromTurmas.has(n.id) || (n.atividadeIds && n.atividadeIds.includes(a.id))
                      );

                      const beneficiariosDaAtividade = beneficiarios.filter((b) =>
                        b.turmasInfo?.some((ti) => ti.turmaId && turmaIds.has(ti.turmaId))
                      );

                      return (
                        <tr key={a.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(a.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3 font-medium text-zinc-900">
                            <Link href={`/atividades/${a.id}`} className="hover:text-sky-600">{a.nome}</Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">
                            {a.turnos.map((t) => TURNO_LABEL[t] ?? t).join(", ") || "Todos"}
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-violet-700">{nucleosDaAtividade.length}</td>
                          <td className="px-5 py-3 text-center font-semibold text-sky-700">{turmasDaAtividade.length}</td>
                          <td className="px-5 py-3 text-center font-semibold text-amber-700">{beneficiariosDaAtividade.length}</td>
                          <td className="px-5 py-3">
                            <Badge tone={a.disponivelPreInscricao ? "green" : "zinc"}>
                              {a.disponivelPreInscricao ? "Ativa" : "Interna"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/atividades/${a.id}/editar`}
                                className="text-xs font-semibold text-sky-600 hover:underline"
                              >
                                Editar
                              </Link>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                onClick={() => setAtividadeParaExcluir(a)}
                                className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>

      {/* Modal de Confirmação de Exclusão de Atividade */}
      {atividadeParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Excluir Atividade</h3>
                <p className="text-xs text-zinc-500">Esta ação moverá a atividade para a lixeira.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600">
              Tem certeza que deseja excluir a atividade <strong>{atividadeParaExcluir.nome}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAtividadeParaExcluir(null)}
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
                {excluindo ? "Excluindo..." : "Confirmar Exclusão"}
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
          onClick={() => alert(`Exportando ${selectedIds.length} atividade(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
