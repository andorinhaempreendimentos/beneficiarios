"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { atividades } from "@/lib/mock/atividades";
import { formatarData } from "@/lib/utils";

const TURNO_LABEL: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
const PER_PAGE = 15;
const EMPTY = { busca: "", turno: "", preInscricao: "" };

export default function AtividadesPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    return atividades.filter((a) => {
      if (ativos.busca && !a.nome.toLowerCase().includes(ativos.busca.toLowerCase())) return false;
      if (ativos.turno && !a.turnos.includes(ativos.turno as "manha" | "tarde" | "noite")) return false;
      if (ativos.preInscricao === "sim" && !a.disponivelPreInscricao) return false;
      if (ativos.preInscricao === "nao" && a.disponivelPreInscricao) return false;
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
        title="Atividades"
        description="Cursos e modalidades oferecidas"
        actions={<LinkButton href="/atividades/novo">Nova atividade</LinkButton>}
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome da atividade" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Turno">
          <Select value={filtros.turno} onChange={(e) => setFiltros((f) => ({ ...f, turno: e.target.value }))}>
            <option value="">Todos</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </Select>
        </Field>
        <Field label="Pré-inscrição">
          <Select value={filtros.preInscricao} onChange={(e) => setFiltros((f) => ({ ...f, preInscricao: e.target.value }))}>
            <option value="">Todas</option>
            <option value="sim">Ativa</option>
            <option value="nao">Inativa</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-5 py-3"><input type="checkbox" /></th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Turnos</th>
                <th className="px-5 py-3">Turmas</th>
                <th className="px-5 py-3">Ativa na pré inscrição</th>
                <th className="px-5 py-3">Perguntas adicionais</th>
                <th className="px-5 py-3">Cadastrado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultado.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhuma atividade encontrada.</td></tr>
              ) : resultado.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3"><input type="checkbox" /></td>
                  <td className="px-5 py-3 text-zinc-500">{a.id}</td>
                  <td className="px-5 py-3">
                    <Link href={`/atividades/${a.id}`} className="font-medium text-sky-600 hover:underline">{a.nome}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.turnos.map((t) => <Badge key={t} tone="zinc">{TURNO_LABEL[t]}</Badge>)}
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge tone="sky">{a.qtdTurmas}</Badge></td>
                  <td className="px-5 py-3 text-zinc-600">{a.disponivelPreInscricao ? "Sim" : "Não"}</td>
                  <td className="px-5 py-3 text-zinc-600">{a.perguntas.length}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(a.criadoEm)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/atividades/${a.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                    <span className="mx-1.5 text-zinc-300">|</span>
                    <Link href={`/atividades/${a.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={pagAtual} totalPages={totalPages} totalItems={filtrados.length} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
