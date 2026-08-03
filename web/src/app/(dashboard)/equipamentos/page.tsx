"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { equipamentos } from "@/lib/mock/equipamentos";
import { nucleos } from "@/lib/mock/nucleos";
import { conservacaoLabel, conservacaoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", categoria: "", conservacao: "", nucleoId: "" };

export default function EquipamentosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    return equipamentos.filter((e) => {
      if (ativos.busca && !e.nome.toLowerCase().includes(ativos.busca.toLowerCase())) return false;
      if (ativos.categoria && e.categoria !== ativos.categoria) return false;
      if (ativos.conservacao && e.conservacao !== ativos.conservacao) return false;
      if (ativos.nucleoId && e.nucleoId !== ativos.nucleoId) return false;
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
        title="Equipamentos"
        description="Controle patrimonial de materiais e equipamentos"
        actions={<LinkButton href="/equipamentos/novo">Novo equipamento</LinkButton>}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-5 py-3"><input type="checkbox" /></th>
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
                return (
                  <tr key={e.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3"><input type="checkbox" /></td>
                    <td className="px-5 py-3">
                      <Link href={`/equipamentos/${e.id}`} className="font-medium text-sky-600 hover:underline">{e.nome}</Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{e.categoria}</td>
                    <td className="px-5 py-3 text-zinc-600">{e.quantidade}</td>
                    <td className="px-5 py-3">
                      <Badge tone={conservacaoTone[e.conservacao]}>{conservacaoLabel[e.conservacao]}</Badge>
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
        <Pagination currentPage={pagAtual} totalPages={totalPages} totalItems={filtrados.length} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
