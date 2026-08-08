"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserCheck, UserX, Download, Trash2 } from "lucide-react";
import {
  Badge,
  Card,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Select,
  FilterBar,
  StatCard,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { beneficiariosApi, nucleosApi, atividadesApi, type Paginated, type BeneficiarioApi, type NucleoApi, type AtividadeApi } from "@/lib/api/services";
import {
  statusBeneficiarioTone,
  statusBeneficiarioLabel,
  normalizarStatusBeneficiario,
  STATUS_BENEFICIARIO_OPCOES,
  tipoMatriculaTone,
  tipoMatriculaLabel,
  normalizarTipoMatricula,
  TIPO_MATRICULA_OPCOES,
} from "@/lib/status";
import { calcularIdade } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { nome: "", matricula: "", cpf: "", status: "", atividadeId: "", tipoMatricula: "", nucleoId: "", idadeMin: "", idadeMax: "" };

export default function BeneficiariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: pageData, loading } = useQuery<Paginated<BeneficiarioApi>>(
    () => beneficiariosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: atividadesData } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 200 }), []);

  const nucleos = nucleosData?.data ?? [];
  const atividades = atividadesData?.data ?? [];
  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  const atv = pageData?.data.filter((b) => normalizarStatusBeneficiario(b.status) === "ativo").length ?? 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = resultado.length > 0 && selectedIds.length === resultado.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Beneficiários"
        description="Listagem geral de todos os beneficiários do sistema"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/beneficiarios/novo">Novo Beneficiário</LinkButton>
          </div>
        }
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
            {STATUS_BENEFICIARIO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
            {TIPO_MATRICULA_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum beneficiário encontrado.
                  </div>
                ) : (
                  resultado.map((b) => (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        selectedIds.includes(b.id)
                          ? "border-sky-500 bg-sky-50/30 ring-1 ring-sky-500"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => toggleSelectOne(b.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-zinc-400 block">{b.matricula}</span>
                            <Link href={`/beneficiarios/${b.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {b.nomeCompleto}
                            </Link>
                          </div>
                        </div>
                        <Badge tone={statusBeneficiarioTone[normalizarStatusBeneficiario(b.status)]}>
                          {statusBeneficiarioLabel[normalizarStatusBeneficiario(b.status)]}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-2.5">
                        <span>Idade: <strong className="text-zinc-700">{calcularIdade(b.dataNascimento)} anos</strong></span>
                        <Badge tone={tipoMatriculaTone[normalizarTipoMatricula(b.tipoMatricula)]}>{tipoMatriculaLabel[normalizarTipoMatricula(b.tipoMatricula)]}</Badge>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100/60">
                        <Link href={`/beneficiarios/${b.id}`} className="text-xs font-semibold text-sky-600 hover:underline">
                          Acessar detalhes
                        </Link>
                        <span className="text-zinc-300">|</span>
                        <Link href={`/beneficiarios/${b.id}/editar`} className="text-xs text-zinc-500 hover:underline">
                          Editar
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-3">Matrícula</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-5 py-3">Idade</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum beneficiário encontrado.</td></tr>
                    ) : resultado.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${
                          selectedIds.includes(b.id) ? "bg-sky-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => toggleSelectOne(b.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3 text-zinc-500">{b.matricula}</td>
                        <td className="px-5 py-3">
                          <Badge tone={statusBeneficiarioTone[normalizarStatusBeneficiario(b.status)]}>{statusBeneficiarioLabel[normalizarStatusBeneficiario(b.status)]}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/beneficiarios/${b.id}`} className="font-medium text-sky-600 hover:underline">{b.nomeCompleto}</Link>
                            <Badge tone={tipoMatriculaTone[normalizarTipoMatricula(b.tipoMatricula)]}>{tipoMatriculaLabel[normalizarTipoMatricula(b.tipoMatricula)]}</Badge>
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
          </>
        )}
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </Card>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={resultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} beneficiário(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
