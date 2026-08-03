"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { turmas } from "@/lib/mock/turmas";
import { nucleos } from "@/lib/mock/nucleos";
import { atividades } from "@/lib/mock/atividades";

const PER_PAGE = 15;
const EMPTY = { busca: "", nucleoId: "", atividadeId: "", exclusiva: "" };

export default function TurmasPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    return turmas.filter((t) => {
      if (ativos.busca && !t.nome.toLowerCase().includes(ativos.busca.toLowerCase()) &&
          !t.responsaveis.join(" ").toLowerCase().includes(ativos.busca.toLowerCase())) return false;
      if (ativos.nucleoId && t.nucleoId !== ativos.nucleoId) return false;
      if (ativos.atividadeId && t.atividadeId !== ativos.atividadeId) return false;
      if (ativos.exclusiva === "sim" && !t.exclusiva) return false;
      if (ativos.exclusiva === "nao" && t.exclusiva) return false;
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
        title="Turmas"
        description="Turmas vinculadas aos núcleos e atividades"
        actions={<LinkButton href="/turmas/novo">Nova turma</LinkButton>}
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome ou responsável" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <Field label="Atividade">
          <Select value={filtros.atividadeId} onChange={(e) => setFiltros((f) => ({ ...f, atividadeId: e.target.value }))}>
            <option value="">Todas</option>
            {atividades.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </Select>
        </Field>
        <Field label="Exclusiva">
          <Select value={filtros.exclusiva} onChange={(e) => setFiltros((f) => ({ ...f, exclusiva: e.target.value }))}>
            <option value="">Todas</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
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
                <th className="px-5 py-3">Núcleo</th>
                <th className="px-5 py-3">Atividade</th>
                <th className="px-5 py-3">Horário</th>
                <th className="px-5 py-3">Dias</th>
                <th className="px-5 py-3">Vagas</th>
                <th className="px-5 py-3">Exclusiva</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultado.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhuma turma encontrada.</td></tr>
              ) : resultado.map((t) => {
                const nucleo = nucleos.find((n) => n.id === t.nucleoId);
                const atividade = atividades.find((a) => a.id === t.atividadeId);
                return (
                  <tr key={t.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3"><input type="checkbox" /></td>
                    <td className="px-5 py-3">
                      <Link href={`/turmas/${t.id}`} className="font-medium text-sky-600 hover:underline">{t.nome}</Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{atividade?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{t.horario}</td>
                    <td className="px-5 py-3 text-zinc-600">{t.dias.join(", ")}</td>
                    <td className="px-5 py-3">
                      <Badge tone={t.qtdBeneficiarios >= t.vagasTotais ? "red" : "green"}>{t.qtdBeneficiarios}/{t.vagasTotais}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={t.exclusiva ? "amber" : "zinc"}>{t.exclusiva ? "Sim" : "Não"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{t.responsaveis[0] ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/turmas/${t.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <Link href={`/turmas/${t.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
