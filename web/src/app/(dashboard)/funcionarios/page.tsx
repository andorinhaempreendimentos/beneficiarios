"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { UserCheck, UserX } from "lucide-react";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select, FilterBar, StatCard, Pagination } from "@/components/ui";
import { funcionarios } from "@/lib/mock/funcionarios";
import { statusFuncionarioLabel, statusFuncionarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import { nucleos } from "@/lib/mock/nucleos";

const PER_PAGE = 15;
const EMPTY = { busca: "", alocacao: "", funcao: "", status: "", admissaoDe: "", admissaoAte: "" };

export default function FuncionariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const admitidos = funcionarios.filter((f) => f.status === "contratado" || f.status === "voluntario");
  const desligados = funcionarios.filter((f) => f.status === "demitido");

  const filtrados = useMemo(() => {
    return funcionarios.filter((f) => {
      if (ativos.busca && !f.nomeCompleto.toLowerCase().includes(ativos.busca.toLowerCase()) &&
          !(f.cpfCnpj ?? "").includes(ativos.busca)) return false;
      if (ativos.funcao && f.funcao !== ativos.funcao) return false;
      if (ativos.status && f.status !== ativos.status) return false;
      if (ativos.admissaoDe && f.dataAdmissao < ativos.admissaoDe) return false;
      if (ativos.admissaoAte && f.dataAdmissao > ativos.admissaoAte) return false;
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
        title="Funcionários"
        description="Gestão de pessoal (RH)"
        actions={<LinkButton href="/funcionarios/novo">Cadastrar Novo Funcionário</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Admitidos" value={admitidos.length} tone="sky" icon={UserCheck} />
        <StatCard label="Desligados" value={desligados.length} tone="red" icon={UserX} />
      </div>

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Buscar">
          <Input placeholder="Nome ou CPF" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Função">
          <Select value={filtros.funcao} onChange={(e) => setFiltros((f) => ({ ...f, funcao: e.target.value }))}>
            <option value="">Todas</option>
            <option value="Agente comunitário">Agente comunitário</option>
            <option value="Articulador social">Articulador social</option>
            <option value="Coordenador de núcleo">Coordenador de núcleo</option>
            <option value="Coordenador de projeto">Coordenador de projeto</option>
            <option value="Coordenador de setor">Coordenador de setor</option>
            <option value="Instrutor">Instrutor</option>
            <option value="Monitor">Monitor</option>
            <option value="Fisioterapeuta">Fisioterapeuta</option>
            <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Matrícula</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">CPF</th>
                <th className="px-5 py-3">Função</th>
                <th className="px-5 py-3">Admissão</th>
                <th className="px-5 py-3">Alocação</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultado.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum funcionário encontrado.</td></tr>
              ) : resultado.map((f) => (
                <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500">{f.matricula}</td>
                  <td className="px-5 py-3">
                    <Link href={`/funcionarios/${f.id}`} className="font-medium text-sky-600 hover:underline">{f.nomeCompleto}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusFuncionarioTone[f.status]}>{statusFuncionarioLabel[f.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{f.cpfCnpj ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-600">{f.funcao}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(f.dataAdmissao)}</td>
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
        <Pagination
          currentPage={pagAtual}
          totalPages={totalPages}
          totalItems={filtrados.length}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </Card>
    </div>
  );
}
