"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge, Card, FilterBar, Field, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { termosEntregaApi, type Paginated, type TermoEntregaApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 20;
const EMPTY = { status: "" };

const statusLabel: Record<string, string> = {
  pendente: "Pendente", entregue: "Entregue", devolvido: "Devolvido", atrasado: "Atrasado",
};
const statusTone: Record<string, "amber" | "sky" | "green" | "red"> = {
  pendente: "amber", entregue: "sky", devolvido: "green", atrasado: "red",
};

export default function TermosPage() {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [devolvendo, setDevolvendo] = useState<string | null>(null);

  const { data: pageData, loading, refetch } = useQuery<Paginated<TermoEntregaApi>>(
    () => termosEntregaApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  async function devolver(id: string) {
    if (!confirm("Registrar devolução deste termo?")) return;
    setDevolvendo(id);
    try {
      await termosEntregaApi.devolver(id);
      toast.success("Devolução registrada.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar devolução.");
    } finally {
      setDevolvendo(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Termos de Entrega"
        description="Controle de retirada e devolução de materiais"
        actions={<LinkButton href="/estoque/termos/novo">Novo termo</LinkButton>}
      />
      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
                  <th className="px-5 py-3">Data entrega</th>
                  <th className="px-5 py-3">Recebedor</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Devolução prev.</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum termo encontrado.</td></tr>
                ) : resultado.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-700">{formatarData(t.dataEntrega)}</td>
                    <td className="px-5 py-3 text-zinc-600">{t.recebedorId}</td>
                    <td className="px-5 py-3">
                      <Badge tone="zinc">{t.recebedorTipo === "funcionario" ? "Funcionário" : "Beneficiário"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {t.dataDevolucaoPrev ? formatarData(t.dataDevolucaoPrev) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[t.status] ?? "zinc"}>{statusLabel[t.status] ?? t.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(t.status === "entregue" || t.status === "atrasado") && (
                        <button
                          type="button"
                          onClick={() => devolver(t.id)}
                          disabled={devolvendo === t.id}
                          className="text-sky-600 hover:underline disabled:opacity-50 cursor-pointer text-xs font-medium"
                        >
                          {devolvendo === t.id ? "Registrando…" : "Registrar devolução"}
                        </button>
                      )}
                      {t.status === "devolvido" && (
                        <span className="text-xs text-green-600">
                          Devolvido {t.dataDevolucaoReal ? formatarData(t.dataDevolucaoReal) : ""}
                        </span>
                      )}
                    </td>
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
