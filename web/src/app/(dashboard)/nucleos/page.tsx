"use client";

import { useState, useCallback } from "react";
import {
  Building2,
  MapPin,
  Download,
  Trash2,
  Check,
  Power,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BarChart3,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  LinkButton,
  PageHeader,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { StatusNucleoBadge } from "@/components/nucleos/StatusNucleoBadge";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import {
  nucleosApi,
  organizacoesApi,
  objetosApi,
  atividadesApi,
  regioesApi,
  type Paginated,
  type NucleoApi,
  type OrganizacaoApi,
  type ObjetoApi,
  type AtividadeApi,
  type RegiaoApi,
  type NucleosResumoResultado,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

import { useLocationFilter } from "@/components/providers/LocationFilterProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import { useMemo } from "react";

const PER_PAGE = 15;
const EMPTY = {
  busca: "",
  objetoId: "",
  organizacaoId: "",
  regiaoId: "",
  cidade: "",
  atividadeId: "",
  emFuncionamento: "",
  disponivelPreInscricao: "",
};

export default function NucleosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isCoordenador = Boolean((user as any)?.isCoordenador);
  const { estado, cidade, organizacaoId, nucleoId } = useLocationFilter();
  const { t } = useDicionario();
  const [filtros, setFiltros] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processando, setProcessando] = useState(false);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [nucleoSelecionadoResumo, setNucleoSelecionadoResumo] = useState<string | null>(null);

  const { data: resumoMetasData, loading: loadingResumoMetas } = useQuery<NucleosResumoResultado>(
    () => nucleosApi.resumoMetas(),
    []
  );

  const { data: meusNucleos, loading: loadingMeusNucleos } = useQuery<NucleoApi[]>(
    () => isCoordenador ? coordenadoresApi.getMeusNucleos() : Promise.resolve([] as NucleoApi[]),
    [isCoordenador],
  );
  const semNucleos = isCoordenador && meusNucleos != null && meusNucleos.length === 0;
  const meusNucleosIds = useMemo(() => (meusNucleos ?? []).map((n) => n.id), [meusNucleos]);

  const nucleosExibidosResumo = useMemo(() => {
    const list = [...(resumoMetasData?.nucleos || [])];
    const filtered = isCoordenador && meusNucleosIds.length > 0
      ? list.filter((n) => meusNucleosIds.includes(n.id))
      : list;
    return filtered.sort((a, b) => b.totalBanco - a.totalBanco);
  }, [resumoMetasData, isCoordenador, meusNucleosIds]);


  const { data: objetosRes } = useQuery<Paginated<ObjetoApi>>(() => objetosApi.list({ limit: 100 }), []);
  const { data: organizacoesRes } = useQuery<Paginated<OrganizacaoApi>>(() => organizacoesApi.list({ limit: 100 }), []);
  const { data: atividadesRes } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 100 }), []);
  const { data: regioesRes } = useQuery<Paginated<RegiaoApi>>(() => regioesApi.list({ limit: 100 }), []);

  const objetos = objetosRes?.data ?? [];
  const organizacoes = organizacoesRes?.data ?? [];
  const atividades = atividadesRes?.data ?? [];
  const regioes = regioesRes?.data ?? [];

  const { data: pageData, loading, refetch } = useQuery<Paginated<NucleoApi>>(
    () => {
      if (isCoordenador) {
        if (meusNucleosIds.length === 1) {
          return nucleosApi.list({ ...filtros, nucleoId: meusNucleosIds[0], page: pagina, limit: PER_PAGE });
        }
        if (semNucleos) {
          return Promise.resolve({ data: [] as NucleoApi[], total: 0, page: 1, limit: PER_PAGE });
        }
      }
      return nucleosApi.list({ ...filtros, page: pagina, limit: PER_PAGE });
    },
    [filtros, pagina, isCoordenador, meusNucleosIds, semNucleos],
  );

  async function alternarFuncionamentoLote(status: boolean) {
    if (selectedIds.length === 0) return;
    setProcessando(true);
    try {
      await Promise.all(selectedIds.map((id) => nucleosApi.update(id, { emFuncionamento: status })));
      toast.success(`${selectedIds.length} núcleo(s) ${status ? "ativado(s)" : "desativado(s)"} com sucesso`);
      refetch();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erro ao alterar funcionamento: " + (err?.message || "Erro desconhecido"));
    } finally {
      setProcessando(false);
    }
  }

  const rawResultado = pageData?.data ?? [];

  const resultado = useMemo(() => {
    return rawResultado.filter((n) => {
      if (isCoordenador && !meusNucleosIds.includes(n.id)) {
        return false;
      }
      let estadoUf = (n as any).estado as string | undefined;
      const cidadeNome = n.cidade || "Não informada";
      if (!estadoUf) {
        if (n.cidade?.toLowerCase() === "palmas") estadoUf = "TO";
        else if (n.cidade?.toLowerCase() === "recife") estadoUf = "PE";
        else estadoUf = "Não informado";
      }
      const bateEstado = estado === "Todos" || estadoUf === estado;
      const bateCidade = cidade === "Todas" || cidadeNome === cidade;
      const bateOrg = organizacaoId === "Todas" || n.organizacaoId === organizacaoId;
      const bateNucleo = nucleoId === "Todos" || n.id === nucleoId;
      return bateEstado && bateCidade && bateOrg && bateNucleo;
    });
  }, [rawResultado, estado, cidade, organizacaoId, nucleoId, isCoordenador, meusNucleosIds]);
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const limpar = useCallback(() => { setFiltros(EMPTY); setPagina(1); }, []);

  function setCampo(chave: keyof typeof EMPTY, valor: string) {
    setPagina(1);
    setFiltros((f) => ({ ...f, [chave]: valor }));
  }

  const qtdFiltrosAvancados = useMemo(() => {
    return [
      filtros.organizacaoId,
      filtros.regiaoId,
      filtros.cidade,
      filtros.atividadeId,
    ].filter(Boolean).length;
  }, [filtros.organizacaoId, filtros.regiaoId, filtros.cidade, filtros.atividadeId]);

  const temAlgumFiltro = useMemo(() => {
    return Boolean(
      filtros.busca ||
      filtros.objetoId ||
      filtros.emFuncionamento ||
      qtdFiltrosAvancados > 0
    );
  }, [filtros.busca, filtros.objetoId, filtros.emFuncionamento, qtdFiltrosAvancados]);

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((n) => n.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = resultado.length > 0 && selectedIds.length === resultado.length;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title={t("local", "Núcleo", true)}
        description={`Listagem e gestão de ${t("local", "Núcleo", true).toLowerCase()}`}
        actions={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <button
              type="button"
              onClick={() => setMostrarResumo((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold tracking-wide uppercase transition-all shadow-md cursor-pointer ${
                mostrarResumo
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/30 ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-105"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-700 text-white shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              <BarChart3 className="w-5 h-5 shrink-0" />
              <span>{mostrarResumo ? "Ocultar Resumo" : "RESUMO"}</span>
            </button>
            <LinkButton href="/grade-semanal" variant="outline">Ver Grade Semanal</LinkButton>
            {!isCoordenador && (
              <LinkButton href="/nucleos/novo">{`Novo ${t("local", "Núcleo").toLowerCase()}`}</LinkButton>
            )}
          </div>
        }
      />

      {/* Grade de Resumo dos Núcleos (Metas no Banco Real) */}
      {mostrarResumo && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Resumo de Beneficiários por Núcleo (Banco Real)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Meta: 100 / núcleo
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Alocação real de alunos ativos por núcleo. Clique em um cartão para filtrar a listagem abaixo.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {resumoMetasData && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800/60 shadow-xs">
                    Total no Banco: <strong className="text-sky-900 dark:text-sky-100 font-extrabold">{resumoMetasData.totalAlunos}</strong>
                  </span>
                </div>
              )}
              {nucleoSelecionadoResumo && (
                <button
                  type="button"
                  onClick={() => {
                    setNucleoSelecionadoResumo(null);
                    setCampo("busca", "");
                  }}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Limpar seleção
                </button>
              )}
              <button
                type="button"
                onClick={() => setMostrarResumo(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Fechar resumo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingResumoMetas ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Carregando métricas dos núcleos...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {nucleosExibidosResumo.map((n) => {
                const selecionado = nucleoSelecionadoResumo === n.id;
                const isZerado = n.totalBanco === 0;

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (selecionado) {
                        setNucleoSelecionadoResumo(null);
                        setCampo("busca", "");
                      } else {
                        setNucleoSelecionadoResumo(n.id);
                        setCampo("busca", n.nome);
                      }
                    }}
                    className={`p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                      selecionado
                        ? "border-2 border-sky-600 dark:border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 shadow-sm ring-2 ring-sky-500/20"
                        : isZerado
                        ? "border-2 border-red-500/70 dark:border-red-600/70 bg-red-50/30 dark:bg-red-950/20 hover:border-red-600 hover:bg-red-50/50"
                        : "border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate" title={n.nome}>
                        {n.nome}
                      </span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          n.percentual >= 100
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : n.totalBanco > 0
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800"
                        }`}
                      >
                        {n.totalBanco}/100
                      </span>
                    </div>

                    {/* Barra de progresso */}
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          n.percentual >= 100
                            ? "bg-emerald-500"
                            : n.totalBanco > 0
                            ? "bg-sky-500"
                            : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                        style={{ width: `${n.percentual}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Banco: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{n.totalBanco}</strong></span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{n.percentual}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Barra de Filtros Ágil (Opção C) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3 transition-all">
        {/* Linha Principal Compacta */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Busca Textual com Ícone */}
          <div className="relative flex-1 min-w-[220px]">
            <Input
              placeholder={`Buscar por nome ou identificação do ${t("local", "Núcleo").toLowerCase()}...`}
              value={filtros.busca}
              onChange={(e) => setCampo("busca", e.target.value)}
              className="pl-10"
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>

          {/* Select de Objeto (Parceria) */}
          <div className="w-full lg:w-72">
            <Select
              value={filtros.objetoId}
              onChange={(e) => setCampo("objetoId", e.target.value)}
            >
              <option value="">Todos os {t("objeto", "Objeto", true).toLowerCase()}</option>
              {objetos.map((ob) => (
                <option key={ob.id} value={ob.id}>
                  {ob.nome}
                </option>
              ))}
            </Select>
          </div>

          {/* Chips de Status Rápido */}
          <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setCampo("emFuncionamento", "")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.emFuncionamento === ""
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setCampo("emFuncionamento", "true")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.emFuncionamento === "true"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setCampo("emFuncionamento", "false")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.emFuncionamento === "false"
                  ? "bg-zinc-700 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Inativos
            </button>
          </div>

          {/* Ações da Barra: Botão Mais Filtros e Limpar */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setMostrarFiltrosAvancados((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                mostrarFiltrosAvancados || qtdFiltrosAvancados > 0
                  ? "border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Mais Filtros</span>
              {qtdFiltrosAvancados > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-bold text-white">
                  {qtdFiltrosAvancados}
                </span>
              )}
              {mostrarFiltrosAvancados ? (
                <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </button>

            {temAlgumFiltro && (
              <Button
                variant="outline"
                size="sm"
                onClick={limpar}
                type="button"
                className="text-xs text-zinc-600 hover:text-red-600 border-zinc-200 dark:border-zinc-700"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Gaveta de Filtros Secundários / Avançados */}
        {mostrarFiltrosAvancados && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
            <Field label={t("organizacao", "Organização Executora")}>
              <Select
                value={filtros.organizacaoId}
                onChange={(e) => setCampo("organizacaoId", e.target.value)}
              >
                <option value="">Todas as organizações</option>
                {organizacoes.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Região">
              <Select
                value={filtros.regiaoId}
                onChange={(e) => setCampo("regiaoId", e.target.value)}
              >
                <option value="">Todas as regiões</option>
                {regioes.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Cidade">
              <Input
                placeholder="Filtrar por cidade..."
                value={filtros.cidade}
                onChange={(e) => setCampo("cidade", e.target.value)}
              />
            </Field>

            <Field label={t("atividade", "Modalidade Esportiva")}>
              <Select
                value={filtros.atividadeId}
                onChange={(e) => setCampo("atividadeId", e.target.value)}
              >
                <option value="">Todas as atividades</option>
                {atividades.map((atv) => (
                  <option key={atv.id} value={atv.id}>
                    {atv.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </div>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando núcleos…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum {t("local", "Núcleo").toLowerCase()} encontrado para os filtros selecionados.
                  </div>
                ) : (
                  resultado.map((nucleo) => {
                    const isSelected = selectedIds.includes(nucleo.id);
                    return (
                      <div
                        key={nucleo.id}
                        onClick={() => router.push(`/nucleos/${nucleo.id}/editar`)}
                        className={`group relative rounded-2xl border transition-all flex flex-col justify-between min-h-[180px] gap-3 p-4 pb-3.5 cursor-pointer ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/30 ring-2 ring-sky-500/20 shadow-xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Checkbox em Cunha Perfeita no Vértice Superior Esquerdo (Apenas Admin) */}
                        {!isCoordenador && (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute -top-px -left-px z-10 flex h-8 w-9 items-center justify-center rounded-tl-2xl rounded-br-xl border-r border-b transition-all cursor-pointer ${
                              isSelected
                                ? "bg-sky-600 border-sky-600 text-white shadow-2xs"
                                : "bg-zinc-100/90 border-zinc-200/80 text-zinc-400 group-hover:bg-zinc-200/90 group-hover:border-zinc-300"
                            }`}
                            title="Selecionar este núcleo"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(nucleo.id)}
                              className="sr-only"
                            />
                            <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                          </label>
                        )}

                        {/* Topo: Status badge alinhado à direita (sem colisão com o checkbox) */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-end min-h-[26px]"
                        >
                          <StatusNucleoBadge nucleoId={nucleo.id} emFuncionamento={nucleo.emFuncionamento} />
                        </div>

                        {/* Título e Subtítulo com Região Integrada */}
                        <div className="flex flex-col gap-1 -mt-1">
                          <Link
                            href={`/nucleos/${nucleo.id}/editar`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-zinc-900 text-sm leading-snug hover:text-sky-600 transition-colors line-clamp-1"
                            title={nucleo.identificacao}
                          >
                            {nucleo.identificacao}
                          </Link>
                          <div className="flex items-center gap-2 flex-wrap">
                            {nucleo.nomeLocal && (
                              <span className="text-xs text-zinc-400 leading-tight">
                                {nucleo.nomeLocal}
                              </span>
                            )}
                            {(nucleo.regiaoNome || nucleo.regiao) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/50">
                                <MapPin className="h-2.5 w-2.5" />
                                {nucleo.regiaoNome || nucleo.regiao}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Localização */}
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-2.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{[nucleo.bairro, nucleo.cidade].filter(Boolean).join(" · ") || "—"}</span>
                        </div>

                        {/* Rodapé: Organização e Ações (Sem botão Acessar redundante) */}
                        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100/60 pt-2.5 mt-auto shrink-0">
                          <span className="truncate max-w-[75%] font-medium text-zinc-600" title={nucleo.organizacao?.nome || ""}>
                            {nucleo.organizacao?.nome || "—"}
                          </span>
                          {!isCoordenador && (
                            <Link
                              href={`/nucleos/${nucleo.id}/editar`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-semibold text-zinc-600 hover:text-sky-600 transition-colors py-0.5 px-1.5 rounded-md hover:bg-zinc-50"
                            >
                              Editar
                            </Link>
                          )}
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
                      {!isCoordenador && (
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-5 py-3">{t("local", "Núcleo")}</th>
                      <th className="px-5 py-3">Região</th>
                      <th className="px-5 py-3">Cidade / Bairro</th>
                      <th className="px-5 py-3">{t("organizacao", "Organização")}</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Início</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr>
                        <td colSpan={isCoordenador ? 7 : 8} className="px-5 py-8 text-center text-sm text-zinc-400">
                          Nenhum {t("local", "Núcleo").toLowerCase()} encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      resultado.map((nucleo) => {
                        const isSelected = selectedIds.includes(nucleo.id);
                        return (
                          <tr key={nucleo.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                            {!isCoordenador && (
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(nucleo.id)}
                                  className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div>
                                  <span className="font-medium text-zinc-900 block">{nucleo.identificacao}</span>
                                  {nucleo.nomeLocal && <span className="text-xs text-zinc-400">{nucleo.nomeLocal}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {nucleo.regiaoNome || nucleo.regiao ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                  <MapPin className="h-3 w-3" />
                                  {nucleo.regiaoNome || nucleo.regiao}
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-zinc-600">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                <span>{[nucleo.bairro, nucleo.cidade].filter(Boolean).join(" · ") || "—"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-zinc-600 font-medium">
                              {nucleo.organizacao?.nome || "—"}
                            </td>
                            <td className="px-5 py-3">
                              <StatusNucleoBadge nucleoId={nucleo.id} emFuncionamento={nucleo.emFuncionamento} />
                            </td>
                            <td className="px-5 py-3 text-zinc-600 text-xs">{formatarData(nucleo.dataInicio)}</td>
                            <td className="px-5 py-3 text-right">
                              <Link href={`/nucleos/${nucleo.id}/editar`} className="text-xs font-semibold text-sky-600 hover:underline">
                                Editar
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>

      {!isCoordenador && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          totalCount={resultado.length}
          allSelected={allSelected}
          onSelectAll={toggleSelectAll}
          onClearSelection={() => setSelectedIds([])}
        >
          <button
            type="button"
            onClick={() => alternarFuncionamentoLote(true)}
            disabled={processando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Power className="h-3.5 w-3.5" />
            <span>Ativar</span>
          </button>

          <button
            type="button"
            onClick={() => alternarFuncionamentoLote(false)}
            disabled={processando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Power className="h-3.5 w-3.5" />
            <span>Desativar</span>
          </button>

          <button
            type="button"
            onClick={() => alert(`Exportando ${selectedIds.length} núcleo(s)...`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar</span>
          </button>
        </BulkActionsBar>
      )}

    </div>
  );
}
