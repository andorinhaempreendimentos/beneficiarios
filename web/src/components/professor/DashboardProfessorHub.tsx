"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  UserPlus,
  Search,
  Camera,
  Calendar,
  MapPin,
  ChevronRight,
  LogOut,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  LogIn,
  CheckSquare,
  X,
  PlayCircle,
  StopCircle,
  FileText,
  Copy,
  MoreVertical,
  UserCheck,
} from "lucide-react";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { GestaoMatriculasProfessor } from "./GestaoMatriculasProfessor";
import { getDataHojeBrasil } from "@/lib/dateUtils";
import { GradeSemanalProfessor } from "./GradeSemanalProfessor";
import type { FuncionarioApi, TurmaApi, NucleoApi, BeneficiarioApi, SlotAulaGrid, ExecucaoAulaApi } from "@/lib/api/services";
import { areaProfessorApi, execucoesAulaApi, professoresApi } from "@/lib/api/services";

interface DashboardProfessorHubProps {
  professor: FuncionarioApi;
  professoresDisponiveis?: FuncionarioApi[];
  onSelecionarProfessor?: (id: string) => void;
  nucleo?: NucleoApi;
  turmas: TurmaApi[];
  slotsGrid?: SlotAulaGrid[];
  todosBeneficiarios: BeneficiarioApi[];
  pontoHoje?: { entrada?: string; saida?: string; registrado: boolean };
  loading?: boolean;
}

const DIAS_SEMANA_NOMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function DashboardProfessorHub({
  professor,
  professoresDisponiveis = [],
  onSelecionarProfessor,
  nucleo,
  turmas,
  slotsGrid = [],
  todosBeneficiarios,
  pontoHoje,
  loading = false,
}: DashboardProfessorHubProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [slideAtual, setSlideAtual] = useState(0);

  // Data da aula selecionada para aplicacao/ponto (padrao YYYY-MM-DD hoje no Brasil)
  const [dataAula, setDataAula] = useState<string>(getDataHojeBrasil());

  // Estado e filtro para busca dinâmica instantânea de beneficiários do professor
  const [buscaBeneficiario, setBuscaBeneficiario] = useState("");

  const beneficiariosFiltradosBusca = useMemo(() => {
    if (!buscaBeneficiario.trim()) return [];
    const termo = buscaBeneficiario.toLowerCase().trim();
    return todosBeneficiarios.filter((b) => {
      const nome = b.nomeCompleto?.toLowerCase() || "";
      const mat = b.matricula?.toLowerCase() || "";
      const cpf = b.cpf?.toLowerCase() || "";
      const turmasStr = (b.turmasInfo ?? []).map((t) => t.turmaNome?.toLowerCase() || "").join(" ");
      const nucleoStr = b.nucleoNome?.toLowerCase() || "";
      return (
        nome.includes(termo) ||
        mat.includes(termo) ||
        cpf.includes(termo) ||
        turmasStr.includes(termo) ||
        nucleoStr.includes(termo)
      );
    });
  }, [buscaBeneficiario, todosBeneficiarios]);

  // Estado da Modal de Ação da Atividade
  const [turmaModal, setTurmaModal] = useState<TurmaApi | null>(null);
  const [execucaoAtiva, setExecucaoAtiva] = useState<ExecucaoAulaApi | null>(null);
  const [verificandoExecucao, setVerificandoExecucao] = useState(false);

  // Verificar se existe aula em andamento ao abrir modal
  useEffect(() => {
    if (!turmaModal) {
      setExecucaoAtiva(null);
      return;
    }
    let cancelled = false;
    setVerificandoExecucao(true);
    execucoesAulaApi.getExecucao(turmaModal.id).then((exec) => {
      if (!cancelled) {
        setExecucaoAtiva(exec?.status === "em_andamento" ? exec : null);
        setVerificandoExecucao(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setExecucaoAtiva(null);
        setVerificandoExecucao(false);
      }
    });
    return () => { cancelled = true; };
  }, [turmaModal]);

  // Auto-encerradas pendentes de confirmação
  const [autoEncerradas, setAutoEncerradas] = useState<ExecucaoAulaApi[]>([]);
  const [confirmandoAuto, setConfirmandoAuto] = useState(false);
  const [fotoAutoFile, setFotoAutoFile] = useState<File | null>(null);
  const [fotoAutoPreview, setFotoAutoPreview] = useState<string | null>(null);
  const [mostrarDivergencia, setMostrarDivergencia] = useState(false);
  const [justificativaDivergencia, setJustificativaDivergencia] = useState("");

  useEffect(() => {
    if (!professor?.id) return;
    execucoesAulaApi.getAutoEncerradas(professor.id)
      .then((lista) => setAutoEncerradas(lista))
      .catch(() => setAutoEncerradas([]));
  }, [professor?.id]);

  // Estados de controle do ponto / atividade da modal
  const [statusAtividade, setStatusAtividade] = useState<Record<string, "em_andamento" | "concluido">>({});
  const [horaInicio, setHoraInicio] = useState<Record<string, string>>({});
  const [horaFim, setHoraFim] = useState<Record<string, string>>({});

  // Estados do formulário de confirmação fotográfica
  const [descricaoAtividade, setDescricaoAtividade] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  // Estado para Modal de Gestão de Matrículas do Professor
  const [modalGestaoMatriculas, setModalGestaoMatriculas] = useState(false);
  const [showResumoSemana, setShowResumoSemana] = useState(false);

  // Cálculos Dinâmicos
  const totalTurmas = turmas.length;
  const totalAlunos = (todosBeneficiarios ?? []).length;
  
  // Cálculo Dinâmico da Carga Horária Semanal Real baseada nos Slots de Aula (turma_horarios)
  const cargaHorariaSemanal = useMemo(() => {
    if (!slotsGrid || slotsGrid.length === 0) return 0;
    const total = slotsGrid.reduce((acc, slot) => {
      if (slot.duracaoHoras && slot.duracaoHoras > 0) {
        return acc + slot.duracaoHoras;
      }
      const dur = Math.max(1, (slot.fim ?? 10) - (slot.inicio ?? 8));
      return acc + dur;
    }, 0);
    return Math.round(total * 10) / 10;
  }, [slotsGrid]);

  const hojeIndice = new Date().getDay();
  const turmasOrdenadas = [...turmas].sort((a, b) => a.nome.localeCompare(b.nome));
  const diaSemanaAtual = DIAS_SEMANA_NOMES[hojeIndice];

  const proximosSlides = () => {
    setSlideAtual((prev) => (prev + 1) % Math.max(1, turmasOrdenadas.length));
  };

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev - 1 + turmasOrdenadas.length) % Math.max(1, turmasOrdenadas.length));
  };

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPreview(URL.createObjectURL(file));
    }
  }

const SIGLAS_DIA: Record<number, string> = {
  1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 0: "Dom"
};

function checarHorarioEncerrou(turma: TurmaApi): { encerrado: boolean; motivo?: string } {
  const agora = new Date();
  const siglaHoje = SIGLAS_DIA[agora.getDay()];
  const horaAtualDecimal = agora.getHours() + agora.getMinutes() / 60;

  const slotHoje = (turma.slots ?? []).find((s: any) => s.dia === siglaHoje);

  if (slotHoje) {
    const horaFim = Number(slotHoje.fim) || 10;
    if (horaAtualDecimal >= horaFim) {
      return {
        encerrado: true,
        motivo: `O horário previsto desta aula (${String(slotHoje.inicio).padStart(2, '0')}:00 às ${String(horaFim).padStart(2, '0')}:00) já encerrou hoje.`
      };
    }
    return { encerrado: false };
  }

  // Se não houver slot definido no banco para hoje
  const ehDiaPadrao = siglaHoje === "Seg" || siglaHoje === "Qua" || siglaHoje === "Sex";
  if (ehDiaPadrao && horaAtualDecimal >= 10) {
    return {
      encerrado: true,
      motivo: "O horário desta aula (08:00 às 10:00) já encerrou hoje."
    };
  } else if (!ehDiaPadrao && (!turma.slots || turma.slots.length === 0)) {
    return {
      encerrado: true,
      motivo: "Esta turma não possui treino/aula agendado para o dia de hoje."
    };
  }

  return { encerrado: false };
}

  function handleIniciarAtividade(turma: TurmaApi) {
    const check = checarHorarioEncerrou(turma);
    if (check.encerrado) {
      toast.error(check.motivo || "Horário encerrado. Não é permitido iniciar a atividade.");
      return;
    }
    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setStatusAtividade((prev) => ({ ...prev, [turma.id]: "em_andamento" }));
    setHoraInicio((prev) => ({ ...prev, [turma.id]: agora }));
    toast.success(`Atividade e ponto de entrada iniciados às ${agora}!`);
  }

  function handleFinalizarAtividade(turmaId: string) {
    if (!fotoPreview) {
      toast.error("Por favor, anexe uma foto de comprovação antes de finalizar a atividade.");
      return;
    }
    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setStatusAtividade((prev) => ({ ...prev, [turmaId]: "concluido" }));
    setHoraFim((prev) => ({ ...prev, [turmaId]: agora }));
    toast.success(`Atividade finalizada e ponto de saída gravado às ${agora}!`);
    setTurmaModal(null);
    setFotoPreview(null);
    setDescricaoAtividade("");
  }

  // Calcular datas reais da semana atual
  const datasSemanaDia = useMemo(() => {
    const hoje = new Date();
    const diaAtual = hoje.getDay();
    const mapa: Record<string, string> = {};
    for (const [idx, sigla] of Object.entries(SIGLAS_DIA)) {
      const diff = Number(idx) - diaAtual;
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + diff);
      mapa[sigla] = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return mapa;
  }, []);

  const hojeFormatado = datasSemanaDia[SIGLAS_DIA[hojeIndice]] || '';

  const turmasHoje = turmasOrdenadas.filter(t => t.slots?.some((s: any) => s.dia === SIGLAS_DIA[hojeIndice]));
  const outrasTurmas = turmasOrdenadas.filter(t => !t.slots?.some((s: any) => s.dia === SIGLAS_DIA[hojeIndice]));

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto py-2">
      {/* SELETOR DE VISUALIZAÇÃO PARA ADMINISTRADORES */}
      {professoresDisponiveis.length > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-lg">
              👑
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                Modo Visão de Administrador
              </span>
              <p className="text-xs text-amber-800 font-medium">
                Selecione qual professor deseja visualizar o painel operacional:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold shrink-0 text-amber-900">Ver como:</label>
            <select
              value={professor.id}
              onChange={(e) => onSelecionarProfessor?.(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-zinc-800 focus:border-amber-500 focus:outline-none shadow-sm cursor-pointer"
            >
              {professoresDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomeCompleto} ({p.funcao || "Professor"})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 1. SEÇÃO DE IDENTIFICAÇÃO E RÉGUA DE MÉTRICAS 360° */}
      <div className="flex flex-col gap-4">
        {/* Banner Superior com novo design e anatomia */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0d3b66] via-[#092d4f] to-[#1e1b4b] p-5 sm:p-6 text-white shadow-xl border border-sky-800/40 relative">
          {/* Barra superior de ações rápidas no mobile */}
          <div className="flex items-center justify-between mb-3 md:hidden">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg p-1.5 text-sky-200/80 hover:bg-white/10 hover:text-white transition-colors"
              title="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sky-200/60 text-xs font-medium">Painel do Professor</span>
            <div className="p-1.5 text-sky-200/80">
              <MoreVertical className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Bloco de Perfil (Avatar + Informações) */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-3xl shadow-lg border border-blue-400/30">
                👔
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-sky-300 font-medium truncate">
                  <UserCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{professor.funcao || "Professor / Instrutor Esportivo"}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5 tracking-tight truncate">
                  {professor.nomeCompleto}
                </h1>
                <p className="text-xs text-sky-200/80 flex items-center gap-1.5 mt-1 font-normal truncate">
                  <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">Polo: {nucleo ? nucleo.identificacao : "Polo Esportivo"}</span>
                </p>
              </div>
            </div>

            {/* Divisor vertical e Bloco de Matrícula + Ações no Desktop */}
            <div className="hidden md:flex md:items-center">
              <div className="h-12 w-px bg-white/15 mx-6" />

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-200/70">
                    Matrícula
                  </span>
                  <span className="text-base font-bold text-white tracking-wide font-mono">
                    {professor.matricula}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/80 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 hover:text-rose-100 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-rose-400" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé no Mobile: Matrícula à esquerda, Botão Sair à direita */}
            <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-white/10 md:hidden">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/70">
                  Matrícula
                </span>
                <span className="text-sm font-bold text-white tracking-wide font-mono">
                  {professor.matricula}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/80 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 hover:text-rose-100 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Régua de Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setModalGestaoMatriculas(true)}
            className="text-left p-3.5 sm:p-4 border-l-4 border-l-sky-500 bg-white hover:bg-gradient-to-br hover:from-sky-50/70 hover:to-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all active:scale-[0.98] group flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-sky-600 transition-colors truncate">
                Beneficiários
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-sky-600 p-1 sm:px-2 sm:py-0.5 text-[10px] font-extrabold text-white shadow-xs group-hover:bg-sky-700 transition-all shrink-0">
                <UserPlus className="h-3 w-3" />
                <span className="hidden sm:inline">Gerenciar</span>
              </span>
            </div>

            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 group-hover:text-sky-600 transition-colors">{totalAlunos}</span>
              <span className="text-xs text-sky-600 font-bold">Alunos</span>
            </div>
            
            <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium mt-1 flex items-center gap-1 group-hover:text-sky-700 transition-colors truncate">
              <span className="truncate">Matricular / transferir</span>
              <ChevronRight className="h-3 w-3 text-sky-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </p>
          </button>

          <Card className="p-3.5 sm:p-4 border-l-4 border-l-indigo-500 bg-white shadow-sm flex flex-col justify-between overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 truncate">Turmas Ativas</span>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-zinc-900">{totalTurmas}</span>
              <span className="text-xs text-indigo-600 font-semibold">Turmas</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1 truncate">Sob sua coordenação</p>
          </Card>

          <Card className="p-3.5 sm:p-4 border-l-4 border-l-emerald-500 bg-white shadow-sm flex flex-col justify-between overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 truncate">Carga Horária</span>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-zinc-900">{cargaHorariaSemanal}h</span>
              <span className="text-xs text-emerald-600 font-semibold">/semana</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1 truncate">Treinos programados</p>
          </Card>

          <Card className={`p-3.5 sm:p-4 border-l-4 ${pontoHoje?.registrado ? 'border-l-emerald-500' : 'border-l-amber-500'} bg-white shadow-sm flex flex-col justify-between overflow-hidden`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 truncate">Ponto Hoje</span>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 min-w-0">
              {pontoHoje?.registrado ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                    Entrada {pontoHoje.entrada || 'registrada'}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">Não Registrado</span>
                </>
              )}
            </div>
            <p className={`text-[10px] sm:text-[11px] font-semibold mt-1 truncate ${pontoHoje?.registrado ? 'text-emerald-600' : 'text-amber-600'}`}>
              {pontoHoje?.registrado
                ? pontoHoje.saida
                  ? `Saída às ${pontoHoje.saida}`
                  : "Jornada ativa"
                : "Aguardando início"}
            </p>
          </Card>
        </div>

        {/* CAMPO DE BUSCA DINÂMICA DE BENEFICIÁRIOS DO PROFESSOR */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 border border-zinc-200 shadow-sm transition-all hover:border-sky-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <Search className="h-4 w-4 text-sky-600" />
                <span>Consulta Dinâmica de Beneficiários</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Busque instantaneamente beneficiários das suas turmas por nome, matrícula ou polo
              </p>
            </div>
            <span className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200/60 px-2.5 py-1 rounded-full font-mono font-bold self-start sm:self-auto">
              {todosBeneficiarios.length} beneficiário(s) no seu escopo
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Digite o nome, matrícula ou turma do beneficiário..."
              value={buscaBeneficiario}
              onChange={(e) => setBuscaBeneficiario(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-10 py-3 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all shadow-2xs"
            />
            {buscaBeneficiario && (
              <button
                type="button"
                onClick={() => setBuscaBeneficiario("")}
                className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* RESULTADOS DINÂMICOS DA BUSCA */}
          {buscaBeneficiario.trim() !== "" && (
            <div className="mt-1 flex flex-col gap-2 max-h-72 overflow-y-auto divide-y divide-zinc-100 border-t border-zinc-100 pt-3 animate-in fade-in">
              {beneficiariosFiltradosBusca.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-1">
                  <AlertCircle className="h-5 w-5 text-zinc-300 mb-0.5" />
                  <span>Nenhum beneficiário encontrado para &quot;{buscaBeneficiario}&quot;.</span>
                </div>
              ) : (
                beneficiariosFiltradosBusca.map((b) => {
                  const turmaInfo = b.turmasInfo?.[0];
                  return (
                    <div
                      key={b.id}
                      className="pt-2.5 first:pt-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between group hover:bg-sky-50/50 p-2.5 rounded-xl transition-all border border-transparent hover:border-sky-200/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 font-extrabold text-white text-xs shadow-2xs">
                          {b.nomeCompleto.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-extrabold text-zinc-900 text-xs truncate group-hover:text-sky-700 transition-colors">
                              {b.nomeCompleto}
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                              {b.matricula}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            <span className="font-semibold text-sky-700">{turmaInfo?.turmaNome || "Turma Vinculada"}</span>
                            {" · "}
                            <span>📍 {turmaInfo?.nucleoNome || b.nucleoNome || "Polo"}</span>
                          </p>
                        </div>
                      </div>

                      {turmaInfo?.turmaId && (
                        <Link
                          href={`/professor/chamada?turmaId=${turmaInfo.turmaId}`}
                          className="self-start sm:self-auto shrink-0 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Chamada</span>
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. QUADRO DE GRADE SEMANAL DE TREINOS (MATRIZ IDENTICA AO EDITAR TURMAS) */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-600" />
            <span>Grade Semanal de Treinos do Professor</span>
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <p className="text-xs text-zinc-500 flex-1">Matriz de horários (Domingo a Sábado). Clique no bloco para registrar ponto, relatório e chamada.</p>
            <button
              type="button"
              onClick={() => setShowResumoSemana(true)}
              className="flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors self-start sm:self-auto shrink-0"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Resumo da Semana</span>
            </button>
          </div>
        </div>

        <GradeSemanalProfessor
          turmas={turmas}
          slotsGrid={slotsGrid ?? []}
          nucleo={nucleo}
          onSelectSlot={(slot, turma, dataStr) => {
            const hojeStr = new Date().toISOString().slice(0, 10);

            if (dataStr > hojeStr) {
              const parts = dataStr.split('-');
              const dataFormatada = `${parts[2]}/${parts[1]}`;
              toast.error(`Esta aula é no dia ${dataFormatada}. Volte no dia para iniciá-la.`);
              return;
            }

            // Validar limite de retroatividade
            if (dataStr < hojeStr) {
              const diasLimite = nucleo?.diasLimiteRetroativo ?? 7;
              const dataLimite = new Date();
              dataLimite.setDate(dataLimite.getDate() - diasLimite);
              const dataLimiteStr = dataLimite.toISOString().slice(0, 10);
              if (dataStr < dataLimiteStr) {
                toast.error(`Prazo de retroatividade expirado. Limite: ${diasLimite} dia(s) atrás.`);
                return;
              }
              if (!nucleo?.permitirChamadaRetroativa) {
                toast.error("Este polo não permite chamada retroativa.");
                return;
              }
            }

            setTurmaModal(turma);
            setDataAula(dataStr);
          }}
        />
      </div>

      {/* 3. MODAL DE GESTÃO DE MATRÍCULAS DO PROFESSOR */}
      <GestaoMatriculasProfessor
        turmas={turmas}
        todosBeneficiarios={todosBeneficiarios}
        isOpen={modalGestaoMatriculas}
        onClose={() => setModalGestaoMatriculas(false)}
      />

      {/* 5. FLUXO UNIFICADO DE AULA */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-emerald-600" />
            <span>Iniciar Aula (Fluxo Unificado)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Selecione a sua turma abaixo para iniciar o fluxo contínuo (Ponto, Relatório e Chamada)
          </p>
        </div>

        {turmasHoje.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 px-1">
              Turmas de Hoje ({diaSemanaAtual} — {hojeFormatado})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmasHoje.map((turma) => (
                <div key={turma.id} className="flex flex-col gap-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 p-5 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-zinc-900 truncate text-base">{turma.nome}</h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {turma.nucleo?.identificacao || nucleo?.identificacao || "Polo não especificado"}
                    </p>
                    <div className="mt-2 text-[11px] font-medium text-zinc-500 flex flex-wrap gap-1">
                      {turma.slots?.filter((s: any) => s.dia === SIGLAS_DIA[hojeIndice]).map((s: any, idx: number) => (
                        <span key={idx} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          Hoje {hojeFormatado} {s.inicio}h às {s.fim}h
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/professor/aula/${turma.id}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors active:scale-95 w-full"
                  >
                    <PlayCircle className="h-5 w-5" />
                    <span>▶ INICIAR AULA</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {outrasTurmas.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 px-1">
              Outras Turmas (sem aula hoje)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outrasTurmas.map((turma) => (
                <div key={turma.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 opacity-70">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-zinc-700 truncate text-base">{turma.nome}</h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {turma.nucleo?.identificacao || nucleo?.identificacao || "Polo não especificado"}
                    </p>
                    <div className="mt-2 text-[11px] font-medium text-zinc-400 flex flex-wrap gap-1">
                      {turma.slots?.map((s: any, idx: number) => (
                        <span key={idx} className="bg-zinc-100 px-1.5 py-0.5 rounded">
                          {s.dia} {datasSemanaDia[s.dia] || ''} {s.inicio}h-{s.fim}h
                        </span>
                      )) || <span>Sem horários definidos</span>}
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 italic text-center">
                    Disponível apenas nos dias da grade
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {turmasHoje.length === 0 && outrasTurmas.length > 0 && (
          <div className="py-6 text-center text-sm text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            Você não tem aulas programadas para hoje ({diaSemanaAtual}).
          </div>
        )}

        {turmas.length === 0 && (
          <div className="py-8 text-center text-sm text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            Nenhuma turma vinculada ao seu perfil.
          </div>
        )}
      </div>

      {/* MODAL INTELIGENTE DE AÇÕES DA ATIVIDADE / TURMA */}
      {turmaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">Ações da Atividade</span>
                <h3 className="text-lg font-extrabold text-zinc-900">{turmaModal.nome}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{turmaModal.nucleo?.identificacao || "Polo Esportivo Palmas"}</p>
              </div>
              <button
                type="button"
                onClick={() => setTurmaModal(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* DATA DA AULA (somente leitura) */}
            <div className="flex items-center gap-3 rounded-2xl bg-sky-50/80 p-3.5 border border-sky-200 text-sky-950">
              <Calendar className="h-5 w-5 text-sky-600 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 block">
                  Data da Aula
                </span>
                <span className="text-sm font-bold text-zinc-900 mt-0.5 block">
                  {(() => {
                    const [y, m, d] = dataAula.split('-');
                    return `${d}/${m}/${y}`;
                  })()}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-emerald-600" />
                <span>Fluxo Unificado de Aula</span>
              </h4>
              <p className="text-xs text-emerald-700 mb-2">
                Inicie o fluxo unificado para registrar o seu ponto, enviar o relatório fotográfico e realizar a chamada de uma só vez.
              </p>

              {verificandoExecucao ? (
                <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-500">
                  <span className="animate-pulse">Verificando aula...</span>
                </div>
              ) : execucaoAtiva ? (
                <Link
                  href={`/professor/aula/${turmaModal.id}`}
                  className="w-full justify-center flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-colors active:scale-95"
                >
                  <StopCircle className="h-5 w-5" />
                  <span>⏩ CONTINUAR AULA EM ANDAMENTO</span>
                </Link>
              ) : (
                <Link
                  href={`/professor/aula/${turmaModal.id}`}
                  className="w-full justify-center flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors active:scale-95"
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>▶ INICIAR AULA (Ponto, Relatório e Chamada)</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL BLOQUEANTE: AULA AUTO-ENCERRADA */}
      {autoEncerradas.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">Aula Encerrada Automaticamente</h3>
                <p className="text-xs text-zinc-500">Confirme o encerramento para continuar usando o sistema.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <p className="font-bold mb-1">Sua aula não foi encerrada manualmente.</p>
              <p className="text-xs text-amber-700">
                O sistema registrou o encerramento no horário previsto. Confirme abaixo para liberar o sistema.
              </p>
            </div>

            {autoEncerradas.map((ae) => {
              const turmaInfo = turmas.find((t) => t.id === ae.turmaId);
              return (
                <div key={ae.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-500 uppercase">Turma</span>
                      <p className="text-sm font-bold text-zinc-900">{turmaInfo?.nome || ae.turmaId.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-500 uppercase">Data</span>
                      <p className="text-sm font-mono text-zinc-900">
                        {ae.data ? ae.data.split('-').reverse().join('/') : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-600">
                    <span>Início previsto: <strong>{ae.horaInicioPrevista?.slice(0, 5)}</strong></span>
                    <span>Fim registrado: <strong>{ae.horaFimPrevista?.slice(0, 5)}</strong></span>
                  </div>

                  {/* Foto opcional */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600">Foto comprobatória (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setFotoAutoFile(f);
                          setFotoAutoPreview(URL.createObjectURL(f));
                        }
                      }}
                      className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-700 hover:file:bg-zinc-300 cursor-pointer"
                    />
                    {fotoAutoPreview && (
                      <img src={fotoAutoPreview} alt="Preview" className="h-24 w-auto rounded-lg object-cover border" />
                    )}
                  </div>

                  {/* Divergência escondida */}
                  <button
                    type="button"
                    onClick={() => setMostrarDivergencia(!mostrarDivergencia)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 underline self-start cursor-pointer"
                  >
                    {mostrarDivergencia ? 'Ocultar opções' : 'Houve divergência no horário?'}
                  </button>

                  {mostrarDivergencia && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex flex-col gap-2">
                      <p className="font-bold">⚠ Solicitar revisão de horário</p>
                      <p>Descreva o que aconteceu. A informação será enviada ao coordenador para análise.</p>
                      <textarea
                        value={justificativaDivergencia}
                        onChange={(e) => setJustificativaDivergencia(e.target.value)}
                        rows={3}
                        placeholder="Ex: A aula terminou 20 minutos antes porque..."
                        className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-red-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-red-500">Obs: O horário atual permanecerá até aprovação do coordenador.</p>
                    </div>
                  )}

                  {/* Botão confirmar */}
                  <button
                    type="button"
                    disabled={confirmandoAuto}
                    onClick={async () => {
                      if (mostrarDivergencia && !justificativaDivergencia.trim()) {
                        toast.error('Descreva a divergência antes de confirmar.');
                        return;
                      }
                      setConfirmandoAuto(true);
                      try {
                        let fotoUrl: string | undefined;
                        if (fotoAutoFile) {
                          fotoUrl = await professoresApi.uploadComprovacao(fotoAutoFile, fotoAutoFile.name);
                        }
                        await execucoesAulaApi.confirmarEncerramento(ae.id, {
                          fotoComprovanteUrl: fotoUrl,
                          divergencia: mostrarDivergencia,
                          justificativaDivergencia: mostrarDivergencia ? justificativaDivergencia.trim() : undefined,
                        });
                        setAutoEncerradas((prev) => prev.filter((x) => x.id !== ae.id));
                        setFotoAutoFile(null);
                        setFotoAutoPreview(null);
                        setMostrarDivergencia(false);
                        setJustificativaDivergencia("");
                        toast.success(
                          mostrarDivergencia
                            ? 'Divergência registrada. Aguardando aprovação do coordenador.'
                            : 'Encerramento confirmado com sucesso.'
                        );
                      } catch (err: any) {
                        toast.error(err.message || 'Erro ao confirmar.');
                      } finally {
                        setConfirmandoAuto(false);
                      }
                    }}
                    className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {confirmandoAuto ? 'Confirmando...' : '✓ Confirmar Encerramento'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* MODAL DE RESUMO SEMANAL (TEXTO) */}
      {showResumoSemana && (() => {
        const SIGLAS_DIA_MAP: Record<number, string> = { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" };
        const hoje = new Date();
        const diaAtual = hoje.getDay();

        // Mapa de data por dia da semana
        const dataPorSigla: Record<string, string> = {};
        [0, 1, 2, 3, 4, 5, 6].forEach(num => {
          const diff = num - diaAtual;
          const d = new Date(hoje);
          d.setDate(hoje.getDate() + diff);
          const sigla = SIGLAS_DIA_MAP[num];
          dataPorSigla[sigla] = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
        });

        const NOMES_CURTOS: Record<string, string> = { Dom: "Dom", Seg: "Seg", Ter: "Ter", Qua: "Qua", Qui: "Qui", Sex: "Sex", "Sáb": "Sáb" };

        // Agrupar por turma
        const blocosPorTurma = turmas.map(t => {
          const nucleoNome = t.nucleo?.identificacao || nucleo?.identificacao || "Polo";
          const diasDaTurma = (t.slots ?? [])
            .sort((a: any, b: any) => {
              const ordem: Record<string, number> = { Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, "Sáb": 6 };
              return (ordem[a.dia] ?? 9) - (ordem[b.dia] ?? 9);
            })
            .map((s: any) => {
              const data = dataPorSigla[s.dia] || "";
              return `• ${NOMES_CURTOS[s.dia] ?? s.dia} (${data}) — ${String(s.inicio).padStart(2, "0")}h às ${String(s.fim).padStart(2, "0")}h`;
            });

          if (diasDaTurma.length === 0) return null;

          return `*${t.nome}*\n📍 _${nucleoNome}_\n${diasDaTurma.join("\n")}`;
        }).filter(Boolean);

        const textoResumo = blocosPorTurma.length > 0
          ? blocosPorTurma.join("\n\n")
          : "Nenhuma aula programada para esta semana.";

        const textoCompleto = `*GRADE SEMANAL*\n_${professor?.nomeCompleto || "Professor"}_\n\n${textoResumo}\n\n✅ *${turmas.length} turma(s) no total*`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4 max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">Resumo Textual</span>
                  <h3 className="text-lg font-extrabold text-zinc-900">Grade da Semana</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResumoSemana(false)}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <pre className="text-xs text-zinc-800 font-mono whitespace-pre-wrap leading-relaxed">{textoCompleto}</pre>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(textoCompleto);
                  toast.success("Resumo copiado!");
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-colors active:scale-95 w-full"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar Resumo</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
