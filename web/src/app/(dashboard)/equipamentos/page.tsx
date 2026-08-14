"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Download, Wrench } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
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
import { equipamentosApi, nucleosApi, type Paginated, type EquipamentoApi, type NucleoApi } from "@/lib/api/services";
import { conservacaoLabel, conservacaoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", categoria: "", conservacao: "", nucleoId: "" };

export default function EquipamentosPage() {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processando, setProcessando] = useState(false);
  const [modalConservacao, setModalConservacao] = useState(false);
  const [novaConservacao, setNovaConservacao] = useState("");

  const { data: pageData, loading, refetch } = useQuery<Paginated<EquipamentoApi>>(
    () => equipamentosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);

  async function alterarConservacaoLote() {
    if (selectedIds.length === 0 || !novaConservacao) return;
    setProcessando(true);
    try {
      await Promise.all(selectedIds.map((id) => equipamentosApi.update(id, { conservacao: novaConservacao })));
      toast.success(`Conservação de ${selectedIds.length} equipamento(s) alterada para "${novaConservacao}"`);
      setModalConservacao(false);
      setNovaConservacao("");
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao alterar conservação: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const nucleos = nucleosData?.data ?? [];

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((e) => e.id));
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
        title="Equipamentos"
        description="Controle patrimonial de materiais e equipamentos"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/equipamentos/novo">Novo equipamento</LinkButton>
          </div>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome do equipamento" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Categoria">
          <Select value={filtros.categoria} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}>
            <option value="">Todas</option>
            <option value="Esportivo">Esportivo</option>
            <option value="Escritório">Escritório</option>
            <option value="Informática">Informática</option>
            <option value="Mobiliário">Mobiliário</option>
            <option value="Vestuário">Vestuário</option>
            <option value="Outros">Outros</option>
          </Select>
        </Field>
        <Field label="Conservação">
          <Select value={filtros.conservacao} onChange={(e) => setFiltros((f) => ({ ...f, conservacao: e.target.value }))}>
            <option value="">Todos</option>
            <option value="novo">Novo</option>
            <option value="bom">Bom</option>
            <option value="regular">Regular</option>
            <option value="ruim">Ruim</option>
            <option value="inservivel">Inservível</option>
          </Select>
        </Field>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
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
                    Nenhum equipamento encontrado.
                  </div>
                ) : (
                  resultado.map((e) => {
                    const nucleo = e.nucleoId ? nucleos.find((n) => n.id === e.nucleoId) : null;
                    const isSelected = selectedIds.includes(e.id);
                    return (
                      <div
                        key={e.id}
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
                              onChange={() => toggleSelectOne(e.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <div>
                              <Link href={`/equipamentos/${e.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                                {e.nome}
                              </Link>
                              <span className="text-xs text-zinc-400 block">{e.categoria}</span>
                            </div>
                          </div>
                          <Badge tone={conservacaoTone[e.conservacao as keyof typeof conservacaoTone] ?? "zinc"}>
                            {conservacaoLabel[e.conservacao as keyof typeof conservacaoLabel] ?? e.conservacao}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 border-t border-zinc-100 pt-2.5">
                          <div>Qtd: <strong className="text-zinc-700">{e.quantidade}</strong></div>
                          <div>Núcleo: <strong className="text-zinc-700 block truncate">{nucleo?.identificacao ?? "—"}</strong></div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100/60 pt-2">
                          <span>NF: {e.notaFiscal ?? "—"}</span>
                          <div className="flex items-center gap-3">
                            <Link href={`/equipamentos/${e.id}`} className="text-xs font-semibold text-sky-600 hover:underline">
                              Detalhes
                            </Link>
                            <span className="text-zinc-300">|</span>
                            <Link href={`/equipamentos/${e.id}/editar`} className="text-xs text-zinc-500 hover:underline">
                              Editar
                            </Link>
                          </div>
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
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-5 py-3">Categoria</th>
                      <th className="px-5 py-3">Qtd</th>
                      <th className="px-5 py-3">Conservação</th>
                      <th className="px-5 py-3">Núcleo</th>
                      <th className="px-5 py-3">Nota Fiscal</th>
                      <th className="px-5 py-3">Aquisição</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum equipamento encontrado.</td></tr>
                    ) : resultado.map((e) => {
                      const nucleo = e.nucleoId ? nucleos.find((n) => n.id === e.nucleoId) : null;
                      const isSelected = selectedIds.includes(e.id);
                      return (
                        <tr key={e.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(e.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <Link href={`/equipamentos/${e.id}`} className="font-medium text-sky-600 hover:underline">{e.nome}</Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{e.categoria}</td>
                          <td className="px-5 py-3 text-zinc-600">{e.quantidade}</td>
                          <td className="px-5 py-3">
                            <Badge tone={conservacaoTone[e.conservacao as keyof typeof conservacaoTone] ?? "zinc"}>
                              {conservacaoLabel[e.conservacao as keyof typeof conservacaoLabel] ?? e.conservacao}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{e.notaFiscal ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{e.dataAquisicao ? formatarData(e.dataAquisicao) : "—"}</td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/equipamentos/${e.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <Link href={`/equipamentos/${e.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={resultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => setModalConservacao(true)}
          disabled={processando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Alterar Conservação ({selectedIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} equipamento(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>

      {/* Modal de Alterar Estado de Conservação em Lote */}
      {modalConservacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Alterar Conservação de {selectedIds.length} Equipamento(s)
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Selecione a nova condição física que será atribuída a todos os equipamentos selecionados.
            </p>
            <select
              value={novaConservacao}
              onChange={(e) => setNovaConservacao(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="" className="dark:bg-zinc-900">Selecione o estado de conservação...</option>
              <option value="novo" className="dark:bg-zinc-900">Novo</option>
              <option value="bom" className="dark:bg-zinc-900">Bom</option>
              <option value="regular" className="dark:bg-zinc-900">Regular</option>
              <option value="ruim" className="dark:bg-zinc-900">Ruim</option>
              <option value="danificado" className="dark:bg-zinc-900">Danificado</option>
              <option value="descartado" className="dark:bg-zinc-900">Descartado</option>
            </select>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setModalConservacao(false)}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={alterarConservacaoLote}
                disabled={!novaConservacao || processando}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processando ? "Salvando..." : "Confirmar Alteração"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
