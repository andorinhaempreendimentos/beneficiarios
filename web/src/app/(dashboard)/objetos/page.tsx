"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Download, Trash2, Building2, Building, Dumbbell, Users, GraduationCap, Check } from "lucide-react";
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
  objetosApi,
  organizacoesApi,
  nucleosApi,
  atividadesApi,
  turmasApi,
  beneficiariosApi,
  type Paginated,
  type ObjetoApi,
  type OrganizacaoApi,
  type NucleoApi,
  type AtividadeApi,
  type TurmaApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import { statusObjetoLabel, statusObjetoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import { StatusObjetoBadge } from "@/components/objetos/StatusObjetoBadge";

const PER_PAGE = 15;
const EMPTY = { busca: "", status: "", tipoDuracao: "" };

export default function ObjetosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [objetoParaExcluir, setObjetoParaExcluir] = useState<ObjetoApi | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const { data: pageData, loading, refetch } = useQuery<Paginated<ObjetoApi>>(
    () => objetosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const { data: organizacoesData } = useQuery<Paginated<OrganizacaoApi>>(() => organizacoesApi.list({ limit: 500 }), []);
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 500 }), []);
  const { data: turmasData } = useQuery<Paginated<TurmaApi>>(() => turmasApi.list({ limit: 500 }), []);
  const { data: beneficiariosData } = useQuery<Paginated<BeneficiarioApi>>(() => beneficiariosApi.list({ limit: 100 }), []);

  const organizacoes = organizacoesData?.data ?? [];
  const nucleos = nucleosData?.data ?? [];
  const turmas = turmasData?.data ?? [];
  const beneficiarios = beneficiariosData?.data ?? [];

  const rawResultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const confirmarExclusao = async () => {
    if (!objetoParaExcluir) return;
    setExcluindo(true);
    try {
      await objetosApi.remove(objetoParaExcluir.id);
      setObjetoParaExcluir(null);
      setPagina(1);
      refetch();
    } catch (err: any) {
      alert("Erro ao excluir objeto: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setExcluindo(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === rawResultado.length && rawResultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rawResultado.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = rawResultado.length > 0 && selectedIds.length === rawResultado.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Objetos"
        description="Projetos e eventos cadastrados com acompanhamento de entidades, núcleos e turmas"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/objetos/novo">Novo objeto</LinkButton>
          </div>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome ou termo de fomento" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="planejado">Planejado</option>
            <option value="encerrado">Encerrado</option>
          </Select>
        </Field>
        <Field label="Tipo">
          <Select value={filtros.tipoDuracao} onChange={(e) => setFiltros((f) => ({ ...f, tipoDuracao: e.target.value }))}>
            <option value="">Todos</option>
            <option value="pontual">Evento Pontual</option>
            <option value="periodo">Período</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rawResultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum objeto encontrado.
                  </div>
                ) : (
                  rawResultado.map((o) => {
                    const isSelected = selectedIds.includes(o.id);

                    // 1. Organizações do Objeto
                    const orgsDoObjeto = organizacoes.filter((org) => org.objetoId === o.id);
                    const orgIds = new Set(orgsDoObjeto.map((org) => org.id));

                    // 2. Núcleos do Objeto
                    const nucleosDoObjeto = nucleos.filter(
                      (n) => (n.organizacaoId && orgIds.has(n.organizacaoId)) || (n as any).objetoId === o.id
                    );
                    const nucleoIds = new Set(nucleosDoObjeto.map((n) => n.id));

                    // 3. Turmas do Objeto
                    const turmasDoObjeto = turmas.filter((t) => nucleoIds.has(t.nucleoId));
                    const turmaIds = new Set(turmasDoObjeto.map((t) => t.id));

                    // 4. Atividades do Objeto
                    const atividadesIds = new Set(turmasDoObjeto.map((t) => t.atividadeId).filter(Boolean));

                    // 5. Beneficiários do Objeto
                    const beneficiariosDoObjeto = beneficiarios.filter(
                      (b) =>
                        b.turmasInfo?.some((ti) => ti.turmaId && turmaIds.has(ti.turmaId)) ||
                        (b.nucleoId && nucleoIds.has(b.nucleoId))
                    );

                    return (
                      <div
                        key={o.id}
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
                            onChange={() => toggleSelectOne(o.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        {/* Header: Tag Objeto, Nome, Status & Tipo */}
                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-800">
                                Objeto
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {o.tipoDuracao === "pontual" ? "Evento Pontual" : "Período"}
                              </span>
                            </div>
                            <Link href={`/objetos/${o.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {o.nome}
                            </Link>
                          </div>
                          <StatusObjetoBadge objetoId={o.id} statusAtual={o.status} />
                        </div>

                        {/* Período & Termo */}
                        <div className="text-xs text-zinc-600 border-t border-zinc-100 pt-2 flex flex-col gap-1">
                          <div>
                            Período: <strong className="text-zinc-800">
                              {o.tipoDuracao === "pontual"
                                ? formatarData(o.dataEvento ?? "")
                                : `${formatarData(o.dataInicio ?? "")} — ${formatarData(o.dataTermino ?? "")}`}
                            </strong>
                          </div>
                          {o.termoDeFomento && (
                            <div className="text-[11px] text-zinc-500 truncate">
                              Termo: <span className="font-medium text-zinc-700">{o.termoDeFomento}</span>
                            </div>
                          )}
                        </div>

                        {/* Relações & Estatísticas do Objeto */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2.5 text-xs">
                          {/* Organização parceira vinculada */}
                          <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                            <span className="shrink-0 rounded-md bg-zinc-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1">
                              <Building className="h-3 w-3 text-zinc-600" />
                              Organizações
                            </span>
                            <span className="font-medium truncate text-zinc-800">
                              {orgsDoObjeto.length > 0
                                ? orgsDoObjeto.map((org) => org.nome).join(", ")
                                : "Nenhuma organização vinculada"}
                            </span>
                          </div>

                          {/* Grade de Indicadores: Núcleos, Atividades, Turmas e Beneficiários */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <div className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1.5 text-violet-800 border border-violet-100 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                              <span>{nucleosDoObjeto.length} Núcleos</span>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 text-emerald-800 border border-emerald-100 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              <span>{atividadesIds.size} Atividades</span>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1.5 text-sky-800 border border-sky-100 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                              <span>{turmasDoObjeto.length} Turmas</span>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800 border border-amber-100 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                              <span>{beneficiariosDoObjeto.length} Beneficiários</span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação: Editar e Excluir */}
                        <div className="flex items-center justify-end gap-2 border-t border-zinc-100/60 pt-2.5">
                          <Link
                            href={`/objetos/${o.id}/editar`}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors shadow-2xs"
                          >
                            Editar
                          </Link>

                          <button
                            type="button"
                            onClick={() => setObjetoParaExcluir(o)}
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
                      <th className="px-5 py-3">Nome do Objeto</th>
                      <th className="px-5 py-3">Organizações</th>
                      <th className="px-5 py-3 text-center">Núcleos</th>
                      <th className="px-5 py-3 text-center">Turmas</th>
                      <th className="px-5 py-3 text-center">Beneficiários</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawResultado.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum objeto encontrado.</td></tr>
                    ) : rawResultado.map((o) => {
                      const isSelected = selectedIds.includes(o.id);
                      const orgsDoObjeto = organizacoes.filter((org) => org.objetoId === o.id);
                      const orgIds = new Set(orgsDoObjeto.map((org) => org.id));

                      const nucleosDoObjeto = nucleos.filter(
                        (n) => (n.organizacaoId && orgIds.has(n.organizacaoId)) || (n as any).objetoId === o.id
                      );
                      const nucleoIds = new Set(nucleosDoObjeto.map((n) => n.id));
                      const turmasDoObjeto = turmas.filter((t) => nucleoIds.has(t.nucleoId));
                      const turmaIds = new Set(turmasDoObjeto.map((t) => t.id));

                      const beneficiariosDoObjeto = beneficiarios.filter(
                        (b) =>
                          b.turmasInfo?.some((ti) => ti.turmaId && turmaIds.has(ti.turmaId)) ||
                          (b.nucleoId && nucleoIds.has(b.nucleoId))
                      );

                      return (
                        <tr key={o.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(o.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3 font-medium text-zinc-900">
                            {o.nome}
                          </td>
                          <td className="px-5 py-3 text-zinc-600">
                            {orgsDoObjeto.length > 0 ? orgsDoObjeto.map((org) => org.nome).join(", ") : "—"}
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-violet-700">
                            {nucleosDoObjeto.length}
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-sky-700">
                            {turmasDoObjeto.length}
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-amber-700">
                            {beneficiariosDoObjeto.length}
                          </td>
                          <td className="px-5 py-3">
                            <StatusObjetoBadge objetoId={o.id} statusAtual={o.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/objetos/${o.id}/editar`}
                                className="text-xs font-semibold text-sky-600 hover:underline"
                              >
                                Editar
                              </Link>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                onClick={() => setObjetoParaExcluir(o)}
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

      {/* Modal de Confirmação de Exclusão de Objeto */}
      {objetoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Excluir Objeto</h3>
                <p className="text-xs text-zinc-500">Esta ação moverá o objeto para a lixeira.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600">
              Tem certeza que deseja excluir o objeto <strong>{objetoParaExcluir.nome}</strong> (Termo: {objetoParaExcluir.termoDeFomento || "N/A"})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setObjetoParaExcluir(null)}
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
        totalCount={rawResultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} objeto(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
