"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Download, Trash2, Dumbbell, Building2, Users, Calendar, Clock, Check } from "lucide-react";
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
  turmasApi,
  nucleosApi,
  atividadesApi,
  beneficiariosApi,
  type Paginated,
  type TurmaApi,
  type NucleoApi,
  type AtividadeApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";

const PER_PAGE = 15;
const EMPTY = { busca: "", nucleoId: "", atividadeId: "", exclusiva: "" };

export default function TurmasPage() {
  const { estado, cidade } = useLocationFilter();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [turmaParaExcluir, setTurmaParaExcluir] = useState<TurmaApi | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setAtivos(filtros);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros]);

  const { data: pageData, loading, refetch } = useQuery<Paginated<TurmaApi>>(
    () => turmasApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: atividadesData } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 200 }), []);
  const { data: beneficiariosData } = useQuery<Paginated<BeneficiarioApi>>(() => beneficiariosApi.list({ limit: 1000 }), []);

  const nucleos = nucleosData?.data ?? [];
  const atividades = atividadesData?.data ?? [];
  const beneficiarios = beneficiariosData?.data ?? [];

  const rawResultado = pageData?.data ?? [];

  const resultado = useMemo(() => {
    return rawResultado.filter((t: TurmaApi) => {
      const nucleoEncontrado = nucleos.find((n) => n.id === t.nucleoId);
      let estadoUf = (nucleoEncontrado as any)?.estado as string | undefined;
      const cidadeNome = nucleoEncontrado?.cidade || "Palmas";

      if (!estadoUf) {
        if (cidadeNome.toLowerCase() === "palmas") estadoUf = "TO";
        else if (cidadeNome.toLowerCase() === "recife") estadoUf = "PE";
        else estadoUf = "TO";
      }

      const bateEstado = estado === "Todos" || estadoUf === estado;
      const bateCidade = cidade === "Todas" || cidadeNome === cidade;
      return bateEstado && bateCidade;
    });
  }, [rawResultado, estado, cidade, nucleos]);

  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const confirmarExclusao = async () => {
    if (!turmaParaExcluir) return;
    setExcluindo(true);
    try {
      await turmasApi.remove(turmaParaExcluir.id);
      setTurmaParaExcluir(null);
      setPagina(1);
      refetch();
    } catch (err: any) {
      alert("Erro ao excluir turma: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setExcluindo(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((t) => t.id));
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
        title="Turmas"
        description="Turmas vinculadas aos núcleos e atividades com gestão de vagas e matriculados"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/turmas/novo">Nova turma</LinkButton>
          </div>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome da turma" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <Field label="Atividade">
          <Select value={filtros.atividadeId} onChange={(e) => setFiltros((f) => ({ ...f, atividadeId: e.target.value }))}>
            <option value="">Todas</option>
            {atividades.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </Select>
        </Field>
        <Field label="Exclusiva">
          <Select value={filtros.exclusiva} onChange={(e) => setFiltros((f) => ({ ...f, exclusiva: e.target.value }))}>
            <option value="">Todas</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
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
                    Nenhuma turma encontrada.
                  </div>
                ) : (
                  resultado.map((t) => {
                    const nucleo = nucleos.find((n) => n.id === t.nucleoId);
                    const atividade = atividades.find((a) => a.id === t.atividadeId);
                    const isSelected = selectedIds.includes(t.id);

                    const matriculadosCount = beneficiarios.filter((b) =>
                      b.turmasInfo?.some((ti) => ti.turmaId === t.id)
                    ).length;

                    const vagasTotais = t.vagasTotais || 0;
                    const vagasOcupadasPct = vagasTotais > 0 ? Math.min(100, Math.round((matriculadosCount / vagasTotais) * 100)) : 0;

                    return (
                      <div
                        key={t.id}
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
                            onChange={() => toggleSelectOne(t.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        {/* Header: Tag Turma, Nome & Status Exclusivo */}
                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sky-800">
                                Turma
                              </span>
                              {t.exclusiva && (
                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                                  Exclusiva
                                </span>
                              )}
                            </div>
                            <Link href={`/turmas/${t.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {t.nome}
                            </Link>
                          </div>
                          <span className="shrink-0 whitespace-nowrap rounded-xl bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-extrabold text-sky-700 shadow-2xs">
                            {vagasTotais} vagas
                          </span>
                        </div>

                        {/* Vínculos de Núcleo & Atividade */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2 text-xs">
                          <div className="flex flex-col gap-1 rounded-lg bg-zinc-50/80 p-2 border border-zinc-100">
                            {nucleo?.identificacao && (
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                                  Núcleo
                                </span>
                                <span className="font-medium truncate text-zinc-800">{nucleo.identificacao}</span>
                              </div>
                            )}
                            {atividade?.nome && (
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                  Atividade
                                </span>
                                <span className="font-medium truncate text-zinc-800">{atividade.nome}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Indicadores de Ocupação & Faixa Etária */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2 text-xs">
                          <div className="flex items-center justify-between text-zinc-600">
                            <span className="flex items-center gap-1 font-semibold text-zinc-800">
                              <Users className="h-3.5 w-3.5 text-sky-600" />
                              <span>{matriculadosCount} de {vagasTotais} alunos</span>
                            </span>
                            <span className="font-bold text-sky-700">{vagasOcupadasPct}% ocupado</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${vagasOcupadasPct}%` }} />
                          </div>
                          <div className="mt-0.5 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>Faixa etária: <strong>{t.idadeMinima ?? 6} a {t.idadeMaxima ?? 17} anos</strong></span>
                            <span>{vagasTotais - matriculadosCount} vagas livres</span>
                          </div>
                        </div>

                        {/* Botões de Ação: Editar e Excluir */}
                        <div className="flex items-center justify-end gap-2 border-t border-zinc-100/60 pt-2.5">
                          <Link
                            href={`/turmas/${t.id}/editar`}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors shadow-2xs"
                          >
                            Editar
                          </Link>

                          <button
                            type="button"
                            onClick={() => setTurmaParaExcluir(t)}
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
                      <th className="px-5 py-3">Turma</th>
                      <th className="px-5 py-3">Núcleo</th>
                      <th className="px-5 py-3">Atividade</th>
                      <th className="px-5 py-3 text-center">Matriculados / Vagas</th>
                      <th className="px-5 py-3">Exclusiva</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhuma turma encontrada.</td></tr>
                    ) : resultado.map((t) => {
                      const nucleo = nucleos.find((n) => n.id === t.nucleoId);
                      const atividade = atividades.find((a) => a.id === t.atividadeId);
                      const isSelected = selectedIds.includes(t.id);

                      const matriculadosCount = beneficiarios.filter((b) =>
                        b.turmasInfo?.some((ti) => ti.turmaId === t.id)
                      ).length;

                      return (
                        <tr key={t.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(t.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3 font-medium text-zinc-900">
                            <Link href={`/turmas/${t.id}`} className="hover:text-sky-600">{t.nome}</Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{atividade?.nome ?? "—"}</td>
                          <td className="px-5 py-3 text-center font-semibold text-sky-700">
                            {matriculadosCount} / {t.vagasTotais || 0}
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={t.exclusiva ? "amber" : "zinc"}>{t.exclusiva ? "Sim" : "Não"}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/turmas/${t.id}/editar`}
                                className="text-xs font-semibold text-sky-600 hover:underline"
                              >
                                Editar
                              </Link>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                onClick={() => setTurmaParaExcluir(t)}
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

      {/* Modal de Confirmação de Exclusão de Turma */}
      {turmaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Excluir Turma</h3>
                <p className="text-xs text-zinc-500">Esta ação moverá a turma para a lixeira.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600">
              Tem certeza que deseja excluir a turma <strong>{turmaParaExcluir.nome}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTurmaParaExcluir(null)}
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
          onClick={() => alert(`Exportando ${selectedIds.length} turma(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
