"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  MapPin, 
  Users2, 
  CalendarClock, 
  Package, 
  ClipboardCheck, 
  AlertCircle,
  GraduationCap,
  ArrowRight,
  Search,
  Plus,
  ExternalLink,
  Clock,
  Phone,
  LayoutGrid,
  List,
  FileText,
  Layers,
  Edit,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  LinkButton,
} from "@/components/ui";
import { calcularIdade, formatarData, formatarNomeGrupo } from "@/lib/utils";
import { GradeNucleoWidget } from "@/components/polo/GradeNucleoWidget";
import { normalizarStatusBeneficiario } from "@/lib/status";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import type { NucleoApi, TurmaApi, BeneficiarioApi, FuncionarioApi } from "@/lib/api/services";

interface DetalhesNucleoViewProps {
  nucleo: NucleoApi;
  turmas: TurmaApi[];
  beneficiarios: BeneficiarioApi[];
  totalBeneficiarios: number;
  categorias: any[];
  funcionarios?: FuncionarioApi[];
}

type TabType = "turmas" | "beneficiarios" | "grade" | "estoque" | "supervisoes";

export function DetalhesNucleoView({
  nucleo,
  turmas,
  beneficiarios,
  totalBeneficiarios,
  categorias,
  funcionarios = []
}: DetalhesNucleoViewProps) {
  const { user } = useAuth();
  const { t } = useDicionario();
  const isCoordenador = Boolean((user as any)?.isCoordenador);

  const termoLocal = t("local", "Núcleo");
  const termoBeneficiario = t("beneficiario", "Beneficiário");
  const termoBeneficiarios = t("beneficiario", "Beneficiários", true);
  const termoTurma = t("turma", "Turma");
  const termoTurmas = t("turma", "Turmas", true);
  const termoProfessor = t("instrutor", "Professor");
  const termoProfessores = t("instrutor", "Professores", true);

  // Estados de navegação e filtros
  const [activeTab, setActiveTab] = useState<TabType>("turmas");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [buscaTurma, setBuscaTurma] = useState("");
  const [buscaBeneficiario, setBuscaBeneficiario] = useState("");

  // Dados calculados de beneficiários
  const statusNormalizados = beneficiarios.map((b) => normalizarStatusBeneficiario(b.status));
  const beneficiariosAtivos = statusNormalizados.filter((s) => s === "ativo").length;
  const beneficiariosPendentes = statusNormalizados.filter((s) => s === "pendente").length;
  const beneficiariosInativos = statusNormalizados.filter((s) => s === "inativo").length;

  // Cálculos de vagas
  const totalVagasTotais = turmas.reduce((acc, t) => acc + (t.vagasTotais || 0), 0);
  const totalVagasOcupadas = turmas.reduce((acc, t) => acc + (t.vagasOcupadas || 0), 0);
  const percentualOcupacao = totalVagasTotais > 0 ? Math.round((totalVagasOcupadas / totalVagasTotais) * 100) : 0;

  // Busca o funcionário do RH correspondente ao responsável cadastrado
  const responsavelRh = useMemo(() => {
    if (!nucleo.nomeResponsavel) return null;
    const nomeAlvo = nucleo.nomeResponsavel.trim().toLowerCase();
    return funcionarios.find((f) => {
      const nomeFunc = f.nomeCompleto.trim().toLowerCase();
      return nomeFunc === nomeAlvo || nomeFunc.includes(nomeAlvo) || nomeAlvo.includes(nomeFunc);
    });
  }, [nucleo.nomeResponsavel, funcionarios]);

  // Iniciais para o avatar
  const iniciaisResponsavel = useMemo(() => {
    const nome = nucleo.nomeResponsavel || responsavelRh?.nomeCompleto || "RP";
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }, [nucleo.nomeResponsavel, responsavelRh]);

  // Link do Google Maps
  const mapaUrl = useMemo(() => {
    if (nucleo.latitude && nucleo.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${nucleo.latitude},${nucleo.longitude}`;
    }
    const partes = [nucleo.endereco, nucleo.numero, nucleo.bairro, nucleo.cidade, nucleo.estado].filter(Boolean);
    return partes.length > 0
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes.join(", "))}`
      : null;
  }, [nucleo]);

  // Filtro de turmas em tempo real
  const turmasFiltradas = useMemo(() => {
    if (!buscaTurma.trim()) return turmas;
    const q = buscaTurma.toLowerCase();
    return turmas.filter((t) => {
      const nomeMatch = t.nome?.toLowerCase().includes(q);
      const respMatch = (t.responsaveisNomes || []).some((r) => r.toLowerCase().includes(q)) || 
                        (t.responsaveis || []).some((r) => r.toLowerCase().includes(q));
      return nomeMatch || respMatch;
    });
  }, [turmas, buscaTurma]);

  // Filtro de beneficiários em tempo real
  const beneficiariosFiltrados = useMemo(() => {
    if (!buscaBeneficiario.trim()) return beneficiarios;
    const q = buscaBeneficiario.toLowerCase();
    return beneficiarios.filter((b) => {
      const nomeMatch = b.nomeCompleto?.toLowerCase().includes(q);
      const matMatch = b.matricula?.toLowerCase().includes(q);
      return nomeMatch || matMatch;
    });
  }, [beneficiarios, buscaBeneficiario]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      
      {/* ========================================================================= */}
      {/* HERO / CABEÇALHO OPERACIONAL DO NÚCLEO */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs relative overflow-hidden">
        {/* Fundo decorativo sutil */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-linear-to-br from-sky-500/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            
            {/* Badges e tags superiores */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                nucleo.emFuncionamento
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
              }`}>
                <span className={`w-2 h-2 rounded-full ${nucleo.emFuncionamento ? "bg-emerald-500" : "bg-zinc-400"}`} />
                {nucleo.emFuncionamento ? "Em Funcionamento" : "Inativo"}
              </span>

              {(nucleo.regiaoNome || nucleo.regiao) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                  <MapPin className="w-3.5 h-3.5" />
                  {nucleo.regiaoNome || nucleo.regiao}
                </span>
              )}

              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                nucleo.disponivelPreInscricao
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
              }`}>
                {nucleo.disponivelPreInscricao ? "Pré-inscrição Aberta" : "Pré-inscrição Suspensa"}
              </span>

              {nucleo.permitirChamadaRetroativa && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  Chamada: até {nucleo.diasLimiteRetroativo || 2}d retroativos
                </span>
              )}
            </div>

            {/* Identificação principal e endereço */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {nucleo.identificacao}
              </h1>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  {nucleo.endereco ? (
                    <span>
                      {nucleo.endereco}{nucleo.numero ? `, ${nucleo.numero}` : ""}{nucleo.bairro ? ` — ${nucleo.bairro}` : ""}{nucleo.cidade ? `, ${nucleo.cidade}` : ""}{nucleo.estado ? ` - ${nucleo.estado}` : ""}
                    </span>
                  ) : (
                    <span>{nucleo.nomeLocal || `${nucleo.bairro || ""}, ${nucleo.cidade || ""}`}</span>
                  )}
                </span>
                
                {mapaUrl && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <a
                      href={mapaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 text-xs font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Ver no mapa
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Perfil do Responsável do RH com Avatar */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {iniciaisResponsavel}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {nucleo.nomeResponsavel || responsavelRh?.nomeCompleto || "Sem responsável designado"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {responsavelRh ? "Responsável (RH)" : "Responsável no Núcleo"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <span>{responsavelRh?.funcao || "Professor / Coordenador"}</span>
                  {responsavelRh?.matricula && (
                    <>
                      <span>•</span>
                      <span>Matrícula <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">{responsavelRh.matricula}</span></span>
                    </>
                  )}
                  {(nucleo.telefoneContato || responsavelRh?.celular) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        {nucleo.telefoneContato || responsavelRh?.celular}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Botões de Ação do Topo */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {!isCoordenador && (
              <Link
                href={`/nucleos/${nucleo.id}/editar`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold shadow-2xs transition-all"
              >
                <Edit className="w-4 h-4 text-zinc-500" />
                Editar {termoLocal}
              </Link>
            )}

            <Link
              href={`/relatorios/frequencia?nucleoId=${nucleo.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-sm font-semibold shadow-2xs transition-all"
            >
              <FileText className="w-4 h-4" />
              Pauta de Frequência
            </Link>

            {isCoordenador ? (
              <Link
                href={`/supervisoes/nova?nucleoId=${nucleo.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                Iniciar Supervisão
              </Link>
            ) : (
              <Link
                href={`/turmas/nova?nucleoId=${nucleo.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova {termoTurma}
              </Link>
            )}
          </div>
        </div>

        {/* CARDS DE MÉTRICAS (KPIs) OPERACIONAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          
          {/* KPI 1: Capacidade e Lotação */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Capacidade Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">{totalVagasTotais}</span>
              <span className="text-xs text-zinc-500">{totalVagasOcupadas} ocupadas ({percentualOcupacao}%)</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, percentualOcupacao))}%` }} 
              />
            </div>
          </div>

          {/* KPI 2: Turmas */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">{termoTurmas} Ativas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">{turmas.length}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">100% cadastradas</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Média de {turmas.length > 0 ? Math.round(totalVagasTotais / turmas.length) : 0} vagas/turma
            </p>
          </div>

          {/* KPI 3: Beneficiários */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">{termoBeneficiarios}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">{totalBeneficiarios}</span>
              <span className={`text-xs font-medium ${totalBeneficiarios === 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {totalBeneficiarios === 0 ? "Pronto para matrículas" : `${beneficiariosAtivos} ativos`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {beneficiariosAtivos} ativos • {beneficiariosPendentes} pendentes
            </p>
          </div>

          {/* KPI 4: Ação de Campo / Supervisão */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Supervisão de Campo</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Regular</span>
              </div>
            </div>
            <Link
              href={`/supervisoes/nova?nucleoId=${nucleo.id}`}
              className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline mt-1 block"
            >
              Registrar visita técnica &rarr;
            </Link>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVEGAÇÃO POR ABAS OPERACIONAIS */}
      {/* ========================================================================= */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-6 overflow-x-auto pb-px" aria-label="Abas">
          <button
            onClick={() => setActiveTab("turmas")}
            className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "turmas"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            {termoTurmas} & Vagas
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold font-mono">
              {turmas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("beneficiarios")}
            className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "beneficiarios"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Users2 className="w-4 h-4" />
            {termoBeneficiarios}
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
              {totalBeneficiarios}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("grade")}
            className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "grade"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Grade Semanal
          </button>

          <button
            onClick={() => setActiveTab("estoque")}
            className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "estoque"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Package className="w-4 h-4" />
            Estoque & Materiais
          </button>

          <button
            onClick={() => setActiveTab("supervisoes")}
            className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "supervisoes"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Supervisões & Campo
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: TURMAS & VAGAS */}
      {/* ========================================================================= */}
      {activeTab === "turmas" && (
        <section className="space-y-4">
          
          {/* Barra de Busca e Alternância de Visualização */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaTurma}
                  onChange={(e) => setBuscaTurma(e.target.value)}
                  placeholder={`Buscar por nome da ${termoTurma.toLowerCase()} ou professor...`}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Visualização:</span>
              <div className="inline-flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-white dark:bg-zinc-700 text-sky-600 dark:text-sky-300 shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  title="Modo Cards"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white dark:bg-zinc-700 text-sky-600 dark:text-sky-300 shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  title="Modo Tabela"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {!isCoordenador && (
                <Link
                  href={`/turmas/nova?nucleoId=${nucleo.id}`}
                  className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar {termoTurma}
                </Link>
              )}
            </div>
          </div>

          {/* MODO CARDS */}
          {viewMode === "cards" && (
            turmasFiltradas.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500">Nenhuma {termoTurma.toLowerCase()} encontrada para a busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmasFiltradas.map((turma) => {
                  const vagasTotais = turma.vagasTotais || 0;
                  const vagasOcupadas = turma.vagasOcupadas || 0;
                  const taxaOcupacao = vagasTotais > 0 ? Math.round((vagasOcupadas / vagasTotais) * 100) : 0;
                  const responsaveisFormatados = (turma.responsaveisNomes && turma.responsaveisNomes.length > 0)
                    ? turma.responsaveisNomes.join(", ")
                    : (turma.responsaveis ?? []).join(", ") || "Sem instrutor vinculado";

                  return (
                    <div
                      key={turma.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Topo do Card */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              {termoTurma}
                            </span>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-2">
                              {formatarNomeGrupo(turma.nome, t("turma", "Grupo", false, turma.atividade))}
                            </h3>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                            Ativa
                          </span>
                        </div>

                        {/* Instrutor */}
                        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
                            <GraduationCap className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs min-w-0">
                            <span className="text-zinc-400 block text-[10px] leading-none mb-0.5">{termoProfessor} Responsável:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                              {responsaveisFormatados}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Lotação */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-medium">Ocupação de Vagas</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                              {vagasOcupadas} / {vagasTotais} vagas ({taxaOcupacao}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-sky-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, taxaOcupacao))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do Card */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                        <span className="text-zinc-400 font-mono text-[11px]">
                          ID: {turma.id.substring(0, 8)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/turmas/${turma.id}/chamada`}
                            className="px-2.5 py-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 font-bold transition-colors"
                          >
                            Chamada
                          </Link>
                          <Link
                            href={`/turmas/${turma.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1"
                          >
                            Gerenciar &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* MODO TABELA */}
          {viewMode === "table" && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Nome da {termoTurma}</th>
                      <th className="px-4 py-3">{termoProfessores} / Responsáveis</th>
                      <th className="px-4 py-3">Ocupação / Vagas</th>
                      <th className="px-4 py-3">Início</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {turmasFiltradas.map((turma) => (
                      <tr key={turma.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-zinc-500">{turma.id.substring(0, 8)}</td>
                        <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          {formatarNomeGrupo(turma.nome, t("turma", "Grupo", false, turma.atividade))}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">
                          {(turma.responsaveisNomes && turma.responsaveisNomes.length > 0)
                            ? turma.responsaveisNomes.join(", ")
                            : (turma.responsaveis ?? []).join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone="sky">{turma.vagasOcupadas ?? 0}/{turma.vagasTotais}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">
                          {turma.dataInicio ? formatarData(turma.dataInicio) : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Link href={`/turmas/${turma.id}/chamada`} className="text-sky-600 hover:underline font-semibold">
                            Chamada
                          </Link>
                          <Link href={`/turmas/${turma.id}`} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium">
                            Acessar &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: BENEFICIÁRIOS */}
      {/* ========================================================================= */}
      {activeTab === "beneficiarios" && (
        <section className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaBeneficiario}
                  onChange={(e) => setBuscaBeneficiario(e.target.value)}
                  placeholder={`Buscar ficha de ${termoBeneficiario.toLowerCase()} por nome ou CPF...`}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/nucleos/${nucleo.id}/beneficiarios`}>
                <Button variant="outline" size="sm">Ver todos em lista</Button>
              </Link>
              <Link href={`/beneficiarios/novo?nucleoId=${nucleo.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Cadastrar {termoBeneficiario}
                </Button>
              </Link>
            </div>
          </div>

          {beneficiarios.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
                <Users2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Nenhum {termoBeneficiario.toLowerCase()} matriculado ainda
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Este núcleo possui {turmas.length} {termoTurmas.toLowerCase()} ativas com {totalVagasTotais} vagas disponíveis prontas para receber matrículas presenciais ou inscrições pelo portal.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href={`/beneficiarios/novo?nucleoId=${nucleo.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Matricular Primeiro {termoBeneficiario}
                </Link>
                <Link
                  href="/pre-inscricao"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Portal de Pré-inscrição
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">Matrícula</th>
                      <th className="px-4 py-3">Nome Completo</th>
                      <th className="px-4 py-3">Idade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {beneficiariosFiltrados.map((b) => (
                      <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-zinc-500">{b.matricula ?? b.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">{b.nomeCompleto}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {b.dataNascimento ? `${calcularIdade(b.dataNascimento)} anos` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "ativo"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : b.status === "pendente"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/beneficiarios/${b.id}`} className="text-sky-600 hover:underline font-semibold">
                            Ficha &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: GRADE SEMANAL */}
      {/* ========================================================================= */}
      {activeTab === "grade" && (
        <section className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Grade Semanal de Ocupação do {termoLocal}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Visualização da distribuição horária das turmas na quadra/espaço esportivo
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {turmas.length} {termoTurmas.toLowerCase()} alocadas
              </span>
            </div>
            
            <GradeNucleoWidget turmas={turmas} categorias={categorias} />
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: ESTOQUE & MATERIAIS */}
      {/* ========================================================================= */}
      {activeTab === "estoque" && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Materiais do Núcleo */}
            <Link
              href={`/estoque/nucleos/${nucleo.id}`}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Inventário Esportivo</span>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Estoque do {termoLocal}
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Bolas, coletes, cones, apitos e uniformes sob custódia deste núcleo.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
                <span>Acessar inventário</span>
                <span>&rarr;</span>
              </div>
            </Link>

            {/* Card 2: Termos de Entrega */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Entregas aos Alunos</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Uniformes & Kits
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Registre a entrega individual de materiais com assinatura dos responsáveis.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>Conforme turmas matriculadas</span>
              </div>
            </div>

            {/* Card 3: Solicitação de Reposição */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Suprimentos</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Reposição de Materiais
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Solicite novos kits de treinamento diretamente à coordenação do projeto.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">Canal direto via coordenação</span>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: SUPERVISÕES & CAMPO */}
      {/* ========================================================================= */}
      {activeTab === "supervisoes" && (
        <section className="space-y-4">
          
          {/* Card Destacado: Iniciar Supervisão */}
          <div className="rounded-2xl border-2 border-sky-500/20 bg-linear-to-r from-sky-500/10 via-indigo-500/5 to-transparent p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                  Ação de Campo
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Pronto para vistoriar o {nucleo.identificacao}?
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Registre a presença do {termoProfessor.toLowerCase()}, assiduidade dos {termoBeneficiarios.toLowerCase()} e avaliação física dos materiais.
              </p>
            </div>
            <Link
              href={`/supervisoes/nova?nucleoId=${nucleo.id}`}
              className="inline-flex items-center gap-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
            >
              <ClipboardCheck className="h-5 w-5" />
              <span>Iniciar uma supervisão neste {termoLocal.toLowerCase()}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Cards de Atalho: Histórico e Ocorrências */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/supervisoes?nucleoId=${nucleo.id}`}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-xs transition-all group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform shrink-0">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Histórico de Supervisões</p>
                <p className="text-xs text-zinc-500">Acesse relatórios e fotos das vistorias anteriores</p>
              </div>
            </Link>

            <Link
              href={`/pendencias-gerais?nucleoId=${nucleo.id}`}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-red-300 dark:hover:border-red-700 hover:shadow-xs transition-all group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 group-hover:scale-105 transition-transform shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Ocorrências & Pendências</p>
                <p className="text-xs text-zinc-500">Acompanhe itens que precisam de intervenção da equipe</p>
              </div>
            </Link>
          </div>

        </section>
      )}

    </div>
  );
}
