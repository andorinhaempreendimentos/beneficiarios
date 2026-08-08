"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
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
import { objetosApi, type Paginated, type ObjetoApi } from "@/lib/api/services";
import { statusObjetoLabel, statusObjetoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", status: "", tipoDuracao: "" };

export default function ObjetosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: pageData, loading } = useQuery<Paginated<ObjetoApi>>(
    () => objetosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((o) => o.id));
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
        title="Objetos"
        description="Projetos e eventos cadastrados"
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
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum objeto encontrado.
                  </div>
                ) : (
                  resultado.map((o) => {
                    const isSelected = selectedIds.includes(o.id);
                    return (
                      <div
                        key={o.id}
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
                              onChange={() => toggleSelectOne(o.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <div>
                              <Link href={`/objetos/${o.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                                {o.nome}
                              </Link>
                              <span className="text-xs text-zinc-400 block">
                                {o.tipoDuracao === "pontual" ? "Evento Pontual" : "Período"}
                              </span>
                            </div>
                          </div>
                          <Badge tone={statusObjetoTone[o.status as keyof typeof statusObjetoTone] ?? "zinc"}>
                            {statusObjetoLabel[o.status as keyof typeof statusObjetoLabel] ?? o.status}
                          </Badge>
                        </div>

                        <div className="text-xs text-zinc-500 border-t border-zinc-100 pt-2.5">
                          Período: <strong className="text-zinc-700">
                            {o.tipoDuracao === "pontual"
                              ? formatarData(o.dataEvento ?? "")
                              : `${formatarData(o.dataInicio ?? "")} — ${formatarData(o.dataTermino ?? "")}`}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100/60 pt-2">
                          <span>Termo: {o.termoDeFomento ?? "—"}</span>
                          <div className="flex items-center gap-3">
                            <Link href={`/objetos/${o.id}`} className="text-xs font-semibold text-sky-600 hover:underline">
                              Detalhes
                            </Link>
                            <span className="text-zinc-300">|</span>
                            <Link href={`/objetos/${o.id}/editar`} className="text-xs text-zinc-500 hover:underline">
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
                      <th className="px-5 py-3">Tipo</th>
                      <th className="px-5 py-3">Período / Data</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Termo de Fomento</th>
                      <th className="px-5 py-3">Cadastrado em</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum objeto encontrado.</td></tr>
                    ) : resultado.map((o) => {
                      const isSelected = selectedIds.includes(o.id);
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
                          <td className="px-5 py-3">
                            <Link href={`/objetos/${o.id}`} className="font-medium text-sky-600 hover:underline">{o.nome}</Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">
                            {o.tipoDuracao === "pontual" ? "Evento Pontual" : "Período"}
                          </td>
                          <td className="px-5 py-3 text-zinc-600">
                            {o.tipoDuracao === "pontual"
                              ? formatarData(o.dataEvento ?? "")
                              : `${formatarData(o.dataInicio ?? "")} — ${formatarData(o.dataTermino ?? "")}`}
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={statusObjetoTone[o.status as keyof typeof statusObjetoTone] ?? "zinc"}>
                              {statusObjetoLabel[o.status as keyof typeof statusObjetoLabel] ?? o.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{o.termoDeFomento ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{formatarData(o.criadoEm)}</td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/objetos/${o.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <Link href={`/objetos/${o.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
          onClick={() => alert(`Exportando ${selectedIds.length} objeto(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
