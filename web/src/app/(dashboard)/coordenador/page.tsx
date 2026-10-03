"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  AlertCircle,
  Package,
  Plus,
  ClipboardList,
  GraduationCap,
  Users,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  supervisoesApi,
  pendenciasGeraisApi,
  estoqueNucleosApi,
  type NucleoApi,
} from "@/lib/api/services";
import { Card, Badge, LinkButton } from "@/components/ui";
import { EstoqueAlertBadge } from "@/components/estoque/EstoqueAlertBadge";
import { formatarData } from "@/lib/utils";

const gravidadeTone: Record<string, "zinc" | "amber" | "red"> = {
  baixa: "zinc",
  media: "amber",
  alta: "amber",
  critica: "red",
};

export default function PainelCoordenadorPage() {
  const { user } = useAuth();
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("todos");

  const hoje = useMemo(() => new Date(), []);
  const primeiroDiaMes = useMemo(() => {
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, [hoje]);

  const ultimoDiaMes = useMemo(() => {
    const y = hoje.getFullYear();
    const m = hoje.getMonth() + 1;
    const ultimo = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
  }, [hoje]);

  const nomeMesAtual = useMemo(() => {
    return hoje.toLocaleDateString("pt-BR", { month: "long" });
  }, [hoje]);

  // Núcleos atribuídos ao coordenador
  const { data: meusNucleos, loading: loadingNucleos } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  const todosNucleoIds = useMemo(() => {
    return (meusNucleos ?? []).map((n) => n.id);
  }, [meusNucleos]);

  // Filtro atual
  const nucleoIdsFiltrados = useMemo(() => {
    if (!meusNucleos || meusNucleos.length === 0) return [];
    if (nucleoSelecionadoId === "todos") return todosNucleoIds;
    return [nucleoSelecionadoId];
  }, [meusNucleos, nucleoSelecionadoId, todosNucleoIds]);

  const nucleoAtivoUnico = useMemo(() => {
    if (nucleoSelecionadoId === "todos") return null;
    return (meusNucleos ?? []).find((n) => n.id === nucleoSelecionadoId) ?? null;
  }, [meusNucleos, nucleoSelecionadoId]);

  // 1. Supervisões recentes (para o filtro ativo)
  const { data: supsRecentesData, loading: loadingSups } = useQuery(
    () =>
      nucleoIdsFiltrados.length > 0
        ? supervisoesApi.list({ nucleoIds: nucleoIdsFiltrados, limit: 6 })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 6 }),
    [JSON.stringify(nucleoIdsFiltrados)],
  );

  // 2. Supervisões finalizadas no mês atual (para contar meta do mês)
  const { data: supsMesData } = useQuery(
    () =>
      nucleoIdsFiltrados.length > 0
        ? supervisoesApi.list({
            nucleoIds: nucleoIdsFiltrados,
            status: "finalizada",
            dataInicio: primeiroDiaMes,
            dataFim: ultimoDiaMes,
            limit: 100,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    [JSON.stringify(nucleoIdsFiltrados), primeiroDiaMes, ultimoDiaMes],
  );

  // 3. Todas as supervisões finalizadas dos meus núcleos (para saber última supervisão de cada núcleo no quadro geral)
  const { data: todasSupsFinalizadasData } = useQuery(
    () =>
      todosNucleoIds.length > 0
        ? supervisoesApi.list({
            nucleoIds: todosNucleoIds,
            status: "finalizada",
            limit: 100,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    [JSON.stringify(todosNucleoIds)],
  );

  // 4. Pendências em aberto (para o filtro ativo)
  const { data: pendsData, loading: loadingPends } = useQuery(
    () =>
      nucleoIdsFiltrados.length > 0
        ? pendenciasGeraisApi.list({
            nucleoIds: nucleoIdsFiltrados,
            status: "aberta",
            limit: 6,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 6 }),
    [JSON.stringify(nucleoIdsFiltrados)],
  );

  // 5. Todas as pendências abertas (para badge em cada núcleo no quadro)
  const { data: todasPendsAbertasData } = useQuery(
    () =>
      todosNucleoIds.length > 0
        ? pendenciasGeraisApi.list({
            nucleoIds: todosNucleoIds,
            status: "aberta",
            limit: 200,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 200 }),
    [JSON.stringify(todosNucleoIds)],
  );

  // 6. Alertas de estoque para os núcleos ativos
  const { data: estoqueData } = useQuery(
    async () => {
      if (nucleoIdsFiltrados.length === 0) return [];
      const arrays = await Promise.all(
        nucleoIdsFiltrados.map((id) => estoqueNucleosApi.listByNucleo(id).catch(() => [])),
      );
      return arrays.flat();
    },
    [JSON.stringify(nucleoIdsFiltrados)],
  );

  const supervisoesRecentes = (supsRecentesData as any)?.data ?? [];
  const supervisoesMes = (supsMesData as any)?.data ?? [];
  const todasSupsFinalizadas = (todasSupsFinalizadasData as any)?.data ?? [];

  const pendencias = (pendsData as any)?.data ?? [];
  const totalPendenciasAbertas = (pendsData as any)?.total ?? pendencias.length;
  const todasPendenciasAbertas = (todasPendsAbertasData as any)?.data ?? [];

  const pendenciasCriticas = pendencias.filter(
    (p: any) => p.gravidade === "critica" || p.gravidade === "alta",
  ).length;

  const estoque = (estoqueData as any) ?? [];
  const alertasEstoque = estoque.filter(
    (e: any) => e.material && e.quantidadeAtual < e.material.estoqueMinimo,
  );

  // Cálculo da cobertura de supervisão no mês para os núcleos
  const nucleosComSupervisaoNoMes = useMemo(() => {
    const ids = new Set(supervisoesMes.map((s: any) => s.nucleoId));
    return ids;
  }, [supervisoesMes]);

  const coberturaPercent = useMemo(() => {
    const total = nucleoIdsFiltrados.length;
    if (total === 0) return 0;
    const cobertos = nucleoIdsFiltrados.filter((id) => nucleosComSupervisaoNoMes.has(id)).length;
    return Math.round((cobertos / total) * 100);
  }, [nucleoIdsFiltrados, nucleosComSupervisaoNoMes]);

  if (loadingNucleos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-sm text-zinc-400">Carregando painel do coordenador…</div>
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
          Não há núcleos sob sua responsabilidade cadastrados. Entre em contato com a coordenação geral ou administração.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header com Saudação e Seletor de Núcleos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Olá, {user?.nome?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Coordenação de Campo • {meusNucleos.length}{" "}
            {meusNucleos.length === 1 ? "núcleo sob sua responsabilidade" : "núcleos sob sua responsabilidade"}
          </p>
        </div>

        {/* Seletor de visualização */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-zinc-500 hidden sm:block">Visualizar:</label>
          <select
            value={nucleoSelecionadoId}
            onChange={(e) => setNucleoSelecionadoId(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {meusNucleos.length > 1 && (
              <option value="todos">Todos os meus núcleos ({meusNucleos.length})</option>
            )}
            {meusNucleos.map((n) => (
              <option key={n.id} value={n.id}>
                📍 {n.identificacao} {n.regiao ? `(${n.regiao})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Métricas Reais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Supervisões no Mês */}
        <Card className="hover:border-zinc-300 transition-colors">
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Supervisões no Mês
              </span>
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <ClipboardCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900">
                  {supervisoesMes.length}
                </span>
                <span className="text-xs text-zinc-500">realizadas</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 capitalize">
                Mês de {nomeMesAtual}
              </p>
            </div>
          </div>
        </Card>

        {/* Card 2: Cobertura dos Núcleos no Mês */}
        <Card className="hover:border-zinc-300 transition-colors">
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Cobertura no Mês
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {nucleosComSupervisaoNoMes.size}
                </span>
                <span className="text-sm font-semibold text-zinc-400">
                  / {nucleoIdsFiltrados.length}
                </span>
                <span className="text-xs text-zinc-500 ml-1">núcleos</span>
              </div>
              {/* Barra de progresso */}
              <div className="mt-2 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${coberturaPercent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Pendências em Aberto */}
        <Card className="hover:border-zinc-300 transition-colors">
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Pendências em Aberto
              </span>
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-600">
                  {totalPendenciasAbertas}
                </span>
                {pendenciasCriticas > 0 && (
                  <Badge tone="red" className="text-[10px] font-bold">
                    {pendenciasCriticas} críticas
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Aguardando resolução técnica
              </p>
            </div>
          </div>
        </Card>

        {/* Card 4: Alertas de Estoque */}
        <Card className="hover:border-zinc-300 transition-colors">
          <div className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Alertas de Estoque
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold ${
                    alertasEstoque.length > 0 ? "text-amber-600" : "text-zinc-800"
                  }`}
                >
                  {alertasEstoque.length}
                </span>
                <span className="text-xs text-zinc-500">itens críticos</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Abaixo do estoque mínimo
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quadro de Status dos Núcleos no Mês Atual */}
      <Card>
        <div className="px-5 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-600" />
              Acompanhamento dos Núcleos • {nomeMesAtual}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Controle de supervisões mensais obrigatórias e pendências por localidade
            </p>
          </div>
          <LinkButton href="/supervisoes/nova" variant="primary" className="shrink-0 text-xs py-1.5">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nova Supervisão
          </LinkButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3">Núcleo</th>
                <th className="px-4 py-3">Região / Cidade</th>
                <th className="px-4 py-3 text-center">Status neste Mês</th>
                <th className="px-4 py-3 text-center">Última Supervisão</th>
                <th className="px-4 py-3 text-center">Pendências</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(nucleoAtivoUnico ? [nucleoAtivoUnico] : meusNucleos).map((n) => {
                const supNoMes = supervisoesMes.find((s: any) => s.nucleoId === n.id);
                const ultSup = todasSupsFinalizadas.find((s: any) => s.nucleoId === n.id);
                const pendsNucleo = todasPendenciasAbertas.filter((p: any) => p.nucleoId === n.id);

                return (
                  <tr key={n.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-zinc-900">
                      <Link href={`/nucleos/${n.id}`} className="hover:text-sky-600 transition-colors">
                        {n.identificacao}
                      </Link>
                      {n.nomeLocal && (
                        <p className="text-[11px] font-normal text-zinc-400 truncate max-w-xs">{n.nomeLocal}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-600">
                      <span>{n.regiao || "—"}</span>
                      {n.cidade && <span className="text-zinc-400 ml-1">({n.cidade})</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {supNoMes ? (
                        <Badge tone="green" className="font-semibold">
                          ✓ Supervisionado ({formatarData(supNoMes.dataSupervisao)})
                        </Badge>
                      ) : (
                        <Badge tone="amber" className="font-semibold">
                          ⏳ Pendente no mês
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-600">
                      {ultSup ? (
                        <span className="font-mono">{formatarData(ultSup.dataSupervisao)}</span>
                      ) : (
                        <span className="text-zinc-400 italic">Sem registros</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {pendsNucleo.length > 0 ? (
                        <Badge tone="red" className="font-bold">
                          {pendsNucleo.length} {pendsNucleo.length === 1 ? "aberta" : "abertas"}
                        </Badge>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/supervisoes/nova?nucleoId=${n.id}`}
                          className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
                        >
                          Supervisionar
                        </Link>
                        <Link
                          href={`/nucleos/${n.id}`}
                          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Grid de Supervisões Recentes e Pendências Abertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Supervisões Recentes */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-violet-500" />
                Supervisões Recentes
              </h2>
              <LinkButton href="/supervisoes/nova" variant="secondary" className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Nova
              </LinkButton>
            </div>
            <div className="divide-y divide-zinc-100">
              {loadingSups ? (
                <p className="px-5 py-6 text-sm text-zinc-400 text-center">Carregando supervisões…</p>
              ) : supervisoesRecentes.length === 0 ? (
                <p className="px-5 py-6 text-sm text-zinc-400 italic text-center">
                  Nenhuma supervisão registrada recentemente.
                </p>
              ) : (
                supervisoesRecentes.map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/supervisoes/${s.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        {s.nucleos?.identificacao || "Núcleo"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span className="font-mono">{formatarData(s.dataSupervisao)}</span>
                        {s.horaEntrada && <span>• {s.horaEntrada}</span>}
                      </div>
                    </div>
                    <Badge tone={s.status === "finalizada" ? "green" : "amber"}>
                      {s.status === "finalizada" ? "Finalizada" : "Rascunho"}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 rounded-b-xl">
            <Link
              href={nucleoAtivoUnico ? `/supervisoes?nucleoId=${nucleoAtivoUnico.id}` : "/supervisoes"}
              className="text-xs text-sky-600 hover:underline font-semibold flex items-center gap-1"
            >
              Ver todas as supervisões <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Coluna 2: Pendências em Aberto */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Pendências em Aberto
              </h2>
              <LinkButton href="/pendencias-gerais/nova" variant="secondary" className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Nova
              </LinkButton>
            </div>
            <div className="divide-y divide-zinc-100">
              {loadingPends ? (
                <p className="px-5 py-6 text-sm text-zinc-400 text-center">Carregando pendências…</p>
              ) : pendencias.length === 0 ? (
                <p className="px-5 py-6 text-sm text-zinc-400 italic text-center">
                  Nenhuma pendência em aberto. Tudo em dia! 🎉
                </p>
              ) : (
                pendencias.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/pendencias-gerais/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-medium text-zinc-800 truncate">{p.titulo}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span>{p.nucleos?.identificacao || "Núcleo"}</span>
                        {p.prazo && <span>• Prazo: {formatarData(p.prazo)}</span>}
                      </div>
                    </div>
                    <Badge tone={gravidadeTone[p.gravidade] ?? "zinc"} className="shrink-0 uppercase text-[10px]">
                      {p.gravidade}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 rounded-b-xl">
            <Link
              href={
                nucleoAtivoUnico
                  ? `/pendencias-gerais?nucleoId=${nucleoAtivoUnico.id}`
                  : "/pendencias-gerais"
              }
              className="text-xs text-sky-600 hover:underline font-semibold flex items-center gap-1"
            >
              Ver todas as pendências <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Alertas de Estoque Crítico (se houver) */}
      {alertasEstoque.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              Estoque Crítico nos Núcleos
            </h2>
            <LinkButton
              href="/coordenador/estoque"
              variant="secondary"
              className="text-xs"
            >
              Ver Estoque Completo
            </LinkButton>
          </div>
          <div className="divide-y divide-zinc-100">
            {alertasEstoque.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{item.material?.nome ?? "—"}</p>
                  <p className="text-xs text-zinc-400">{item.nucleo?.identificacao || "Núcleo"}</p>
                </div>
                <EstoqueAlertBadge item={item} showQty />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ações e Atalhos Operacionais do Coordenador */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Ações e Acessos Rápidos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Nova Supervisão", href: "/supervisoes/nova", icon: ClipboardCheck, cor: "text-violet-600" },
            { label: "Relatório Mensal", href: "/supervisoes/relatorio-mensal", icon: ClipboardList, cor: "text-emerald-600" },
            { label: "Turmas & Horários", href: "/turmas", icon: GraduationCap, cor: "text-sky-600" },
            { label: "Beneficiários", href: "/beneficiarios", icon: Users, cor: "text-blue-600" },
            { label: "Pendências", href: "/pendencias-gerais", icon: AlertCircle, cor: "text-red-600" },
            { label: "Estoque", href: "/coordenador/estoque", icon: Package, cor: "text-amber-600" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 px-3 text-center hover:border-sky-300 hover:shadow-sm transition-all group"
            >
              <a.icon className={`h-5 w-5 ${a.cor} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-semibold text-zinc-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
