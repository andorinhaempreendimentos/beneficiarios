"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { UserCheck, UserX, Download, Trash2, Clock, Users, Dumbbell, Calendar, CheckCircle2, Check } from "lucide-react";
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
import {
  funcionariosApi,
  funcoesApi,
  nucleosApi,
  turmasApi,
  beneficiariosApi,
  type Paginated,
  type FuncionarioApi,
  type FuncaoApi,
  type NucleoApi,
  type TurmaApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import { statusFuncionarioLabel, statusFuncionarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import { StatusFuncionarioBadge } from "@/components/funcionarios/StatusFuncionarioBadge";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";

const PER_PAGE = 15;
const EMPTY = { busca: "", funcao: "", status: "", admissaoDe: "", admissaoAte: "" };

export default function FuncionariosPage() {
  const { estado, cidade, organizacaoId, nucleoId } = useLocationFilter();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState<FuncionarioApi | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [funcionarioPonto, setFuncionarioPonto] = useState<FuncionarioApi | null>(null);
  const [pontoRegistrado, setPontoRegistrado] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setAtivos(filtros);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros]);

  const { data: funcoesRes } = useQuery<FuncaoApi[]>(() => funcoesApi.list(), []);
  const funcoes = funcoesRes ?? [];

  const { data: pageData, loading, refetch } = useQuery<Paginated<FuncionarioApi>>(
    () => funcionariosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: statsAdm } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ status: "contratado,voluntario", limit: 1 }), []);
  const { data: statsDes } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ status: "demitido", limit: 1 }), []);
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: turmasData } = useQuery<Paginated<TurmaApi>>(() => turmasApi.list({ limit: 500 }), []);
  const { data: beneficiariosData } = useQuery<Paginated<BeneficiarioApi>>(() => beneficiariosApi.list({ limit: 1000 }), []);

  const nucleos = nucleosData?.data ?? [];
  const turmas = turmasData?.data ?? [];
  const beneficiarios = beneficiariosData?.data ?? [];
  const rawResultado = pageData?.data ?? [];

  const resultado = useMemo(() => {
    return rawResultado.filter((f: FuncionarioApi) => {
      const nucleoEncontrado = nucleos.find((n) => n.id === f.nucleoId);
      let estadoUf = (nucleoEncontrado as any)?.estado as string | undefined;
      const cidadeNome = nucleoEncontrado?.cidade || "Não informada";

      if (!estadoUf) {
        if (cidadeNome.toLowerCase() === "palmas") estadoUf = "TO";
        else if (cidadeNome.toLowerCase() === "recife") estadoUf = "PE";
        else estadoUf = "Não informado";
      }

      const bateEstado = estado === "Todos" || estadoUf === estado;
      const bateCidade = cidade === "Todas" || cidadeNome === cidade;
      const bateOrg = organizacaoId === "Todas" || (nucleoEncontrado?.organizacaoId === organizacaoId);
      const bateNucleo = nucleoId === "Todos" || (f.nucleoId ?? nucleoEncontrado?.id) === nucleoId;
      return bateEstado && bateCidade && bateOrg && bateNucleo;
    });
  }, [rawResultado, estado, cidade, organizacaoId, nucleoId, nucleos]);
  
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  function setCampo(chave: keyof typeof EMPTY, valor: string) {
    setFiltros((f) => ({ ...f, [chave]: valor }));
  }

  const confirmarExclusao = async () => {
    if (!funcionarioParaExcluir) return;
    setExcluindo(true);
    try {
      await funcionariosApi.remove(funcionarioParaExcluir.id);
      setFuncionarioParaExcluir(null);
      setPagina(1);
      refetch();
    } catch (err: any) {
      alert("Erro ao excluir funcionário: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setExcluindo(false);
    }
  };

  const registrarPontoHoje = () => {
    setPontoRegistrado(true);
    setTimeout(() => {
      setPontoRegistrado(false);
      setFuncionarioPonto(null);
      alert("Ponto registrado com sucesso!");
    }, 1200);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((f) => f.id));
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
        title="Funcionários / RH"
        description="Gestão de professores, instrutores e equipe do projeto"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/funcionarios/novo">Cadastrar Novo Funcionário</LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Admitidos" value={statsAdm?.total ?? 0} tone="sky" icon={UserCheck} />
        <StatCard label="Desligados" value={statsDes?.total ?? 0} tone="red" icon={UserX} />
      </div>

      <FilterBar onClear={limpar}>
        <Field label="Buscar">
          <Input placeholder="Nome" value={filtros.busca}
            onChange={(e) => setCampo("busca", e.target.value)} />
        </Field>
        <Field label="Função">
          <Select value={filtros.funcao} onChange={(e) => setCampo("funcao", e.target.value)}>
            <option value="">Todas as funções</option>
            {funcoes.map((fn) => (
              <option key={fn.id} value={fn.nome}>{fn.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setCampo("status", e.target.value)}>
            <option value="">Todos os status</option>
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
            onChange={(e) => setCampo("admissaoDe", e.target.value)} />
        </Field>
        <Field label="Até">
          <Input type="date" value={filtros.admissaoAte}
            onChange={(e) => setCampo("admissaoAte", e.target.value)} />
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">Nenhum funcionário encontrado.</div>
                ) : (
                  resultado.map((f) => {
                    const isSelected = selectedIds.includes(f.id);

                    // 1. Turmas vinculadas ao funcionário
                    const turmasDoFuncionario = turmas.filter(
                      (t) =>
                        t.responsaveis?.includes(f.id) ||
                        t.responsaveis?.includes(f.nomeCompleto) ||
                        t.responsaveisNomes?.some((r) => r.toLowerCase().includes(f.nomeCompleto.toLowerCase()))
                    );
                    const turmaIds = new Set(turmasDoFuncionario.map((t) => t.id));

                    // 2. Beneficiários relacionados às turmas do funcionário
                    const beneficiariosDoFuncionario = beneficiarios.filter(
                      (b) =>
                        b.turmasInfo?.some((ti) => ti.turmaId && turmaIds.has(ti.turmaId)) ||
                        (f.nucleoId && b.nucleoId === f.nucleoId)
                    );

                    return (
                      <div
                        key={f.id}
                        className={`group relative overflow-hidden rounded-2xl border transition-all flex flex-col justify-between gap-3.5 p-4 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/30 ring-2 ring-sky-500/20 shadow-xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Checkbox Elegante no Canto Superior Esquerdo */}
                        <label
                          className={`absolute top-0 left-0 z-10 flex h-8 w-9 items-center justify-center rounded-br-xl border-r border-b transition-all cursor-pointer ${
                            isSelected
                              ? "bg-sky-600 border-sky-600 text-white shadow-2xs"
                              : "bg-zinc-100/90 border-zinc-200/80 text-zinc-400 group-hover:bg-zinc-200/80 group-hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(f.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        {/* Header: Tag Pessoal, Nome & Status */}
                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-violet-800">
                                Pessoal
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 font-semibold">
                                {f.matricula}
                              </span>
                            </div>
                            <Link href={`/funcionarios/${f.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {f.nomeCompleto}
                            </Link>
                          </div>
                          <StatusFuncionarioBadge funcionarioId={f.id} statusAtual={f.status} />
                        </div>

                        {/* Função & Alocação */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 border-t border-zinc-100 pt-2">
                          <div>
                            Função: <strong className="text-zinc-800 block truncate">{f.funcao || "—"}</strong>
                          </div>
                          <div>
                            Alocação: <strong className="text-zinc-800 block truncate">{f.alocadoEm || "—"}</strong>
                          </div>
                        </div>

                        {/* Indicadores de Turmas Vinculadas & Beneficiários Relacionados */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-zinc-100 pt-2.5">
                          <div className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1.5 text-sky-800 border border-sky-100 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                            <span className="truncate">{turmasDoFuncionario.length} Turma(s)</span>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800 border border-amber-100 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate">{beneficiariosDoFuncionario.length} Alunos</span>
                          </div>
                        </div>

                        {/* Botões de Ação: Ponto, Editar e Excluir */}
                        <div className="flex items-center justify-between border-t border-zinc-100/60 pt-2.5">
                          {/* Botão de Ponto */}
                          <button
                            type="button"
                            onClick={() => setFuncionarioPonto(f)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Ponto
                          </button>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/funcionarios/${f.id}/editar`}
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors shadow-2xs"
                            >
                              Editar
                            </Link>

                            <button
                              type="button"
                              onClick={() => setFuncionarioParaExcluir(f)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-5 py-3">Função</th>
                      <th className="px-5 py-3 text-center">Turmas</th>
                      <th className="px-5 py-3 text-center">Alunos</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum funcionário encontrado.</td></tr>
                    ) : resultado.map((f) => {
                      const isSelected = selectedIds.includes(f.id);
                      const turmasDoFuncionario = turmas.filter(
                        (t) =>
                          t.responsaveis?.includes(f.id) ||
                          t.responsaveis?.includes(f.nomeCompleto) ||
                          t.responsaveisNomes?.some((r) => r.toLowerCase().includes(f.nomeCompleto.toLowerCase()))
                      );
                      const turmaIds = new Set(turmasDoFuncionario.map((t) => t.id));

                      const beneficiariosDoFuncionario = beneficiarios.filter(
                        (b) =>
                          b.turmasInfo?.some((ti) => ti.turmaId && turmaIds.has(ti.turmaId)) ||
                          (f.nucleoId && b.nucleoId === f.nucleoId)
                      );

                      return (
                        <tr key={f.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(f.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3 text-zinc-500 font-mono text-xs">{f.matricula}</td>
                          <td className="px-5 py-3 font-medium text-zinc-900">
                            <Link href={`/funcionarios/${f.id}`} className="hover:text-sky-600">{f.nomeCompleto}</Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{f.funcao}</td>
                          <td className="px-5 py-3 text-center font-semibold text-sky-700">{turmasDoFuncionario.length}</td>
                          <td className="px-5 py-3 text-center font-semibold text-amber-700">{beneficiariosDoFuncionario.length}</td>
                          <td className="px-5 py-3">
                            <StatusFuncionarioBadge funcionarioId={f.id} statusAtual={f.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setFuncionarioPonto(f)}
                                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                              >
                                Ponto
                              </button>
                              <span className="text-zinc-300">|</span>
                              <Link
                                href={`/funcionarios/${f.id}/editar`}
                                className="text-xs font-semibold text-sky-600 hover:underline"
                              >
                                Editar
                              </Link>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                onClick={() => setFuncionarioParaExcluir(f)}
                                className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>

      {/* Modal de Registro de Ponto */}
      {funcionarioPonto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Folha de Ponto / Frequência</h3>
                <p className="text-xs text-zinc-500">{funcionarioPonto.nomeCompleto} ({funcionarioPonto.matricula})</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-zinc-600">
              <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span>Função:</span>
                <strong className="text-zinc-900">{funcionarioPonto.funcao || "—"}</strong>
              </div>
              <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span>Data & Hora Atual:</span>
                <strong className="text-zinc-900">{new Date().toLocaleString("pt-BR")}</strong>
              </div>
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Status da Frequência:
                </span>
                <strong className="font-extrabold text-emerald-700">Em dia</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFuncionarioPonto(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={registrarPontoHoje}
                disabled={pontoRegistrado}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {pontoRegistrado ? "Registrando Ponto..." : "Registrar Ponto Hoje"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Funcionário */}
      {funcionarioParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Excluir Funcionário</h3>
                <p className="text-xs text-zinc-500">Esta ação moverá o funcionário para a lixeira.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600">
              Tem certeza que deseja excluir o funcionário <strong>{funcionarioParaExcluir.nomeCompleto}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFuncionarioParaExcluir(null)}
                disabled={excluindo}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {excluindo ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={resultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} funcionário(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
