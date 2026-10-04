"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Plus,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  ClipboardCheck,
  X,
  Check,
} from "lucide-react";
import { Card, PageHeader, Badge, LinkButton, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  pendenciasGeraisApi,
  type PendenciaGeralApi,
  type NucleoApi,
  type Paginated,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;

const gravidadeTone: Record<string, "zinc" | "amber" | "red"> = {
  baixa: "zinc",
  media: "amber",
  alta: "amber",
  critica: "red",
};

const statusTone: Record<string, "red" | "sky" | "green" | "zinc"> = {
  aberta: "red",
  em_andamento: "sky",
  resolvida: "green",
  cancelada: "zinc",
};

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

export default function CoordenadorPendenciasGeraisPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("aberta");
  const [gravidadeFiltro, setGravidadeFiltro] = useState<string>("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("");
  const [pagina, setPagina] = useState(1);

  // Modal de resolução rápida
  const [pendenciaParaResolver, setPendenciaParaResolver] = useState<PendenciaGeralApi | null>(null);
  const [providenciasTexto, setProvidenciasTexto] = useState("");
  const [obsResolucaoTexto, setObsResolucaoTexto] = useState("");
  const [salvandoResolucao, setSalvandoResolucao] = useState(false);

  // Núcleos atribuídos ao coordenador
  const { data: meusNucleos, loading: loadingNucleos } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  const todosNucleoIds = useMemo(() => {
    return (meusNucleos ?? []).map((n) => n.id);
  }, [meusNucleos]);

  const nucleoIdsFiltrados = useMemo(() => {
    if (!meusNucleos || meusNucleos.length === 0) return [];
    if (nucleoSelecionadoId === "todos") return todosNucleoIds;
    return [nucleoSelecionadoId];
  }, [meusNucleos, nucleoSelecionadoId, todosNucleoIds]);

  const nucleoAtivoUnico = useMemo(() => {
    if (nucleoSelecionadoId === "todos") return null;
    return (meusNucleos ?? []).find((n) => n.id === nucleoSelecionadoId) ?? null;
  }, [meusNucleos, nucleoSelecionadoId]);

  // Lista paginada conforme filtros
  const { data: pageData, loading: loadingPends, refetch } = useQuery<Paginated<PendenciaGeralApi>>(
    () =>
      nucleoIdsFiltrados.length > 0
        ? pendenciasGeraisApi.list({
            nucleoIds: nucleoIdsFiltrados,
            status: statusFiltro || undefined,
            gravidade: gravidadeFiltro || undefined,
            tipo: tipoFiltro || undefined,
            page: pagina,
            limit: PER_PAGE,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: PER_PAGE }),
    [JSON.stringify(nucleoIdsFiltrados), statusFiltro, gravidadeFiltro, tipoFiltro, pagina],
  );

  // Todas as pendências dos núcleos (para métricas gerais nos cards)
  const { data: todasPendsData, refetch: refetchTodas } = useQuery<Paginated<PendenciaGeralApi>>(
    () =>
      todosNucleoIds.length > 0
        ? pendenciasGeraisApi.list({
            nucleoIds: todosNucleoIds,
            limit: 300,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 300 }),
    [JSON.stringify(todosNucleoIds)],
  );

  const pendencias = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const todasPendencias = todasPendsData?.data ?? [];

  const totalAbertas = todasPendencias.filter((p) => p.status === "aberta").length;
  const totalCriticas = todasPendencias.filter(
    (p) => p.status === "aberta" && (p.gravidade === "critica" || p.gravidade === "alta"),
  ).length;
  const totalEmAndamento = todasPendencias.filter((p) => p.status === "em_andamento").length;
  const totalResolvidas = todasPendencias.filter((p) => p.status === "resolvida").length;
  const totalDeSupervisao = todasPendencias.filter((p) => Boolean(p.supervisaoId)).length;

  const linkNovaPendencia = nucleoAtivoUnico
    ? `/coordenador/pendencias-gerais/nova?nucleoId=${nucleoAtivoUnico.id}`
    : `/coordenador/pendencias-gerais/nova`;

  async function handleConfirmarResolucao(e: React.FormEvent) {
    e.preventDefault();
    if (!pendenciaParaResolver) return;
    if (!providenciasTexto.trim()) {
      toast.error("Informe as providências tomadas para resolver a pendência.");
      return;
    }

    setSalvandoResolucao(true);
    try {
      await pendenciasGeraisApi.resolver(pendenciaParaResolver.id, {
        providencias: providenciasTexto.trim(),
        resolvidoPorId: user?.refId || user?.id || "",
        observacoesResolucao: obsResolucaoTexto.trim() || undefined,
      });
      toast.success("Pendência marcada como resolvida!");
      setPendenciaParaResolver(null);
      setProvidenciasTexto("");
      setObsResolucaoTexto("");
      refetch();
      refetchTodas();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao resolver pendência.");
    } finally {
      setSalvandoResolucao(false);
    }
  }

  if (loadingNucleos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-400">Carregando pendências dos núcleos…</div>
      </div>
    );
  }

  if (!meusNucleos || meusNucleos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <AlertCircle className="h-8 w-8 text-zinc-400" />
        </div>
        <p className="text-zinc-700 font-semibold text-lg">Nenhum núcleo atribuído</p>
        <p className="text-sm text-zinc-500 max-w-md">
          Não há núcleos sob sua coordenação para visualização de pendências.
        </p>
        <LinkButton href="/coordenador" variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar ao Painel
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/coordenador"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Painel do Coordenador
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Pendências Gerais dos Núcleos
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Registro, acompanhamento e resolução de providências técnicas e operacionais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LinkButton href={linkNovaPendencia} variant="primary">
            <Plus className="h-4 w-4 mr-1.5" /> Nova Pendência
          </LinkButton>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Abertas */}
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Pendências Abertas
              </p>
              <p className="text-3xl font-extrabold text-red-600 mt-2">
                {totalAbertas}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Aguardando solução</p>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Card 2: Críticas / Altas */}
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Urgência Alta / Crítica
              </p>
              <p className="text-3xl font-extrabold text-amber-600 mt-2">
                {totalCriticas}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Requerem ação prioritária</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Card 3: Em Andamento */}
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Em Andamento
              </p>
              <p className="text-3xl font-extrabold text-sky-600 mt-2">
                {totalEmAndamento}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Sendo tratadas</p>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Card 4: Resolvidas */}
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Resolvidas
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">
                {totalResolvidas}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {totalDeSupervisao > 0 ? `${totalDeSupervisao} de supervisões` : "Providenciadas"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {meusNucleos && meusNucleos.length > 1 && (
            <select
              value={nucleoSelecionadoId}
              onChange={(e) => {
                setNucleoSelecionadoId(e.target.value);
                setPagina(1);
              }}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos os núcleos ({meusNucleos.length})</option>
              {meusNucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  📍 {n.identificacao}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value);
              setPagina(1);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todos os status</option>
            <option value="aberta">Abertas</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvida">Resolvidas</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <select
            value={gravidadeFiltro}
            onChange={(e) => {
              setGravidadeFiltro(e.target.value);
              setPagina(1);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todas as gravidades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          <select
            value={tipoFiltro}
            onChange={(e) => {
              setTipoFiltro(e.target.value);
              setPagina(1);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todos os tipos</option>
            <option value="estrutura">Estrutura</option>
            <option value="material">Material</option>
            <option value="professor">Professor</option>
            <option value="beneficiario">Beneficiário</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <span className="text-xs text-zinc-400 self-center">
          {total} {total === 1 ? "registro encontrado" : "registros encontrados"}
        </span>
      </div>

      {/* Tabela de Pendências */}
      <Card>
        {loadingPends ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Carregando pendências…</div>
        ) : pendencias.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-400">
            Nenhuma pendência encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Ocorrência / Título</th>
                  <th className="px-4 py-3">Núcleo</th>
                  <th className="px-4 py-3 text-center">Origem</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Gravidade</th>
                  <th className="px-4 py-3 text-center">Prazo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pendencias.map((p) => {
                  const dataHojeIso = new Date().toISOString().slice(0, 10);
                  const prazoVencido = p.prazo && p.status !== "resolvida" && p.prazo < dataHojeIso;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 max-w-sm">
                        <Link
                          href={`/pendencias-gerais/${p.id}`}
                          className="font-bold text-zinc-900 hover:text-sky-600 transition-colors block"
                        >
                          {p.titulo}
                        </Link>
                        {p.descricao && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-xs">
                            {p.descricao}
                          </p>
                        )}
                        {p.providencias && p.status === "resolvida" && (
                          <p className="text-[10px] text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 mt-1 inline-block truncate max-w-xs">
                            ✓ Providência: {p.providencias}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-700">
                        {p.nucleo?.identificacao || "Núcleo"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {p.supervisaoId ? (
                          <Badge tone="violet" className="text-[10px] font-semibold">
                            Supervisão
                          </Badge>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Avulsa</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-zinc-500 capitalize">
                        {p.tipo}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge tone={gravidadeTone[p.gravidade] ?? "zinc"} className="font-semibold uppercase text-[10px]">
                          {p.gravidade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        {p.prazo ? (
                          <span className={prazoVencido ? "text-red-600 font-bold" : "text-zinc-600"}>
                            {formatarData(p.prazo)}
                            {prazoVencido && <span className="block text-[9px]">Vencido</span>}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge tone={statusTone[p.status] ?? "zinc"} className="font-semibold">
                          {statusLabel[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== "resolvida" && p.status !== "cancelada" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendenciaParaResolver(p);
                                setProvidenciasTexto("");
                                setObsResolucaoTexto("");
                              }}
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Resolver
                            </button>
                          )}
                          <Link
                            href={`/pendencias-gerais/${p.id}`}
                            className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition-colors inline-flex items-center gap-1"
                          >
                            Detalhes <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100">
            <Pagination
              currentPage={pagina}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={PER_PAGE}
              onPageChange={setPagina}
            />
          </div>
        )}
      </Card>

      {/* Modal de Resolução Rápida */}
      {pendenciaParaResolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Registrar Resolução da Pendência
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendenciaParaResolver(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarResolucao} className="p-5 flex flex-col gap-4">
              <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200 text-xs">
                <p className="font-semibold text-zinc-800">{pendenciaParaResolver.titulo}</p>
                <p className="text-zinc-500 mt-0.5">
                  Núcleo: {pendenciaParaResolver.nucleo?.identificacao || "—"} • Tipo: {pendenciaParaResolver.tipo}
                </p>
                {pendenciaParaResolver.descricao && (
                  <p className="text-zinc-400 text-[11px] mt-1 border-t border-zinc-200 pt-1">
                    {pendenciaParaResolver.descricao}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Providências Tomadas <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={providenciasTexto}
                  onChange={(e) => setProvidenciasTexto(e.target.value)}
                  placeholder="Descreva o que foi feito para solucionar esta pendência..."
                  required
                  className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Observações Adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  value={obsResolucaoTexto}
                  onChange={(e) => setObsResolucaoTexto(e.target.value)}
                  placeholder="Informações complementares sobre a resolução..."
                  className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setPendenciaParaResolver(null)}
                  disabled={salvandoResolucao}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoResolucao}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {salvandoResolucao ? "Salvando…" : "Confirmar e Resolver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
