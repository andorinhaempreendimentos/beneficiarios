"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserCheck, UserX } from "lucide-react";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select, FilterBar, StatCard, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { funcionariosApi, funcoesApi, type Paginated, type FuncionarioApi, type FuncaoApi } from "@/lib/api/services";
import { statusFuncionarioLabel, statusFuncionarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", funcao: "", status: "", admissaoDe: "", admissaoAte: "" };

export default function FuncionariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const { data: funcoesRes } = useQuery<FuncaoApi[]>(() => funcoesApi.list(), []);
  const funcoes = funcoesRes ?? [];

  const { data: pageData, loading } = useQuery<Paginated<FuncionarioApi>>(
    () => funcionariosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: statsAdm } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ status: "contratado,voluntario", limit: 1 }), []);
  const { data: statsDes } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ status: "demitido", limit: 1 }), []);

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Funcionários"
        description="Gestão de pessoal (RH)"
        actions={<LinkButton href="/funcionarios/novo">Cadastrar Novo Funcionário</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Admitidos" value={statsAdm?.total ?? 0} tone="sky" icon={UserCheck} />
        <StatCard label="Desligados" value={statsDes?.total ?? 0} tone="red" icon={UserX} />
      </div>

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Buscar">
          <Input placeholder="Nome" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Função">
          <Select value={filtros.funcao} onChange={(e) => setFiltros((f) => ({ ...f, funcao: e.target.value }))}>
            <option value="">Todas as funções</option>
            {funcoes.map((fn) => (
              <option key={fn.id} value={fn.nome}>{fn.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
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
            onChange={(e) => setFiltros((f) => ({ ...f, admissaoDe: e.target.value }))} />
        </Field>
        <Field label="Até">
          <Input type="date" value={filtros.admissaoAte}
            onChange={(e) => setFiltros((f) => ({ ...f, admissaoAte: e.target.value }))} />
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum funcionário encontrado.</td></tr>
                ) : resultado.map((f) => (
                  <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
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
