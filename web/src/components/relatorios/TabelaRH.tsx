"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge, Card, CardBody, CardHeader, Button } from "@/components/ui";
import {
  funcionariosApi,
  nucleosApi,
  funcoesApi,
  turmasApi,
  type FuncionarioApi,
  type NucleoApi,
  type FuncaoApi,
  type TurmaApi,
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
  Building2,
  Calendar,
} from "lucide-react";

interface Props {
  filtros: FiltrosState;
}

// UUIDs estritos de cargos e perfis
export const PERFIL_PROFESSOR_ID = "b9def33a-a2a0-477d-8580-ec213d642808";
export const FUNCAO_PROFESSOR_ID = "08532962-35c8-470b-aa7b-9ed41b8dcc38";

export const PERFIL_COORDENADOR_NUCLEO_ID = "1bea5f77-95ef-4969-bf87-4cd4647f6c0a";
export const PERFIL_COORDENADOR_INSTRUTORES_ID = "7f9706e8-d9f9-4953-9e1f-e0f7e87b25e3";
export const PERFIL_COORDENADOR_TURMA_ID = "698c2c08-3606-4276-b554-17b576d5d12b";

export const FUNCAO_COORDENADOR_NUCLEO_ID = "6c532ade-7428-4496-bb5a-efe3fc2d1f13";
export const FUNCAO_COORDENADOR_INSTRUTORES_ID = "184562ab-d36f-45f3-9e0d-34265166c8fe";
export const FUNCAO_COORDENADOR_TURMA_ID = "4f8310f4-6884-4df0-8ebf-c09aaaab49d7";

const COORDENADORES_FUNCOES_IDS = [
  FUNCAO_COORDENADOR_NUCLEO_ID,
  FUNCAO_COORDENADOR_INSTRUTORES_ID,
  FUNCAO_COORDENADOR_TURMA_ID,
];

const COORDENADORES_PERFIS_IDS = [
  PERFIL_COORDENADOR_NUCLEO_ID,
  PERFIL_COORDENADOR_INSTRUTORES_ID,
  PERFIL_COORDENADOR_TURMA_ID,
];

const STATUS_TONE: Record<string, "green" | "sky" | "red" | "amber" | "zinc"> = {
  contratado: "green",
  voluntario: "sky",
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
  const isProf =
    f.funcaoId === FUNCAO_PROFESSOR_ID ||
    funcaoObj?.perfilId === PERFIL_PROFESSOR_ID ||
    f.professorResponsavel;
  if (isProf) return "professor";

  const isCoord =
    COORDENADORES_FUNCOES_IDS.includes(f.funcaoId || "") ||
    COORDENADORES_PERFIS_IDS.includes(funcaoObj?.perfilId || "");
  if (isCoord) return "coordenador";

  if (funcaoObj?.exigeConselho) {
    return "social_tecnico";
  }
  return "operacional";
}

const CATEGORIA_LABEL: Record<CategoriaFuncao, string> = {
  professor: "Professor / Instrutor",
  coordenador: "Coordenação",
  social_tecnico: "Apoio Técnico / Saúde",
  operacional: "Apoio Geral / Staff",
};

const CATEGORIA_TONE: Record<CategoriaFuncao, "sky" | "green" | "amber" | "zinc"> = {
  professor: "sky",
  coordenador: "green",
  social_tecnico: "amber",
  operacional: "zinc",
};

export function TabelaRH({ filtros }: Props) {
  // ── 1. CARREGAR FUNCIONÁRIOS, NÚCLEOS, FUNÇÕES E TURMAS ───────────────────
  const { data: funcRes, loading: loadingFunc } = useQuery(
    () => funcionariosApi.list({ limit: 500 }),
    []
  );
  const { data: nucRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const { data: funcObjRes } = useQuery(() => funcoesApi.list(), []);
  const { data: turmasRes } = useQuery(() => turmasApi.list({ limit: 500 }), []);

  const funcionarios = funcRes?.data ?? [];
  const nucleos = nucRes?.data ?? [];
  const funcoes = funcObjRes ?? [];
  const turmas = turmasRes?.data ?? [];

  // Estados para jornadas CLT e métricas dinâmicas do período
  const [jornadasCltMap, setJornadasCltMap] = useState<Record<string, { minutosSemanais: number; diasCount: number }>>({});
  const [aulasPorProfessor, setAulasPorProfessor] = useState<Record<string, number>>({});
  const [supervisoesPorCoordenador, setSupervisoesPorCoordenador] = useState<Record<string, number>>({});
  const [pontoResumo, setPontoResumo] = useState<Record<string, { diasTrabalhados: number; minutosTotais: number }>>({});
  const [loadingPeriodo, setLoadingPeriodo] = useState<boolean>(true);

  // Filtros locais e modo de visão
  const [modoVisao, setModoVisao] = useState<"quadro" | "produtividade">("quadro");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [busca, setBusca] = useState<string>("");

  // ── 2. CARREGAR JORNADAS CLT E DADOS OPERACIONAIS ──────────────────────────
  useEffect(() => {
    let cancelado = false;
    setLoadingPeriodo(true);
    const sb = createClient();

    async function carregarDadosCompletos() {
      try {
        // 1. Buscar todas as jornadas CLT ativas
        const { data: jornadasDb } = await sb
          .from("funcionario_jornada")
          .select("funcionario_id, dia_semana, hora_entrada, hora_saida")
          .eq("ativo", true);

        const mapaJornadas: Record<string, { minutosSemanais: number; diasCount: number }> = {};
        for (const j of (jornadasDb || []) as any[]) {
          if (!j.funcionario_id || !j.hora_entrada || !j.hora_saida) continue;
          if (!mapaJornadas[j.funcionario_id]) {
            mapaJornadas[j.funcionario_id] = { minutosSemanais: 0, diasCount: 0 };
          }
          const [hE, mE] = j.hora_entrada.slice(0, 5).split(":").map(Number);
          const [hS, mS] = j.hora_saida.slice(0, 5).split(":").map(Number);
          let spanMin = (hS * 60 + mS) - (hE * 60 + mE);
          if (spanMin > 360) spanMin -= 60; // Desconto de 1h de almoço para jornadas CLT > 6h
          if (spanMin > 0) {
            mapaJornadas[j.funcionario_id].minutosSemanais += spanMin;
            mapaJornadas[j.funcionario_id].diasCount += 1;
          }
        }

        // 2. Buscar Aulas ministradas por professor no período
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

        // 3. Buscar Supervisões realizadas por coordenador no período
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

        // 4. Buscar Registros de Ponto no período
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
              let diffMinutos = (hS * 60 + mS) - (hE * 60 + mE);
              if (diffMinutos > 360) diffMinutos -= 60; // Desconto de almoço se > 6h
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
          setJornadasCltMap(mapaJornadas);
          setAulasPorProfessor(mapaAulas);
          setSupervisoesPorCoordenador(mapaSup);
          setPontoResumo(mapaPontoFinal);
        }
      } catch (err) {
        console.error("Erro ao carregar dados operacionais de RH:", err);
      } finally {
        if (!cancelado) setLoadingPeriodo(false);
      }
    }

    carregarDadosCompletos();

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

        // Filtro por status
        if (filtros.status && f.status !== filtros.status) return false;

        // Filtro por categoria
        const funcaoObj = funcoes.find((fn) => fn.id === f.funcaoId);
        const categoria = classificarCategoria(f, funcaoObj);
        if (categoriaFiltro && categoria !== categoriaFiltro) return false;

        // Busca textual por Nome, Matrícula, CPF ou Conselho
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const nomeOk = f.nomeCompleto.toLowerCase().includes(termo);
          const matOk = f.matricula?.toLowerCase().includes(termo) || false;
          const cpfOk = f.cpf ? f.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "")) : false;
          const conselhoOk = f.registroConselho?.toLowerCase().includes(termo) || false;
          if (!nomeOk && !matOk && !cpfOk && !conselhoOk) return false;
        }

        return true;
      })
      .map((f) => {
        const nucleo = nucleos.find((n) => n.id === f.nucleoId);
        const funcaoObj = funcoes.find((fn) => fn.id === f.funcaoId);
        const categoria = classificarCategoria(f, funcaoObj);
        const isProfessor = categoria === "professor";

        // Cálculo da carga horária semanal:
        let horasSemanaisNum = 0;
        let tipoCarga = "CLT";
        let cargaHorariaFormatada = "—";

        if (isProfessor) {
          tipoCarga = "Grade";
          const turmasDoProf = turmas.filter((t) =>
            (t.responsaveis ?? []).includes(f.id)
          );
          let totalHoras = 0;
          for (const t of turmasDoProf) {
            for (const s of t.slots || []) {
              const duracao = (s.fim ?? 0) - (s.inicio ?? 0);
              if (duracao > 0) totalHoras += duracao;
            }
          }
          horasSemanaisNum = totalHoras;
          cargaHorariaFormatada =
            horasSemanaisNum > 0 ? `${horasSemanaisNum}h/sem (Grade)` : "Sem turmas";
        } else {
          tipoCarga = "CLT";
          const cltData = jornadasCltMap[f.id];
          if (cltData && cltData.minutosSemanais > 0) {
            horasSemanaisNum = Math.round(cltData.minutosSemanais / 60);
            cargaHorariaFormatada = `${horasSemanaisNum}h/sem (CLT)`;
          } else {
            cargaHorariaFormatada = "Sem escala";
          }
        }

        // Métricas do período
        const aulasMinistradas = aulasPorProfessor[f.id] ?? 0;
        const supervisoesRealizadas = supervisoesPorCoordenador[f.id] ?? 0;
        const ponto = pontoResumo[f.id];
        const diasPonto = ponto?.diasTrabalhados ?? 0;
        const horasCumpridasNum = ponto ? Math.floor(ponto.minutosTotais / 60) : 0;
        const minutosRestantes = ponto ? ponto.minutosTotais % 60 : 0;
        const horasCumpridasFormatada =
          ponto && ponto.minutosTotais > 0
            ? `${horasCumpridasNum}h ${minutosRestantes}m`
            : `${diasPonto} dia(s)`;

        const temAtividadePeriodo =
          aulasMinistradas > 0 || supervisoesRealizadas > 0 || diasPonto > 0;

        return {
          f,
          nucleo,
          funcaoObj,
          categoria,
          isProfessor,
          tipoCarga,
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
    turmas,
    jornadasCltMap,
    aulasPorProfessor,
    supervisoesPorCoordenador,
    pontoResumo,
    filtros.nucleoId,
    filtros.status,
    categoriaFiltro,
    busca,
  ]);

  // ── 4. KPIS DINÂMICOS ───────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = linhas.length;
    const professores = linhas.filter((l) => l.categoria === "professor").length;
    const coordenacao = linhas.filter((l) => l.categoria === "coordenador").length;
    const apoioTecnico = linhas.filter((l) => l.categoria === "social_tecnico" || l.categoria === "operacional").length;
    const totalHorasSemanais = linhas.reduce((acc, l) => acc + l.horasSemanaisNum, 0);

    return {
      total,
      professores,
      coordenacao,
      apoioTecnico,
      totalHorasSemanais,
    };
  }, [linhas]);

  // Exportar CSV
  function handleExportarCsv() {
    const headers = [
      "Matrícula",
      "Profissional",
      "CPF",
      "E-mail",
      "Celular",
      "Categoria",
      "Função",
      "Conselho",
      "Registro Conselho",
      "Lotação / Núcleo",
      "Data de Admissão",
      "Carga Horária Semanal",
      "Tipo de Escala",
      "Remuneração",
      "Aulas no Período",
      "Supervisões no Período",
      "Dias com Ponto",
      "Horas de Ponto no Período",
      "Status",
    ];

    const rows = linhas.map((l) => [
      `"${l.f.matricula || ""}"`,
      `"${l.f.nomeCompleto}"`,
      `"${l.f.cpf || ""}"`,
      `"${l.f.email || ""}"`,
      `"${l.f.celular || ""}"`,
      `"${CATEGORIA_LABEL[l.categoria]}"`,
      `"${l.funcaoObj?.nome || l.f.funcao || "—"}"`,
      `"${l.f.conselho || "—"}"`,
      `"${l.f.registroConselho || "—"}"`,
      `"${l.nucleo?.identificacao || l.f.alocadoEm || "Administração Geral"}"`,
      `"${l.f.dataAdmissao ? formatarData(l.f.dataAdmissao) : "—"}"`,
      `"${l.cargaHorariaFormatada}"`,
      `"${l.tipoCarga}"`,
      `"${l.f.remuneracao || "—"}"`,
      l.aulasMinistradas,
      l.supervisoesRealizadas,
      l.diasPonto,
      `"${l.horasCumpridasFormatada}"`,
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
            <p className="text-[11px] text-emerald-600 mt-1">Grade semanal de turmas</p>
          </CardBody>
        </Card>

        {/* Card 3: Coordenação */}
        <Card className="border-amber-200 bg-amber-50/40">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <span>Coordenação</span>
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-950">{kpis.coordenacao}</span>
              <span className="text-[11px] text-amber-800 font-medium">gestores</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">Supervisão e núcleos</p>
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
            <option value="social_tecnico">Apoio Técnico / Saúde</option>
            <option value="operacional">Apoio Geral / Staff</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula, CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 sm:w-64"
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
                  <th className="px-4 py-3">Função / Conselho</th>
                  <th className="px-4 py-3">Lotação / Núcleo</th>
                  <th className="px-4 py-3">Admissão</th>
                  <th className="px-4 py-3 text-center">Carga Horária</th>
                  <th className="px-4 py-3">Remuneração</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {linhas.map(
                  ({
                    f,
                    nucleo,
                    funcaoObj,
                    categoria,
                    isProfessor,
                    cargaHorariaFormatada,
                  }) => (
                    <tr key={f.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">{f.nomeCompleto}</span>
                          {f.matricula && (
                            <span className="rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600">
                              {f.matricula}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          {f.cpf && <span className="font-mono">{f.cpf}</span>}
                          {f.email && <span>• {f.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={CATEGORIA_TONE[categoria]}>
                          {CATEGORIA_LABEL[categoria]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-800">
                          {funcaoObj?.nome || f.funcao || "—"}
                        </div>
                        {f.registroConselho && (
                          <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                            {f.conselho ? `${f.conselho}: ` : "Registro: "}
                            <span className="font-mono text-zinc-700">{f.registroConselho}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {nucleo ? (
                          <span className="inline-flex items-center gap-1 font-medium text-zinc-800">
                            {nucleo.identificacao}
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-medium">
                            {f.alocadoEm || "Administração Geral"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {f.dataAdmissao ? formatarData(f.dataAdmissao) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-zinc-800">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] ${
                            isProfessor
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-sky-50 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {cargaHorariaFormatada}
                        </span>
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
                  )
                )}
              </tbody>
            </table>
          ) : (
            /* ── VISÃO 2: PRODUTIVIDADE & PONTO NO PERÍODO ──────────────────── */
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Lotação / Núcleo</th>
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
                    funcaoObj,
                    categoria,
                    aulasMinistradas,
                    supervisoesRealizadas,
                    diasPonto,
                    horasCumpridasFormatada,
                    temAtividadePeriodo,
                  }) => (
                    <tr key={f.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">{f.nomeCompleto}</span>
                          {f.matricula && (
                            <span className="rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600">
                              {f.matricula}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {funcaoObj?.nome || f.funcao || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={CATEGORIA_TONE[categoria]}>
                          {CATEGORIA_LABEL[categoria]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {nucleo?.identificacao || f.alocadoEm || "Administração Geral"}
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
                          <span className="text-zinc-500 font-medium">Apoio em operação</span>
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
