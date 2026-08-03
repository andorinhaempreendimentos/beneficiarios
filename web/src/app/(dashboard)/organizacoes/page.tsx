"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { organizacoes } from "@/lib/mock/organizacoes";
import { objetos } from "@/lib/mock/objetos";
import { statusOrganizacaoLabel, statusOrganizacaoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", tipo: "", status: "" };

export default function OrganizacoesPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    return organizacoes.filter((o) => {
      if (ativos.busca && !o.nome.toLowerCase().includes(ativos.busca.toLowerCase()) &&
          !(o.nomeResponsavel ?? "").toLowerCase().includes(ativos.busca.toLowerCase())) return false;
      if (ativos.tipo && o.tipo !== ativos.tipo) return false;
      if (ativos.status && o.status !== ativos.status) return false;
      return true;
    });
  }, [ativos]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const pagAtual = Math.min(pagina, totalPages);
  const resultado = filtrados.slice((pagAtual - 1) * PER_PAGE, pagAtual * PER_PAGE);

  function aplicar() { setPagina(1); setAtivos(filtros); }
  function limpar() { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organizações"
        description="Entidades responsáveis pela execução dos projetos"
        actions={<LinkButton href="/organizacoes/novo">Nova organização</LinkButton>}
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome ou responsável" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Tipo">
          <Select value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
            <option value="">Todos</option>
            <option value="Instituto">Instituto</option>
            <option value="ONG">ONG</option>
            <option value="Associação">Associação</option>
            <option value="Fundação">Fundação</option>
            <option value="Outro">Outro</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-5 py-3"><input type="checkbox" /></th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Cidade/UF</th>
                <th className="px-5 py-3">Objeto vinculado</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cadastrado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultado.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhuma organização encontrada.</td></tr>
              ) : resultado.map((o) => {
                const objeto = o.objetoId ? objetos.find((ob) => ob.id === o.objetoId) : null;
                return (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3"><input type="checkbox" /></td>
                    <td className="px-5 py-3">
                      <Link href={`/organizacoes/${o.id}`} className="font-medium text-sky-600 hover:underline">{o.nome}</Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{o.tipo}</td>
                    <td className="px-5 py-3 text-zinc-600">{o.nomeResponsavel ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{o.cidade && o.estado ? `${o.cidade}/${o.estado}` : "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{objeto?.nome ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusOrganizacaoTone[o.status]}>{statusOrganizacaoLabel[o.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{formatarData(o.criadoEm)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/organizacoes/${o.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <Link href={`/organizacoes/${o.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={pagAtual} totalPages={totalPages} totalItems={filtrados.length} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
