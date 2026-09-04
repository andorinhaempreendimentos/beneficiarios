"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge, Card, CardBody, CardHeader, Button, Input } from "@/components/ui";
import {
  beneficiariosApi,
  turmasApi,
  nucleosApi,
  objetosApi,
  funcionariosApi,
  type BeneficiarioApi,
  type TurmaApi,
  type NucleoApi,
  type ObjetoApi,
  type FuncionarioApi,
} from "@/lib/api/services";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  statusBeneficiarioTone,
  statusBeneficiarioLabel,
  normalizarStatusBeneficiario,
} from "@/lib/status";
import { formatarData } from "@/lib/utils";
import type { FiltrosState } from "./FiltrosRelatorio";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  FileSpreadsheet,
  Layers,
  Clock,
  Filter,
} from "lucide-react";

interface Props {
  filtros: FiltrosState;
}

interface ExecucaoAulaItem {
  id: string;
  turmaId: string;
  data: string;
  observacoes?: string;
  professorId?: string;
}

interface PresencaItem {
  execucaoAulaId: string;
  beneficiarioId: string;
  status: "presente" | "falta" | "justificada";
  observacao?: string | null;
}

interface MatriculaItem {
  beneficiarioId: string;
  turmaId: string;
  status: string;
}

export function TabelaPresenca({ filtros }: Props) {
  // ── 1. CARREGAMENTO DE DADOS ──────────────────────────────────────────────
  const { data: bRes, loading: loadingBeneficiarios } = useQuery(
    () => beneficiariosApi.list({ limit: 500 }),
    []
  );
  const { data: tRes } = useQuery(() => turmasApi.list({ limit: 200 }), []);
  const { data: nRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const { data: oRes } = useQuery(() => objetosApi.list({ limit: 50 }), []);
  const { data: fRes } = useQuery(() => funcionariosApi.list({ limit: 100 }), []);

  const beneficiarios = bRes?.data ?? [];
  const turmas = tRes?.data ?? [];
  const nucleos = nRes?.data ?? [];
  const objetos = oRes?.data ?? [];
  const funcionarios = fRes?.data ?? [];

  // Objeto e Meta de Frequência Dinâmica
  const objetoSelecionado = useMemo(() => {
    if (filtros.objetoId) {
      return objetos.find((o) => o.id === filtros.objetoId) || null;
    }
    return objetos[0] || null;
  }, [objetos, filtros.objetoId]);

  const metaFrequenciaMinima = objetoSelecionado?.metaFrequenciaMinima ?? 75;

  // Estados locais para chamadas e matrículas
  const [execucoesAula, setExecucoesAula] = useState<ExecucaoAulaItem[]>([]);
  const [presencas, setPresencas] = useState<PresencaItem[]>([]);
  const [matriculas, setMatriculas] = useState<MatriculaItem[]>([]);
  const [loadingAulas, setLoadingAulas] = useState<boolean>(true);

  // Estados de visualização e filtros rápidos
  const [modoVisualizacao, setModoVisualizacao] = useState<"resumo" | "diario">("resumo");
  const [apenasAbaixoDaMeta, setApenasAbaixoDaMeta] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>("");

  // ── 2. CARREGAR EXECUÇÕES DE AULA E PRESENÇAS DO BANCO ───────────────────
  useEffect(() => {
    let cancelado = false;
    setLoadingAulas(true);
    const sb = createClient();

    async function buscarDadosPresenca() {
      try {
        // 1. Buscar execuções de aula dentro do período
        let qAulas = sb
          .from("execucoes_aula")
          .select("id, turma_id, data, observacoes, professor_id")
          .order("data", { ascending: true });

        if (filtros.dataInicio) {
          qAulas = qAulas.gte("data", filtros.dataInicio);
        }
        if (filtros.dataFim) {
          qAulas = qAulas.lte("data", filtros.dataFim);
        }
        if (filtros.turmaId) {
          qAulas = qAulas.eq("turma_id", filtros.turmaId);
        }

        const { data: aulasData, error: aulasErr } = await qAulas;
        if (aulasErr) throw aulasErr;

        const aulasMapeadas: ExecucaoAulaItem[] = (aulasData || []).map((a: any) => ({
          id: a.id,
          turmaId: a.turma_id,
          data: a.data,
          observacoes: a.observacoes,
          professorId: a.professor_id,
        }));

        const aulaIds = aulasMapeadas.map((a) => a.id);

        // 2. Buscar presenças vinculadas a essas aulas
        let presencasMapeadas: PresencaItem[] = [];
        if (aulaIds.length > 0) {
          const { data: presData, error: presErr } = await sb
            .from("beneficiario_presencas")
            .select("execucao_aula_id, beneficiario_id, status, observacao")
            .in("execucao_aula_id", aulaIds);

          if (presErr) throw presErr;

          presencasMapeadas = (presData || []).map((p: any) => ({
            execucaoAulaId: p.execucao_aula_id,
            beneficiarioId: p.beneficiario_id,
            status: p.status,
            observacao: p.observacao,
          }));
        }

        // 3. Buscar matrículas reais dos beneficiários nas turmas
        const { data: matData, error: matErr } = await sb
          .from("beneficiario_turmas")
          .select("beneficiario_id, turma_id, status")
          .is("deleted_at", null);

        const matriculasMapeadas: MatriculaItem[] = (matData || []).map((m: any) => ({
          beneficiarioId: m.beneficiario_id,
          turmaId: m.turma_id,
          status: m.status,
        }));

        if (!cancelado) {
          setExecucoesAula(aulasMapeadas);
          setPresencas(presencasMapeadas);
          setMatriculas(matriculasMapeadas);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de presença:", err);
      } finally {
        if (!cancelado) setLoadingAulas(false);
      }
    }

    buscarDadosPresenca();

    return () => {
      cancelado = true;
    };
  }, [filtros.dataInicio, filtros.dataFim, filtros.turmaId]);

  // ── 3. MAPAS DE BUSCA RÁPIDA ──────────────────────────────────────────────
  const presencasPorAulaAluno = useMemo(() => {
    const map = new Map<string, "presente" | "falta" | "justificada">();
    for (const p of presencas) {
      map.set(`${p.execucaoAulaId}_${p.beneficiarioId}`, p.status);
    }
    return map;
  }, [presencas]);

  // ── 4. CONSTRUÇÃO DAS LINHAS COM CÁLCULOS REAIS ──────────────────────────
  const linhasCalculadas = useMemo(() => {
    const list: Array<{
      beneficiario: BeneficiarioApi;
      turma: TurmaApi | null;
      nucleo: NucleoApi | null;
      professor: FuncionarioApi | null;
      totalAulasTurma: number;
      presencasQtd: number;
      faltasQtd: number;
      justificadasQtd: number;
      frequenciaPercent: number | null;
      situacaoMeta: "atingida" | "abaixo" | "sem_aulas";
      aulasStatus: Record<string, "presente" | "falta" | "justificada" | "nao_registrado">;
    }> = [];

    for (const b of beneficiarios) {
      // Filtros de Núcleo e Status
      if (filtros.nucleoId && b.nucleoId !== filtros.nucleoId) continue;
      if (filtros.status && normalizarStatusBeneficiario(b.status) !== filtros.status) continue;

      // Busca textual por Nome ou CPF
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const nomeOk = b.nomeCompleto.toLowerCase().includes(termo);
        const cpfOk = b.cpf ? b.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "")) : false;
        if (!nomeOk && !cpfOk) continue;
      }

      // Descobrir turmas reais do beneficiário
      const matriculasDoAluno = matriculas.filter((m) => m.beneficiarioId === b.id);
      const turmasDoAluno = matriculasDoAluno.length > 0
        ? turmas.filter((t) => matriculasDoAluno.some((m) => m.turmaId === t.id))
        : turmas.filter((t) => t.nucleoId === b.nucleoId).slice(0, 1);

      // Se filtrou por turma específica e o aluno não pertence a ela, ignorar
      if (filtros.turmaId && !turmasDoAluno.some((t) => t.id === filtros.turmaId)) {
        continue;
      }

      // Se o aluno não tiver nenhuma turma, ainda assim renderizar com informações do núcleo
      const turmasParaIterar = turmasDoAluno.length > 0 ? turmasDoAluno : [null];

      for (const t of turmasParaIterar) {
        if (filtros.turmaId && t && t.id !== filtros.turmaId) continue;

        const nucleo = nucleos.find((n) => n.id === (t?.nucleoId || b.nucleoId)) || null;
        const professor = t?.responsaveis?.[0]
          ? funcionarios.find((f) => f.id === t.responsaveis[0]) || null
          : t?.responsaveisNomes?.[0]
          ? ({ nomeCompleto: t.responsaveisNomes[0] } as any)
          : null;

        // Aulas realizadas desta turma no período
        const aulasDaTurma = t ? execucoesAula.filter((e) => e.turmaId === t.id) : [];
        const totalAulasTurma = aulasDaTurma.length;

        let presencasQtd = 0;
        let faltasQtd = 0;
        let justificadasQtd = 0;
        const aulasStatus: Record<string, "presente" | "falta" | "justificada" | "nao_registrado"> = {};

        for (const aula of aulasDaTurma) {
          const st = presencasPorAulaAluno.get(`${aula.id}_${b.id}`);
          if (st === "presente") {
            presencasQtd++;
            aulasStatus[aula.id] = "presente";
          } else if (st === "falta") {
            faltasQtd++;
            aulasStatus[aula.id] = "falta";
          } else if (st === "justificada") {
            justificadasQtd++;
            aulasStatus[aula.id] = "justificada";
          } else {
            aulasStatus[aula.id] = "nao_registrado";
          }
        }

        let frequenciaPercent: number | null = null;
        let situacaoMeta: "atingida" | "abaixo" | "sem_aulas" = "sem_aulas";

        if (totalAulasTurma > 0) {
          frequenciaPercent = Math.round((presencasQtd / totalAulasTurma) * 100);
          situacaoMeta = frequenciaPercent >= metaFrequenciaMinima ? "atingida" : "abaixo";
        }

        // Filtro rápido "Apenas Abaixo da Meta"
        if (apenasAbaixoDaMeta && situacaoMeta !== "abaixo") {
          continue;
        }

        list.push({
          beneficiario: b,
          turma: t,
          nucleo,
          professor,
          totalAulasTurma,
          presencasQtd,
          faltasQtd,
          justificadasQtd,
          frequenciaPercent,
          situacaoMeta,
          aulasStatus,
        });
      }
    }

    return list;
  }, [
    beneficiarios,
    turmas,
    nucleos,
    funcionarios,
    matriculas,
    execucoesAula,
    presencasPorAulaAluno,
    filtros,
    busca,
    metaFrequenciaMinima,
    apenasAbaixoDaMeta,
  ]);

  // ── 5. KPIs DO OBJETO E ESTATÍSTICAS GERAIS ──────────────────────────────
  const kpis = useMemo(() => {
    const totalRegistros = linhasCalculadas.length;
    const comAulas = linhasCalculadas.filter((l) => l.totalAulasTurma > 0);
    const abaixoDaMetaCount = linhasCalculadas.filter((l) => l.situacaoMeta === "abaixo").length;
    const somaPercent = comAulas.reduce((acc, l) => acc + (l.frequenciaPercent || 0), 0);
    const mediaGeral = comAulas.length > 0 ? Math.round(somaPercent / comAulas.length) : 0;
    const totalAulasExecutadas = execucoesAula.length;

    return {
      metaObjeto: metaFrequenciaMinima,
      mediaGeral,
      totalAulasExecutadas,
      abaixoDaMetaCount,
      totalRegistros,
    };
  }, [linhasCalculadas, execucoesAula, metaFrequenciaMinima]);

  // Lista única de datas de aulas executadas para o Diário de Classe
  const aulasUnicas = useMemo(() => {
    const map = new Map<string, ExecucaoAulaItem>();
    for (const a of execucoesAula) {
      if (!map.has(a.id)) map.set(a.id, a);
    }
    return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data));
  }, [execucoesAula]);

  // Exportar CSV
  function handleExportarCsv() {
    const headers = [
      "Beneficiário",
      "CPF",
      "Turma",
      "Núcleo",
      "Professor",
      "Aulas Realizadas",
      "Presenças",
      "Faltas",
      "Faltas Justificadas",
      "% Frequência",
      "Meta Objeto",
      "Situação",
    ];

    const rows = linhasCalculadas.map((l) => [
      `"${l.beneficiario.nomeCompleto}"`,
      `"${l.beneficiario.cpf || ""}"`,
      `"${l.turma?.nome || "—"}"`,
      `"${l.nucleo?.identificacao || "—"}"`,
      `"${l.professor?.nomeCompleto || "—"}"`,
      l.totalAulasTurma,
      l.presencasQtd,
      l.faltasQtd,
      l.justificadasQtd,
      l.frequenciaPercent !== null ? `${l.frequenciaPercent}%` : "Sem aulas",
      `${metaFrequenciaMinima}%`,
      l.situacaoMeta === "atingida" ? "Atingida" : l.situacaoMeta === "abaixo" ? "Abaixo da Meta" : "Sem registro",
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relatorio_Frequencia_${objetoSelecionado?.nome.replace(/[^a-zA-Z0-9]/g, "_") || "Geral"}_${filtros.dataInicio || "inicio"}_${filtros.dataFim || "fim"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── PAINEL DE KPIS DINÂMICOS DO OBJETO ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Meta do Objeto */}
        <Card className="border-sky-200 bg-sky-50/50">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
              <span>Meta do Objeto</span>
              <Layers className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-sky-950">{kpis.metaObjeto}%</span>
              <span className="text-[11px] text-sky-700 font-medium">mínima</span>
            </div>
            <p className="text-[11px] text-sky-600 mt-1 truncate">
              {objetoSelecionado?.nome || "Projeto Geral"}
            </p>
          </CardBody>
        </Card>

        {/* Card 2: Frequência Média Real */}
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Frequência Média</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-950">{kpis.mediaGeral}%</span>
              <span className="text-[11px] text-emerald-700 font-medium">no período</span>
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">
              Média ponderada do grupo
            </p>
          </CardBody>
        </Card>

        {/* Card 3: Total de Aulas Ministradas */}
        <Card className="border-zinc-200 bg-white">
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span>Aulas Realizadas</span>
              <Calendar className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900">{kpis.totalAulasExecutadas}</span>
              <span className="text-[11px] text-zinc-500 font-medium">chamadas</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {filtros.dataInicio && filtros.dataFim ? `${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}` : "Histórico total"}
            </p>
          </CardBody>
        </Card>

        {/* Card 4: Alunos Abaixo da Meta (Risco) */}
        <Card className={`border-amber-200 ${kpis.abaixoDaMetaCount > 0 ? "bg-amber-50/60" : "bg-white"}`}>
          <CardBody className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <span>Abaixo da Meta (&lt;{kpis.metaObjeto}%)</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-950">{kpis.abaixoDaMetaCount}</span>
              <span className="text-[11px] text-amber-800 font-medium">alunos</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              {kpis.abaixoDaMetaCount > 0 ? "Risco de evasão / descumprimento" : "Nenhum aluno em risco"}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* ── BARRA DE FERRAMENTAS E MODO DE VISUALIZAÇÃO ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Alternador de Modo */}
          <div className="flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
            <button
              type="button"
              onClick={() => setModoVisualizacao("resumo")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoVisualizacao === "resumo"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Resumo Analítico
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao("diario")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                modoVisualizacao === "diario"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Diário de Classe (Grade por Datas)
            </button>
          </div>

          {/* Filtro Rápido: Abaixo da Meta */}
          <button
            type="button"
            onClick={() => setApenasAbaixoDaMeta((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              apenasAbaixoDaMeta
                ? "border-amber-400 bg-amber-50 text-amber-900 shadow-2xs"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${apenasAbaixoDaMeta ? "text-amber-600" : "text-zinc-400"}`} />
            Apenas Abaixo da Meta ({metaFrequenciaMinima}%)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Campo de Busca por Aluno */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar aluno ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 sm:w-56"
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

      {/* ── TABELA PRINCIPAL ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-800">
                {modoVisualizacao === "resumo" ? "Assiduidade e Frequência Individual" : "Diário de Classe com Frequência por Data"}
              </h3>
              <Badge tone="sky">Meta do Objeto: {metaFrequenciaMinima}%</Badge>
            </div>
            <span className="text-xs text-zinc-500">
              {linhasCalculadas.length} aluno(s) listado(s)
            </span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {loadingBeneficiarios || loadingAulas ? (
            <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
              Compilando chamadas e frequências das turmas...
            </div>
          ) : linhasCalculadas.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              Nenhum aluno encontrado com os filtros selecionados.
            </div>
          ) : modoVisualizacao === "resumo" ? (
            /* ── VISÃO 1: RESUMO ANALÍTICO ──────────────────────────────────── */
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Beneficiário</th>
                  <th className="px-4 py-3">Turma Real</th>
                  <th className="px-4 py-3">Núcleo</th>
                  <th className="px-4 py-3">Professor</th>
                  <th className="px-3 py-3 text-center">Aulas</th>
                  <th className="px-3 py-3 text-center text-emerald-700">Presenças</th>
                  <th className="px-3 py-3 text-center text-rose-700">Faltas</th>
                  <th className="px-3 py-3 text-center text-amber-700">Justif.</th>
                  <th className="px-4 py-3 text-center">Frequência Real</th>
                  <th className="px-4 py-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {linhasCalculadas.map((linha, idx) => (
                  <tr key={`${linha.beneficiario.id}-${idx}`} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{linha.beneficiario.nomeCompleto}</div>
                      {linha.beneficiario.cpf && (
                        <div className="text-[11px] text-zinc-400 font-mono">{linha.beneficiario.cpf}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-700">{linha.turma?.nome || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{linha.nucleo?.identificacao || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{linha.professor?.nomeCompleto || "—"}</td>
                    <td className="px-3 py-3 text-center font-medium">{linha.totalAulasTurma}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-700">{linha.presencasQtd}</td>
                    <td className="px-3 py-3 text-center font-bold text-rose-700">{linha.faltasQtd}</td>
                    <td className="px-3 py-3 text-center font-medium text-amber-700">{linha.justificadasQtd}</td>
                    <td className="px-4 py-3 text-center">
                      {linha.frequenciaPercent !== null ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`font-bold ${
                              linha.frequenciaPercent >= metaFrequenciaMinima
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {linha.frequenciaPercent}%
                          </span>
                          <div className="h-1.5 w-16 rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className={`h-full ${
                                linha.frequenciaPercent >= metaFrequenciaMinima
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, linha.frequenciaPercent)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">Sem aulas no período</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {linha.situacaoMeta === "atingida" && (
                        <Badge tone="green">Meta Atingida ({linha.frequenciaPercent}%)</Badge>
                      )}
                      {linha.situacaoMeta === "abaixo" && (
                        <Badge tone="amber">Abaixo da Meta ({linha.frequenciaPercent}%)</Badge>
                      )}
                      {linha.situacaoMeta === "sem_aulas" && (
                        <Badge tone="zinc">Sem Registro</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* ── VISÃO 2: DIÁRIO DE CLASSE (GRADE POR DATAS) ───────────────── */
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-zinc-50 z-10 shadow-2xs">Beneficiário</th>
                  <th className="px-3 py-3">Turma</th>
                  <th className="px-3 py-3 text-center font-bold">Freq.</th>
                  {aulasUnicas.map((a) => (
                    <th key={a.id} className="px-2 py-3 text-center min-w-[48px]">
                      <div className="font-mono text-[10px]">{formatarData(a.data).substring(0, 5)}</div>
                      <div className="text-[9px] text-zinc-400 font-normal">aula</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {linhasCalculadas.map((linha, idx) => (
                  <tr key={`${linha.beneficiario.id}-${idx}`} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-zinc-900 sticky left-0 bg-white z-10 shadow-2xs">
                      {linha.beneficiario.nomeCompleto}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600">{linha.turma?.nome || "—"}</td>
                    <td className="px-3 py-2.5 text-center font-bold">
                      {linha.frequenciaPercent !== null ? `${linha.frequenciaPercent}%` : "—"}
                    </td>
                    {aulasUnicas.map((a) => {
                      const st = linha.aulasStatus[a.id];
                      return (
                        <td key={a.id} className="px-2 py-2.5 text-center">
                          {st === "presente" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]" title="Presente">
                              P
                            </span>
                          )}
                          {st === "falta" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]" title="Falta">
                              F
                            </span>
                          )}
                          {st === "justificada" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]" title="Falta Justificada">
                              J
                            </span>
                          )}
                          {(!st || st === "nao_registrado") && (
                            <span className="text-zinc-300 text-[11px]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
