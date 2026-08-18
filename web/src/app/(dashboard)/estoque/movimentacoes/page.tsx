"use client";

import { useState, useCallback } from "react";
import { Card, PageHeader, FilterBar, Field, Select, LinkButton, Pagination, Badge } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { movimentacoesEstoqueApi, nucleosApi, materiaisApi, type Paginated, type MovimentacaoEstoqueApi, type NucleoApi, type MaterialApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 20;
const EMPTY = { nucleoId: "", materialId: "", tipo: "" };

const tipoLabel: Record<string, string> = {
  entrada: "Entrada", saida: "Saída", transferencia: "Transferência", perda: "Perda", dano: "Dano",
};
const tipoTone: Record<string, "green" | "red" | "sky" | "amber" | "zinc"> = {
  entrada: "green", saida: "red", transferencia: "sky", perda: "amber", dano: "zinc",
};

export default function MovimentacoesPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const { data: pageData, loading } = useQuery<Paginated<MovimentacaoEstoqueApi>>(
    () => movimentacoesEstoqueApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: materiaisData } = useQuery<Paginated<MaterialApi>>(() => materiaisApi.list({ limit: 200 }), []);

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const nucleos = nucleosData?.data ?? [];
  const materiais = materiaisData?.data ?? [];

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Movimentações de Estoque"
        description="Histórico de entradas, saídas e transferências"
        actions={<LinkButton href="/estoque/movimentacoes/nova">Registrar movimentação</LinkButton>}
      />
      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <Field label="Material">
          <Select value={filtros.materialId} onChange={(e) => setFiltros((f) => ({ ...f, materialId: e.target.value }))}>
            <option value="">Todos</option>
            {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </Select>
        </Field>
        <Field label="Tipo">
          <Select value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
            <option value="">Todos</option>
            {Object.entries(tipoLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Material</th>
                  <th className="px-5 py-3">Núcleo</th>
                  <th className="px-5 py-3">Qtd</th>
                  <th className="px-5 py-3">Antes → Depois</th>
                  <th className="px-5 py-3">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhuma movimentação encontrada.</td></tr>
                ) : resultado.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-600">{formatarData(m.dataMovimentacao)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={tipoTone[m.tipo] ?? "zinc"}>{tipoLabel[m.tipo] ?? m.tipo}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-800">{m.material?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.nucleo?.identificacao ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-zinc-800">{m.quantidade}</td>
                    <td className="px-5 py-3 text-xs text-zinc-500">
                      {m.quantidadeAnterior} → <strong className="text-zinc-700">{m.quantidadePosterior}</strong>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{m.responsavel?.nome ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
