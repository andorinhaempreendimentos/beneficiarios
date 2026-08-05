"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserCheck, UserX } from "lucide-react";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select, FilterBar, StatCard, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { beneficiariosApi, nucleosApi, atividadesApi, type Paginated, type BeneficiarioApi, type NucleoApi, type AtividadeApi } from "@/lib/api/services";
import { statusBeneficiarioTone } from "@/lib/status";
import { calcularIdade } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { nome: "", matricula: "", cpf: "", status: "", atividadeId: "", tipoMatricula: "", nucleoId: "", idadeMin: "", idadeMax: "" };

export default function BeneficiariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const { data: pageData, loading, refetch } = useQuery<Paginated<BeneficiarioApi>>(
    "/api/v1/beneficiarios",
    { ...ativos, page: pagina, limit: PER_PAGE },
  );

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>("/api/v1/nucleos", { limit: 200 });
  const { data: atividadesData } = useQuery<Paginated<AtividadeApi>>("/api/v1/atividades", { limit: 200 });

  const nucleos = nucleosData?.data ?? [];
  const atividades = atividadesData?.data ?? [];
  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const atv = pageData?.data.filter((b) => b.status === "Aprovado").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Beneficiários"
        description="Listagem geral de todos os beneficiários do sistema"
        actions={<LinkButton href="/beneficiarios/novo">Novo Beneficiário</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total na página (ativos)" value={atv} tone="green" icon={UserCheck} />
        <StatCard label="Total encontrado" value={total} tone="sky" icon={UserX} />
      </div>

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Nome">
          <Input placeholder="Buscar por nome" value={filtros.nome}
            onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))} />
        </Field>
        <Field label="Matrícula">
          <Input placeholder="0000-0000" value={filtros.matricula}
            onChange={(e) => setFiltros((f) => ({ ...f, matricula: e.target.value }))} />
        </Field>
        <Field label="CPF">
          <Input placeholder="000.000.000-00" value={filtros.cpf}
            onChange={(e) => setFiltros((f) => ({ ...f, cpf: e.target.value }))} />
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="Novo cadastro">Novo cadastro</option>
            <option value="Comparecer a sede">Comparecer a sede</option>
            <option value="Aguardando seletiva">Aguardando seletiva</option>
            <option value="Fila de espera">Fila de espera</option>
            <option value="Desistente">Desistente</option>
            <option value="Aprovado">Aprovado</option>
          </Select>
        </Field>
        <Field label="Atividade">
          <Select value={filtros.atividadeId} onChange={(e) => setFiltros((f) => ({ ...f, atividadeId: e.target.value }))}>
            <option value="">Todas</option>
            {atividades.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </Select>
        </Field>
        <Field label="Tipo de matrícula">
          <Select value={filtros.tipoMatricula} onChange={(e) => setFiltros((f) => ({ ...f, tipoMatricula: e.target.value }))}>
            <option value="">Todos</option>
            <option value="Online">Online</option>
            <option value="Interna">Interna</option>
          </Select>
        </Field>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <Field label="Idade mínima">
          <Input type="number" min={0} value={filtros.idadeMin}
            onChange={(e) => setFiltros((f) => ({ ...f, idadeMin: e.target.value }))} />
        </Field>
        <Field label="Idade máxima">
          <Input type="number" min={0} value={filtros.idadeMax}
            onChange={(e) => setFiltros((f) => ({ ...f, idadeMax: e.target.value }))} />
        </Field>
      </FilterBar>

      <Card>
        {loading && (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3">Matrícula</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Idade</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum beneficiário encontrado.</td></tr>
                ) : resultado.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-500">{b.matricula}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusBeneficiarioTone[b.status as keyof typeof statusBeneficiarioTone] ?? "zinc"}>{b.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/beneficiarios/${b.id}`} className="font-medium text-sky-600 hover:underline">{b.nomeCompleto}</Link>
                        <Badge tone={b.tipoMatricula === "Online" ? "sky" : "violet"}>{b.tipoMatricula}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{calcularIdade(b.dataNascimento)} anos</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/beneficiarios/${b.id}`} className="text-sky-600 hover:underline">Acessar</Link>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <Link href={`/beneficiarios/${b.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </Card>
    </div>
  );
}
