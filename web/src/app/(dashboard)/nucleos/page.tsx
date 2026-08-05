"use client";

import { useState, useCallback } from "react";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { RadialChart } from "@/components/charts/RadialChart";
import { useQuery } from "@/lib/hooks/useQuery";
import { nucleosApi, type Paginated, type NucleoApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", emFuncionamento: "", disponivelPreInscricao: "" };

export default function NucleosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const { data: pageData, loading } = useQuery<Paginated<NucleoApi>>(
    "/api/v1/nucleos",
    { ...ativos, page: pagina, limit: PER_PAGE },
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const atv = resultado.filter((n) => n.emFuncionamento).length;
  const inativos = resultado.filter((n) => !n.emFuncionamento && !n.dataFechamento).length;
  const encerrados = resultado.filter((n) => !!n.dataFechamento).length;

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Núcleos"
        description="Painel geral de núcleos"
        actions={<LinkButton href="/nucleos/novo">Novo núcleo</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><h3 className="text-sm font-medium text-zinc-700">Status Operacional</h3></CardHeader>
          <CardBody className="flex justify-center">
            <DonutChart labels={["Ativos", "Inativos", "Encerrados"]} series={[atv, inativos, encerrados]} colors={["#16a34a", "#f59e0b", "#dc2626"]} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="text-sm font-medium text-zinc-700">Núcleos nesta página</h3></CardHeader>
          <CardBody>
            <BarChart categories={resultado.map((n) => n.identificacao)} data={resultado.map(() => 1)} horizontal />
          </CardBody>
        </Card>
      </div>

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome ou identificação do núcleo" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Status">
          <Select value={filtros.emFuncionamento} onChange={(e) => setFiltros((f) => ({ ...f, emFuncionamento: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        </Field>
        <Field label="Pré-inscrição">
          <Select value={filtros.disponivelPreInscricao} onChange={(e) => setFiltros((f) => ({ ...f, disponivelPreInscricao: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Disponível</option>
            <option value="false">Indisponível</option>
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
                  <th className="px-5 py-3">Núcleo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum núcleo encontrado.</td></tr>
                ) : resultado.map((nucleo) => (
                  <tr key={nucleo.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium text-zinc-900">{nucleo.identificacao}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={nucleo.emFuncionamento ? "green" : "red"}>{nucleo.emFuncionamento ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{formatarData(nucleo.dataInicio)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/nucleos/${nucleo.id}`} className="text-sky-600 hover:underline">Acessar</Link>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <Link href={`/nucleos/${nucleo.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
