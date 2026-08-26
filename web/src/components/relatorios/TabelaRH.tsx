"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge, Card, CardBody, CardHeader, Button } from "@/components/ui";
import {
  funcionariosApi,
  nucleosApi,
  funcoesApi,
  type FuncionarioApi,
  type NucleoApi,
  type FuncaoApi,
} from "@/lib/api/services";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@/lib/hooks/useQuery";
import { formatarData } from "@/lib/utils";
import type { FiltrosState } from "./FiltrosRelatorio";
import {
  Users,
  Award,
  Clock,
  Briefcase,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface Props {
  filtros: FiltrosState;
}

const STATUS_TONE: Record<string, "green" | "zinc" | "red" | "amber"> = {
  contratado: "green",
  voluntario: "sky" as "green",
  demitido: "red",
  pendente: "amber",
  licenca_medica: "zinc",
  licenca_maternidade: "zinc",
  afastado_inss: "zinc",
};

const STATUS_LABEL: Record<string, string> = {
  contratado: "Contratado",
  voluntario: "Voluntário",
  demitido: "Demitido",
  pendente: "Pendente",
  licenca_medica: "Lic. Médica",
  licenca_maternidade: "Lic. Maternidade",
  afastado_inss: "Afastado INSS",
};

type CategoriaFuncao = "professor" | "coordenador" | "social_tecnico" | "operacional";

function classificarCategoria(f: FuncionarioApi, funcaoObj?: FuncaoApi): CategoriaFuncao {
  const nomeFuncao = (funcaoObj?.nome || f.funcao || "").toLowerCase();

  if (f.professorResponsavel || nomeFuncao.includes("professor") || nomeFuncao.includes("instrutor") || nomeFuncao.includes("educador") || nomeFuncao.includes("técnico esportivo") || nomeFuncao.includes("treinador")) {
    return "professor";
  }
  if (nomeFuncao.includes("coordenad") || nomeFuncao.includes("diretor") || nomeFuncao.includes("gestor")) {
    return "coordenador";
  }
  if (nomeFuncao.includes("social") || nomeFuncao.includes("psicól") || nomeFuncao.includes("nutri") || nomeFuncao.includes("fisioter") || nomeFuncao.includes("pedagog")) {
    return "social_tecnico";
  }
  return "operacional";
}

const CATEGORIA_LABEL: Record<CategoriaFuncao, string> = {
  professor: "Professor / Instrutor",
  coordenador: "Coordenação",
  social_tecnico: "Apoio Técnico / Social",
  operacional: "Apoio Operacional",
};

const CATEGORIA_TONE: Record<CategoriaFuncao, "sky" | "green" | "amber" | "zinc"> = {
  professor: "sky",
  coordenador: "green",
  social_tecnico: "amber",
  operacional: "zinc",
};

export function TabelaRH({ filtros }: Props) {
  // ── 1. CARREGAR FUNCIONÁRIOS, NÚCLEOS E FUNÇÕES ──────────────────────────
  const { data: funcRes, loading: loadingFunc } = useQuery(
    () => funcionariosApi.list({ limit: 300 }),
    []
  );
  const { data: nucRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const { data: funcObjRes } = useQuery(() => funcoesApi.list(), []);

  const funcionarios = funcRes?.data ?? [];
  const nucleos = nucRes?.data ?? [];
  const funcoes = funcObjRes ?? [];

  // Estados locais para dados dinâmicos do período
  const [aulasPorProfessor, setAulasPorProfessor] = useState<Record<string, number>>({});
  const [supervisoesPorCoordenador, setSupervisoesPorCoordenador] = useState<Record<string, number>>({});
  const [pontoResumo, setPontoResumo] = useState<Record<string, { diasTrabalhados: number; minutosTotais: number }>>({});
  const [loadingPeriodo, setLoadingPeriodo] = useState<boolean>(true);

  // Filtros locais e visão
  const [modoVisao, setModoVisao] = useState<"quadro" | "produtividade">("quadro");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [busca, setBusca] = useState<string>("");

  // ── 2. CARREGAR PONTO, AULAS E SUPERVISÕES DO PERÍODO DO BANCO ──────────
  useEffect(() => {
    let cancelado = false;
    setLoadingPeriodo(true);
    const sb = createClient();

    async function carregarMetricasPeriodo() {
      try {
        // 1. Buscar Aulas ministradas por professor no período
        let qAulas = sb.from("execucoes_aula").select("id, professor_id, data");
        if (filtros.dataInicio) qAulas = qAulas.gte("data", filtros.dataInicio);
        if (filtros.dataFim) qAulas = qAulas.lte("data", filtros.dataFim);

        const { data: aulasData } = await qAulas;
        const mapaAulas: Record<string, number> = {};
        for (const a of (aulasData || []) as any[]) {
          if (a.professor_id) {
            mapaAulas[a.professor_id] = (mapaAulas[a.professor_id] || 0) + 1;
          }
        }

        // 2. Buscar Supervisões realizadas por coordenador no período
        let qSup = sb.from("supervisoes").select("id, coordenador_id, data");
        if (filtros.dataInicio) qSup = qSup.gte("data", filtros.dataInicio);
        if (filtros.dataFim) qSup = qSup.lte("data", filtros.dataFim);

        const { data: supData } = await qSup;
        const mapaSup: Record<string, number> = {};
        for (const s of (supData || []) as any[]) {
          if (s.coordenador_id) {
            mapaSup[s.coordenador_id] = (mapaSup[s.coordenador_id] || 0) + 1;
          }
        }

        // 3. Buscar Registros de Ponto no período
        let qPonto = sb.from("registros_ponto").select("funcionario_id, data, hora, tipo");
        if (filtros.dataInicio) qPonto = qPonto.gte("data", filtros.dataInicio);
        if (filtros.dataFim) qPonto = qPonto.lte("data", filtros.dataFim);

        const { data: pontoData } = await qPonto;
        const mapaPonto: Record<string, { diasSet: Set<string>; minutosTotais: number; entradaPorDia: Record<string, string> }> = {};

        for (const p of (pontoData || []) as any[]) {
          if (!p.funcionario_id) continue;
          if (!mapaPonto[p.funcionario_id]) {
            mapaPonto[p.funcionario_id] = {
              diasSet: new Set(),
              minutosTotais: 0,
              entradaPorDia: {},
            };
          }
          mapaPonto[p.funcionario_id].diasSet.add(p.data);

          if (p.tipo === "entrada") {
            mapaPonto[p.funcionario_id].entradaPorDia[p.data] = p.hora;
          } else if (p.tipo === "saida") {
            const entrada = mapaPonto[p.funcionario_id].entradaPorDia[p.data];
            if (entrada && p.hora) {
              const [hE, mE] = entrada.split(":").map(Number);
              const [hS, mS] = p.hora.split(":").map(Number);
              const diffMinutos = (hS * 60 + mS) - (hE * 60 + mE);
              if (diffMinutos > 0) {
                mapaPonto[p.funcionario_id].minutosTotais += diffMinutos;
              }
            }
          }
        }

        const mapaPontoFinal: Record<string, { diasTrabalhados: number; minutosTotais: number }> = {};
        for (const [funcId, val] of Object.entries(mapaPonto)) {
          mapaPontoFinal[funcId] = {
            diasTrabalhados: val.diasSet.size,
            minutosTotais: val.minutosTotais,
          };
        }

        if (!cancelado) {
          setAulasPorProfessor(mapaAulas);
          setSupervisoesPorCoordenador(mapaSup);
          setPontoResumo(mapaPontoFinal);
        }
      } catch (err) {
        console.error("Erro ao carregar métricas de RH do período:", err);
      } finally {
        if (!cancelado) setLoadingPeriodo(false);
      }
    }

    carregarMetricasPeriodo();

    return () => {
      cancelado = true;
    };
  }, [filtros.dataInicio, filtros.dataFim]);

  // ── 3. PROCESSAMENTO DAS LINHAS ──────────────────────────────────────────
  const linhas = useMemo(() => {
    return funcionarios
      .filter((f) => {
        // Filtro por núcleo
        if (filtros.nucleoId && f.nucleoId !== filtros.nucleoId) return false;

        // Filtro por categoria
        const funcaoObj = funcoes.find((fn) => fn.id === f.funcaoId || fn.nome === f.funcao);
        const categoria = classificarCategoria(f, funcaoObj);
        if (categoriaFiltro && categoria !== categoriaFiltro) return false;

        // Busca textual por Nome, CPF ou Conselho
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const nomeOk = f.nomeCompleto.toLowerCase().includes(termo);
          const cpfOk = f.cpf ? f.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "")) : false;
          const conselhoOk = f.registroConselho?.toLowerCase().includes(termo) || false;
          if (!nomeOk && !cpfOk && !conselhoOk) return false;
        }

        return true;
      })
      .map((f) => {
        const nucleo = nucleos.find((n) => n.id === f.nucleoId);
        const funcaoObj = funcoes.find((fn) => fn.id === f.funcaoId || fn.nome === f.funcao);
        const categoria = classificarCategoria(f, funcaoObj);

        // Cálculo da carga horária contratual semanal
        const jornada = f.jornada ?? [];
        const diasTrabalhadosSemana = jornada.filter((d: any) => d.trabalha).length;
        const minutosSemanais = jornada
          .filter((d: any) => d.trabalha && d.entrada && d.saida)
          .reduce((acc: number, d: any) => {
            const [hE, mE] = (d.entrada ?? "0:0").split(":").map(Number);
            const [hS, mS] = (d.saida ?? "0:0").split(":").map(Number);
            return acc + (hS * 60 + mS - (hE * 60 + mE));
          }, 0);

        const horasSemanaisNum = Math.floor(minutosSemanais / 60);
        const cargaHorariaFormatada = horasSemanaisNum > 0 ? `${horasSemanaisNum}h/sem` : "—";

        // Métricas do período
        const aulasMinistradas = aulasPorProfessor[f.id] ?? 0;
        const supervisoesRealizadas = supervisoesPorCoordenador[f.id] ?? 0;
        const ponto = pontoResumo[f.id];
        const diasPonto = ponto?.diasTrabalhados ?? 0;
        const horasCumpridasNum = ponto ? Math.floor(ponto.minutosTotais / 60) : 0;
        const minutosRestantes = ponto ? ponto.minutosTotais % 60 : 0;
        const horasCumpridasFormatada = ponto && ponto.minutosTotais > 0 ? `${horasCumpridasNum}h ${minutosRestantes}m` : `${diasPonto} dia(s)`;

        const temAtividadePeriodo = aulasMinistradas > 0 || supervisoesRealizadas > 0 || diasPonto > 0;

        return {
          f,
          nucleo,
          funcaoObj,
          categoria,
          diasTrabalhadosSemana,
          horasSemanaisNum,
          cargaHorariaFormatada,
          aulasMinistradas,
          supervisoesRealizadas,
          diasPonto,
          horasCumpridasFormatada,
          temAtividadePeriodo,
        };
      });
  }, [
    funcionarios,
    nucleos,
    funcoes,
    aulasPorProfessor,
    supervisoesPorCoordenador,
    pontoResumo,
    filtros.nucleoId,
    categoriaFiltro,
    busca,
  ]);

  // ── 4. KPIS DINÂMICOS ───────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = linhas.length;
    const professores = linhas.filter((l) => l.categoria === "professor").length;
    const coordenacao = linhas.filter((l) => l.categoria === "coordenador" || l.categoria === "social_tecnico").length;
    const totalHorasSemanais = linhas.reduce((acc, l) => acc + l.horasSemanaisNum, 0);

    return {
      total,
      professores,
      coordenacao,
      totalHorasSemanais,
    };
  }, [linhas]);

  // Exportar CSV
  function handleExportarCsv() {
    const headers = [
      "Profissional",
      "CPF",
      "Categoria",
      "Função",
      "Núcleo",
      "Carga Horária Semanal",
      "Remuneração",
      "Aulas no Período",
      "Supervisões no Período",
      "Dias de Ponto",
      "Status",
    ];

    const rows = linhas.map((l) => [
      `"${l.f.nomeCompleto}"`,
      `"${l.f.cpf || ""}"`,
      `"${CATEGORIA_LABEL[l.categoria]}"`,
      `"${l.f.funcao || l.funcaoObj?.nome || "—"}"`,
      `"${l.nucleo?.identificacao || l.f.alocadoEm || "—"}"`,
      `"${l.cargaHorariaFormatada}"`,
      `"${l.f.remuneracao || "—"}"`,
      l.aulasMinistradas,
      l.supervisoesRealizadas,
      l.diasPonto,
      `"${STATUS_LABEL[l.f.status] || l.f.status}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relatorio_RH_${filtros.dataInicio || "inicio"}_${filtros.dataFim || "fim"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── PAINEL DE KPIS DE RECURSOS HUMANOS ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Total Ativos */}
        <Card className="border-sky-200 bg-sky-50/50">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
              <span>Profissionais Ativos</span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-sky-950">{kpis.total}</span>
              <span className="text-[11px] text-sky-700 font-medium">no quadro</span>
            </div>
            <p className="text-[11px] text-sky-600 mt-1">Equipe multidisciplinar</p>
          </CardBody>
        </Card>

        {/* Card 2: Professores / Instrutores */}
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Professores / Campo</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-950">{kpis.professores}</span>
              <span className="text-[11px] text-emerald-700 font-medium">educadores</span>
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Com turmas vinculadas</p>
          </CardBody>
        </Card>

        {/* Card 3: Coordenação & Técnico */}
        <Card className="border-amber-200 bg-amber-50/40">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <span>Coordenação & Técnico</span>
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-950">{kpis.coordenacao}</span>
              <span className="text-[11px] text-amber-800 font-medium">gestores/sociais</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">Supervisão e assistência</p>
          </CardBody>
        </Card>

        {/* Card 4: Carga Horária Total Semanal */}
        <Card className="border-zinc-200 bg-white">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span>Carga Horária Total</span>
              <Clock className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900">{kpis.totalHorasSemanais}h</span>
              <span className="text-[11px] text-zinc-500 font-medium">/ semana</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Soma das escalas ativas</p>
          </CardBody>
        </Card>
      </div>

      {/* ── BARRA DE FERRAMENTAS E FILTROS DE CATEGORIA ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Visão */}
          <div className="flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
            <button
              type="button"
              onClick={() => setModoVisao("quadro")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoVisao === "quadro"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Quadro Funcional
            </button>
            <button
              type="button"
              onClick={() => setModoVisao("produtividade")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoVisao === "produtividade"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Produtividade & Ponto ({filtros.dataInicio ? `${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}` : "Período"})
            </button>
          </div>

          {/* Filtro de Categoria de Função */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 h-8"
          >
            <option value="">Todas as Categorias</option>
            <option value="professor">Professores / Instrutores</option>
            <option value="coordenador">Coordenação</option>
            <option value="social_tecnico">Apoio Técnico / Social</option>
            <option value="operacional">Apoio Operacional</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 sm:w-60"
            />
          </div>

          {/* Botão Exportar CSV */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* ── TABELA PRINCIPAL DE RH ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-800">
                {modoVisao === "quadro"
                  ? "Quadro de Recursos Humanos e Escala Semanal"
                  : "Assiduidade e Entregas Operacionais do Período"}
              </h3>
            </div>
            <span className="text-xs text-zinc-500">{linhas.length} profissional(is)</span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {loadingFunc || loadingPeriodo ? (
            <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
              Compilando quadro funcional, escalas e registros de ponto...
            </div>
          ) : linhas.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              Nenhum profissional encontrado com os filtros selecionados.
            </div>
          ) : modoVisao === "quadro" ? (
            /* ── VISÃO 1: QUADRO FUNCIONAL ─────────────────────────────────── */
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Núcleo / Alocação</th>
                  <th className="px-4 py-3 text-center">Carga Horária</th>
                  <th className="px-4 py-3">Remuneração</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {linhas.map(({ f, nucleo, funcaoObj, categoria, cargaHorariaFormatada }) => (
                  <tr key={f.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{f.nomeCompleto}</div>
                      {f.cpf && <div className="text-[11px] text-zinc-400 font-mono">{f.cpf}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={CATEGORIA_TONE[categoria]}>
                        {CATEGORIA_LABEL[categoria]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-700">
                      {f.funcao || funcaoObj?.nome || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {nucleo?.identificacao || f.alocadoEm || "Todos os Núcleos"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-800">
                      {cargaHorariaFormatada}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 font-medium">
                      {f.remuneracao ? (
                        <span className="font-mono text-zinc-800">{f.remuneracao}</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={STATUS_TONE[f.status] ?? "zinc"}>
                        {STATUS_LABEL[f.status] ?? f.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* ── VISÃO 2: PRODUTIVIDADE & PONTO NO PERÍODO ──────────────────── */
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Núcleo</th>
                  <th className="px-4 py-3 text-center">Entregas no Período</th>
                  <th className="px-4 py-3 text-center">Dias com Ponto</th>
                  <th className="px-4 py-3 text-center">Horas Registradas</th>
                  <th className="px-4 py-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {linhas.map(
                  ({
                    f,
                    nucleo,
                    categoria,
                    aulasMinistradas,
                    supervisoesRealizadas,
                    diasPonto,
                    horasCumpridasFormatada,
                    temAtividadePeriodo,
                  }) => (
                    <tr key={f.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900">{f.nomeCompleto}</div>
                        <div className="text-[11px] text-zinc-500">{f.funcao || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={CATEGORIA_TONE[categoria]}>
                          {CATEGORIA_LABEL[categoria]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {nucleo?.identificacao || f.alocadoEm || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {categoria === "professor" && (
                          <div className="font-bold text-emerald-700">
                            {aulasMinistradas} aula(s) ministrada(s)
                          </div>
                        )}
                        {categoria === "coordenador" && (
                          <div className="font-bold text-sky-700">
                            {supervisoesRealizadas} visita(s) de supervisão
                          </div>
                        )}
                        {categoria !== "professor" && categoria !== "coordenador" && (
                          <span className="text-zinc-500 font-medium">Apoio em atividade</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-zinc-800">
                        {diasPonto} dia(s)
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-zinc-700">
                        {horasCumpridasFormatada}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {temAtividadePeriodo ? (
                          <Badge tone="green">Atividade Registrada</Badge>
                        ) : (
                          <Badge tone="zinc">Sem Ponto no Período</Badge>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
