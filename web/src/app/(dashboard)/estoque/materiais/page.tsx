"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { materiaisApi, type Paginated, type MaterialApi } from "@/lib/api/services";

const PER_PAGE = 20;
const EMPTY = { busca: "", categoria: "", ativo: "" };

const CATEGORIAS = [
  "Esportivo",
  "Vestuário",
  "Papelaria",
  "Limpeza",
  "Informática",
  "Mobiliário",
  "Outros",
];

export default function MateriaisPage() {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const { data: pageData, loading, refetch } = useQuery<Paginated<MaterialApi>>(
    () => materiaisApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  async function remover(id: string, nome: string) {
    if (!confirm(`Remover "${nome}"?`)) return;
    setRemovendo(id);
    try {
      await materiaisApi.remove(id);
      toast.success("Material removido.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover.");
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Materiais"
        description="Cadastro de itens consumíveis do estoque"
        actions={
          <LinkButton href="/estoque/materiais/novo">Novo material</LinkButton>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input
            placeholder="Nome do material"
            value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
          />
        </Field>
        <Field label="Categoria">
          <Select
            value={filtros.categoria}
            onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={filtros.ativo}
            onChange={(e) => setFiltros((f) => ({ ...f, ativo: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Un. Medida</th>
                  <th className="px-5 py-3">Est. Mínimo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Nenhum material encontrado.
                    </td>
                  </tr>
                ) : (
                  resultado.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/estoque/materiais/${m.id}/editar`}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          {m.nome}
                        </Link>
                        {m.descricao && (
                          <p className="text-xs text-zinc-400 truncate max-w-xs">{m.descricao}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{m.categoria}</td>
                      <td className="px-5 py-3 text-zinc-600">{m.unidadeMedida}</td>
                      <td className="px-5 py-3 text-zinc-600">{m.estoqueMinimo}</td>
                      <td className="px-5 py-3">
                        <Badge tone={m.ativo ? "green" : "zinc"}>
                          {m.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/estoque/materiais/${m.id}/editar`}
                          className="text-sky-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <span className="mx-1.5 text-zinc-300">|</span>
                        <button
                          type="button"
                          onClick={() => remover(m.id, m.nome)}
                          disabled={removendo === m.id}
                          className="text-red-500 hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {removendo === m.id ? "Removendo…" : "Remover"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </Card>
    </div>
  );
}
