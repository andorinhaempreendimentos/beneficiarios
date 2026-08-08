"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserCheck, UserX, Download } from "lucide-react";
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
import { funcionariosApi, funcoesApi, type Paginated, type FuncionarioApi, type FuncaoApi } from "@/lib/api/services";
import { statusFuncionarioLabel, statusFuncionarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", funcao: "", status: "", admissaoDe: "", admissaoAte: "" };

export default function FuncionariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: funcoesRes } = useQuery<FuncaoApi[]>(() => funcoesApi.list(), []);
  const funcoes = funcoesRes ?? [];

  const { data: pageData, loading } = useQuery<Paginated<FuncionarioApi>>(
    () => funcionariosApi.list({ ...filtros, page: pagina, limit: PER_PAGE }),
    [filtros, pagina],
  );
  const { data: statsAdm } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ status: "contratado,voluntario", limit: 1 }), []);
  const { data: statsDes } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ status: "demitido", limit: 1 }), []);

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const limpar = useCallback(() => { setFiltros(EMPTY); setPagina(1); }, []);

  function setCampo(chave: keyof typeof EMPTY, valor: string) {
    setPagina(1);
    setFiltros((f) => ({ ...f, [chave]: valor }));
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((f) => f.id));
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
        title="Funcionários"
        description="Gestão de pessoal (RH)"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/funcionarios/novo">Cadastrar Novo Funcionário</LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Admitidos" value={statsAdm?.total ?? 0} tone="sky" icon={UserCheck} />
        <StatCard label="Desligados" value={statsDes?.total ?? 0} tone="red" icon={UserX} />
      </div>

      <FilterBar onClear={limpar}>
        <Field label="Buscar">
          <Input placeholder="Nome" value={filtros.busca}
            onChange={(e) => setCampo("busca", e.target.value)} />
        </Field>
        <Field label="Função">
          <Select value={filtros.funcao} onChange={(e) => setCampo("funcao", e.target.value)}>
            <option value="">Todas as funções</option>
            {funcoes.map((fn) => (
              <option key={fn.id} value={fn.nome}>{fn.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setCampo("status", e.target.value)}>
            <option value="">Todos os status</option>
            <option value="contratado">Contratado</option>
            <option value="voluntario">Voluntário</option>
            <option value="demitido">Demitido</option>
            <option value="pendente">Pendente</option>
            <option value="licenca_medica">Licença médica</option>
            <option value="licenca_maternidade">Licença maternidade</option>
            <option value="afastado_inss">Afastado INSS</option>
          </Select>
        </Field>
        <Field label="Admissão de">
          <Input type="date" value={filtros.admissaoDe}
            onChange={(e) => setCampo("admissaoDe", e.target.value)} />
        </Field>
        <Field label="Até">
          <Input type="date" value={filtros.admissaoAte}
            onChange={(e) => setCampo("admissaoAte", e.target.value)} />
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">Nenhum funcionário encontrado.</div>
                ) : (
                  resultado.map((f) => {
                    const isSelected = selectedIds.includes(f.id);
                    return (
                      <div
                        key={f.id}
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
                              onChange={() => toggleSelectOne(f.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-[10px] font-mono font-semibold text-zinc-400 block">{f.matricula}</span>
                              <Link href={`/funcionarios/${f.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                                {f.nomeCompleto}
                              </Link>
                            </div>
                          </div>
                          <Badge tone={statusFuncionarioTone[f.status as keyof typeof statusFuncionarioTone] ?? "zinc"}>
                            {statusFuncionarioLabel[f.status as keyof typeof statusFuncionarioLabel] ?? f.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 border-t border-zinc-100 pt-2.5">
                          <div>Função: <strong className="text-zinc-700 block truncate">{f.funcao || "—"}</strong></div>
                          <div>Alocação: <strong className="text-zinc-700 block truncate">{f.alocadoEm || "—"}</strong></div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100/60">
                          <Link href={`/funcionarios/${f.id}`} className="text-xs font-semibold text-sky-600 hover:underline">
                            Detalhes
                          </Link>
                          <span className="text-zinc-300">|</span>
                          <Link href={`/funcionarios/${f.id}/editar`} className="text-xs text-zinc-500 hover:underline">
                            Editar
                          </Link>
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
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Função</th>
                      <th className="px-5 py-3">Admissão</th>
                      <th className="px-5 py-3">Alocação</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum funcionário encontrado.</td></tr>
                    ) : resultado.map((f) => {
                      const isSelected = selectedIds.includes(f.id);
                      return (
                        <tr key={f.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(f.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3 text-zinc-500">{f.matricula}</td>
                          <td className="px-5 py-3">
                            <Link href={`/funcionarios/${f.id}`} className="font-medium text-sky-600 hover:underline">{f.nomeCompleto}</Link>
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={statusFuncionarioTone[f.status as keyof typeof statusFuncionarioTone] ?? "zinc"}>
                              {statusFuncionarioLabel[f.status as keyof typeof statusFuncionarioLabel] ?? f.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{f.funcao}</td>
                          <td className="px-5 py-3 text-zinc-600">{f.dataAdmissao ? formatarData(f.dataAdmissao) : "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{f.alocadoEm}</td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/funcionarios/${f.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <Link href={`/funcionarios/${f.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
          onClick={() => alert(`Exportando ${selectedIds.length} funcionário(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
