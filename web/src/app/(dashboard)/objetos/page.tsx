"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
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

  const { data: pageData, loading } = useQuery<Paginated<ObjetoApi>>(
    () => objetosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Objetos"
        description="Projetos e eventos cadastrados"
        actions={<LinkButton href="/objetos/novo">Novo objeto</LinkButton>}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum objeto encontrado.</td></tr>
                ) : resultado.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
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
