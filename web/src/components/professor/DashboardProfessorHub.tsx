"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { GestaoMatriculasProfessor } from "./GestaoMatriculasProfessor";
import { GradeSemanalProfessor } from "./GradeSemanalProfessor";
import type { FuncionarioApi, TurmaApi, NucleoApi, BeneficiarioApi, SlotAulaGrid } from "@/lib/api/services";
import { areaProfessorApi } from "@/lib/api/services";

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

  // Data da aula selecionada para aplicacao/ponto (padrao YYYY-MM-DD hoje)
  const [dataAula, setDataAula] = useState<string>(new Date().toISOString().split("T")[0]);

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

  // Cálculos Dinâmicos
  const totalTurmas = turmas.length;
  const totalAlunos = (todosBeneficiarios ?? []).length;
  const cargaHorariaSemanal = totalTurmas > 0 ? totalTurmas * 2 : 0;

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

  const acoesRapidas = [
    {
      id: "ponto",
      titulo: "1. Bater Ponto",
      descricao: "Registrar entrada/saída com data e hora em tempo real",
      icone: Clock,
      corIcone: "text-sky-600 bg-sky-50",
      href: `/funcionarios/${professor.id}/ponto`,
      badge: "Ponto de Hoje",
      badgeTone: "sky" as const,
    },
    {
      id: "confirmacao",
      titulo: "2. Confirmação de Serviço",
      descricao: "Upload de foto da aula e diário de atividades de campo",
      icone: Camera,
      corIcone: "text-indigo-600 bg-indigo-50",
      href: "/professor/confirmacao",
      badge: "Relatório de Aula",
      badgeTone: "green" as const,
    },
    {
      id: "chamada",
      titulo: "3. Chamada Diária",
      descricao: "Registrar presença e falta dos alunos inscritos",
      icone: Users,
      corIcone: "text-emerald-600 bg-emerald-50",
      href: "/professor/chamada",
      badge: "Lista de Presença",
      badgeTone: "green" as const,
    },
  ];

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
        {/* Banner Superior */}
        <div className="rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-950 p-6 text-white shadow-2xl border border-sky-700/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold backdrop-blur-md border border-white/20 shadow-inner">
                👔
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/20 px-3 py-0.5 text-xs font-bold text-sky-200 backdrop-blur-md border border-sky-300/30">
                  <Sparkles className="h-3 w-3 text-sky-300" />
                  {professor.funcao || "Professor / Instrutor Esportivo"}
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
                  {professor.nomeCompleto}
                </h1>
                <p className="text-xs text-sky-200 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-sky-300" />
                  Polo: {nucleo ? nucleo.identificacao : "Polo Esportivo Palmas/TO"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md text-right border border-white/10">
                <span className="block text-[10px] text-sky-200 uppercase font-bold tracking-wider">Matrícula</span>
                <span className="text-sm font-extrabold font-mono text-white">{professor.matricula}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-2xl bg-red-500/20 px-4 py-3.5 text-xs font-bold text-red-100 hover:bg-red-500/30 border border-red-400/30 transition-all shadow-md active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Régua de Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setModalGestaoMatriculas(true)}
            className="text-left p-4 border-l-4 border-l-sky-500 bg-white hover:bg-gradient-to-br hover:from-sky-50/70 hover:to-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all active:scale-[0.98] group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-sky-600 transition-colors">
                Beneficiários Atendidos
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-xs group-hover:bg-sky-700 group-hover:scale-105 transition-all">
                <UserPlus className="h-3 w-3" />
                <span>Gerenciar</span>
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-900 group-hover:text-sky-600 transition-colors">{totalAlunos}</span>
              <span className="text-xs text-sky-600 font-bold">Beneficiários</span>
            </div>
            
            <p className="text-[11px] text-zinc-500 font-medium mt-1 flex items-center gap-1 group-hover:text-sky-700 transition-colors">
              <span>Clique para matricular / transferir</span>
              <ChevronRight className="h-3 w-3 text-sky-500 transition-transform group-hover:translate-x-0.5" />
            </p>
          </button>

          <Card className="p-4 border-l-4 border-l-indigo-500 bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Turmas Ativas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-900">{totalTurmas}</span>
              <span className="text-xs text-indigo-600 font-semibold">Turmas</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Sob sua coordenação</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500 bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Carga Horária</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-900">{cargaHorariaSemanal}h</span>
              <span className="text-xs text-emerald-600 font-semibold">/semana</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Treinos programados</p>
          </Card>

          <Card className={`p-4 border-l-4 ${pontoHoje?.registrado ? 'border-l-emerald-500' : 'border-l-amber-500'} bg-white shadow-sm`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Status Ponto Hoje</span>
            <div className="mt-1 flex items-center gap-1.5">
              {pontoHoje?.registrado ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-bold text-zinc-900">
                    Entrada {pontoHoje.entrada || 'registrada'}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-bold text-zinc-900">Ponto Não Registrado</span>
                </>
              )}
            </div>
            <p className={`text-[11px] font-semibold mt-0.5 ${pontoHoje?.registrado ? 'text-emerald-600' : 'text-amber-600'}`}>
              {pontoHoje?.registrado
                ? pontoHoje.saida
                  ? `Saída registrada às ${pontoHoje.saida}`
                  : "Jornada em andamento"
                : "Aguardando entrada de hoje"}
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
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group hover:bg-sky-50/50 p-2.5 rounded-xl transition-all border border-transparent hover:border-sky-200/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 font-extrabold text-white text-xs shadow-2xs">
                          {b.nomeCompleto.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-zinc-900 text-xs truncate group-hover:text-sky-700 transition-colors">
                              {b.nomeCompleto}
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                              Mat: {b.matricula}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-sky-700">{turmaInfo?.turmaNome || "Turma Vinculada"}</span>
                            <span>·</span>
                            <span>📍 {turmaInfo?.nucleoNome || b.nucleoNome || "Polo Esportivo"}</span>
                          </p>
                        </div>
                      </div>

                      {turmaInfo?.turmaId && (
                        <Link
                          href={`/professor/chamada?turmaId=${turmaInfo.turmaId}`}
                          className="shrink-0 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Abrir Chamada</span>
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
          <p className="text-xs text-zinc-500">Matriz de horários (Segunda a Sábado). Clique no bloco da aula para registrar ponto, relatório e chamada.</p>
        </div>

        <GradeSemanalProfessor
          turmas={turmas}
          slotsGrid={slotsGrid ?? []}
          onSelectSlot={(slot, turma) => {
            setTurmaModal(turma);
            setDataAula(new Date().toISOString().split("T")[0]);
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

      {/* 5. MENU DE AÇÕES RÁPIDAS */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 px-1">
          Menu Operacional Rápido
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {acoesRapidas.map((acao) => {
            const Icone = acao.icone;
            return (
              <Link
                key={acao.id}
                href={acao.href}
                className="group flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-sky-500 hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${acao.corIcone}`}>
                  <Icone className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-zinc-900 group-hover:text-sky-600 transition-colors text-sm">
                      {acao.titulo}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-sky-600 transition-transform" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {acao.descricao}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MODAL INTELIGENTE DE AÇÕES DA ATIVIDADE / TURMA */}
      {turmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 flex flex-col gap-5">
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

            {/* SELETOR DE DATA DA AULA */}
            <div className="flex items-center gap-3 rounded-2xl bg-sky-50/80 p-3.5 border border-sky-200 text-sky-950">
              <Calendar className="h-5 w-5 text-sky-600 shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 block">
                  Data da Aula para Aplicação & Ponto
                </label>
                <input
                  type="date"
                  value={dataAula}
                  onChange={(e) => setDataAula(e.target.value)}
                  className="text-xs font-bold text-zinc-900 bg-white px-2 py-1 rounded-lg border border-sky-300 focus:outline-none cursor-pointer mt-0.5"
                />
              </div>
            </div>

            {/* Opção 1: Iniciar / Finalizar Atividade e Ponto */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sky-600" />
                <span>1. Início de Atividade & Ponto do Professor</span>
              </h4>

              {statusAtividade[turmaModal.id] !== "em_andamento" && statusAtividade[turmaModal.id] !== "concluido" && (() => {
                const checkHorario = checarHorarioEncerrou(turmaModal);
                if (checkHorario.encerrado) {
                  return (
                    <div className="rounded-xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-300 font-medium flex items-start gap-2.5 shadow-2xs">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-amber-950">Horário Encerrado / Bloqueado</span>
                        <span className="text-amber-800">{checkHorario.motivo} Não é permitido iniciar a atividade fora do horário previsto.</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <Button
                    onClick={() => handleIniciarAtividade(turmaModal)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                  >
                    <PlayCircle className="h-5 w-5" />
                    <span>Iniciar Atividade & Bater Entrada</span>
                  </Button>
                );
              })()}

              {statusAtividade[turmaModal.id] === "em_andamento" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl bg-emerald-100/70 p-3 text-xs text-emerald-900 font-semibold border border-emerald-300">
                    ✓ Atividade em andamento! Entrada registrada às <span className="font-mono font-bold">{horaInicio[turmaModal.id]}</span> para a data <span className="font-mono font-bold">{dataAula.split('-').reverse().join('/')}</span>.
                  </div>

                  <Field label="Descrição da Atividade Aplicada" required>
                    <Input
                      placeholder="Ex: Treino de fundamentos de passe e drible"
                      value={descricaoAtividade}
                      onChange={(e) => setDescricaoAtividade(e.target.value)}
                    />
                  </Field>

                  <Field label="Foto de Comprovação da Aula (Obrigatória para saída)">
                    <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-4 text-center hover:bg-white transition-colors">
                      {fotoPreview ? (
                        <div className="flex flex-col items-center gap-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={fotoPreview} alt="Comprovação" className="h-32 rounded-lg object-cover" />
                          <span className="text-[11px] text-green-600 font-semibold">Foto anexada ✓</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-zinc-400 mb-1" />
                          <span className="text-xs font-semibold text-zinc-700">Anexar Foto da Aula</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFoto}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </Field>

                  <Button
                    onClick={() => handleFinalizarAtividade(turmaModal.id)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <StopCircle className="h-5 w-5" />
                    <span>Finalizar Atividade & Confirmar Ponto de Saída</span>
                  </Button>
                </div>
              )}

              {statusAtividade[turmaModal.id] === "concluido" && (
                <div className="rounded-xl bg-blue-100/70 p-3 text-xs text-blue-900 font-semibold border border-blue-300">
                  ✓ Atividade e Ponto concluídos para {dataAula.split('-').reverse().join('/')}! Entrada: {horaInicio[turmaModal.id]} · Saída: {horaFim[turmaModal.id]}
                </div>
              )}
            </div>

            {/* Opção 2: Dar Presença na Data */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>2. Frequência de Beneficiários</span>
              </h4>

              <Link
                href={`/professor/chamada?turmaId=${turmaModal.id}&data=${dataAula}`}
                className="w-full justify-center flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Dar Presença para os Alunos em {dataAula.split('-').reverse().join('/')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
