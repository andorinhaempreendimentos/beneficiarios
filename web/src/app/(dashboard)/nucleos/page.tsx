"use client";

import { useState, useMemo } from "react";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { RadialChart } from "@/components/charts/RadialChart";
import { nucleos } from "@/lib/mock/nucleos";
import { turmas } from "@/lib/mock/turmas";
import { atividades } from "@/lib/mock/atividades";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", status: "", preInscricao: "" };

export default function NucleosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const atv = nucleos.filter((n) => n.emFuncionamento).length;
  const encerrados = nucleos.filter((n) => n.dataFechamento).length;
  const inativos = nucleos.length - atv - encerrados;

  const totalVagas = turmas.reduce((acc, t) => acc + t.vagasTotais, 0);
  const totalOcupadas = turmas.reduce((acc, t) => acc + t.qtdBeneficiarios, 0);
  const ocupacaoGlobal = totalVagas > 0 ? Math.round((totalOcupadas / totalVagas) * 100) : 0;

  const topNucleos = [...nucleos].sort((a, b) => b.beneficiariosAtivos - a.beneficiariosAtivos).slice(0, 5);
  const distribuicaoPorCurso = atividades
    .map((a) => ({ nome: a.nome, total: turmas.filter((t) => t.atividadeId === a.id).reduce((acc, t) => acc + t.qtdBeneficiarios, 0) }))
    .sort((a, b) => b.total - a.total).slice(0, 5);

  const filtrados = useMemo(() => {
    return nucleos.filter((n) => {
      if (ativos.busca && !n.identificacao.toLowerCase().includes(ativos.busca.toLowerCase()) &&
          !(n.nomeLocal ?? "").toLowerCase().includes(ativos.busca.toLowerCase())) return false;
      if (ativos.status === "ativo" && !n.emFuncionamento) return false;
      if (ativos.status === "inativo" && n.emFuncionamento) return false;
      if (ativos.preInscricao === "sim" && !n.disponivelPreInscricao) return false;
      if (ativos.preInscricao === "nao" && n.disponivelPreInscricao) return false;
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
        title="Núcleos"
        description="Painel geral de núcleos, ocupação e distribuição de beneficiários"
        actions={<LinkButton href="/nucleos/novo">Novo núcleo</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader><h3 className="text-sm font-medium text-zinc-700">Ocupação Global</h3></CardHeader>
          <CardBody className="flex justify-center">
            <RadialChart label="Ocupação" value={ocupacaoGlobal} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="text-sm font-medium text-zinc-700">Top Núcleos (alunos ativos)</h3></CardHeader>
          <CardBody>
            <BarChart categories={topNucleos.map((n) => n.identificacao)} data={topNucleos.map((n) => n.beneficiariosAtivos)} horizontal />
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h3 className="text-sm font-medium text-zinc-700">Status Operacional</h3></CardHeader>
          <CardBody className="flex justify-center">
            <DonutChart labels={["Ativos", "Inativos", "Encerrados"]} series={[atv, inativos, encerrados]} colors={["#16a34a", "#f59e0b", "#dc2626"]} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-sm font-medium text-zinc-700">Distribuição por Curso</h3></CardHeader>
        <CardBody>
          <BarChart categories={distribuicaoPorCurso.map((c) => c.nome)} data={distribuicaoPorCurso.map((c) => c.total)} />
        </CardBody>
      </Card>

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome ou identificação do núcleo" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </Select>
        </Field>
        <Field label="Pré-inscrição">
          <Select value={filtros.preInscricao} onChange={(e) => setFiltros((f) => ({ ...f, preInscricao: e.target.value }))}>
            <option value="">Todos</option>
            <option value="sim">Disponível</option>
            <option value="nao">Indisponível</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Núcleo</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Início</th>
                <th className="px-5 py-3">Turmas ativas</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultado.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum núcleo encontrado.</td></tr>
              ) : resultado.map((nucleo) => {
                const turmasDoNucleo = turmas.filter((t) => t.nucleoId === nucleo.id);
                return (
                  <tr key={nucleo.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium text-zinc-900" title={`${nucleo.endereco}, ${nucleo.numero} - ${nucleo.bairro}, ${nucleo.cidade}`}>
                          {nucleo.identificacao}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={nucleo.emFuncionamento ? "green" : "red"}>{nucleo.emFuncionamento ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{formatarData(nucleo.dataInicio)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {turmasDoNucleo.map((t) => <Badge key={t.id} tone="sky">{t.nome} ({t.qtdBeneficiarios})</Badge>)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/nucleos/${nucleo.id}`} className="text-sky-600 hover:underline">Acessar</Link>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <Link href={`/nucleos/${nucleo.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
