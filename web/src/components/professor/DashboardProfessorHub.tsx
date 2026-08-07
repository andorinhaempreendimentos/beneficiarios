"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
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
import type { FuncionarioApi, TurmaApi, NucleoApi, BeneficiarioApi } from "@/lib/api/services";

interface DashboardProfessorHubProps {
  professor: FuncionarioApi;
  nucleo?: NucleoApi;
  turmas: TurmaApi[];
  todosBeneficiarios: BeneficiarioApi[];
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
  nucleo,
  turmas,
  todosBeneficiarios,
}: DashboardProfessorHubProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [slideAtual, setSlideAtual] = useState(0);

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

  // Cálculos Dinâmicos
  const totalTurmas = turmas.length;
  const totalAlunos = 0;
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

  function handleIniciarAtividade(turmaId: string) {
    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setStatusAtividade((prev) => ({ ...prev, [turmaId]: "em_andamento" }));
    setHoraInicio((prev) => ({ ...prev, [turmaId]: agora }));
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
          <Card className="p-4 border-l-4 border-l-sky-500 bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Alunos Atendidos</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-900">{totalAlunos}</span>
              <span className="text-xs text-sky-600 font-semibold">Alunos</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Soma total das turmas</p>
          </Card>

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

          <Card className="p-4 border-l-4 border-l-amber-500 bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Status Ponto Hoje</span>
            <div className="mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-bold text-zinc-900">Entrada 08:00</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Jornada em andamento</p>
          </Card>
        </div>
      </div>

      {/* 2. QUADRO DE GRADE SEMANAL (ACIMA DAS TURMAS EM DESTAQUE) */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-600" />
            <span>Grade Semanal de Treinos (Segunda a Sábado)</span>
          </h2>
          <p className="text-xs text-zinc-500">Clique na aula para abrir a modal de Ações (Ponto, Confirmação e Presença)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {(() => {
            const diasOrdenados = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
            const diaHojeNome = diaSemanaAtual.split("-")[0];
            const indiceHoje = diasOrdenados.findIndex((d) => diaHojeNome.startsWith(d));
            
            // Reordena colocando o dia de HOJE primeiro
            const diasReordenados = indiceHoje !== -1
              ? [diasOrdenados[indiceHoje], ...diasOrdenados.slice(0, indiceHoje), ...diasOrdenados.slice(indiceHoje + 1)]
              : diasOrdenados;

            return diasReordenados.map((dia) => {
              const ehHoje = diaSemanaAtual.startsWith(dia);
              const turmasDoDia = turmas;

              return (
                <Card
                  key={dia}
                  className={`p-4 flex flex-col justify-between gap-3 min-h-[175px] transition-all ${
                    ehHoje
                      ? "border-2 border-sky-500 bg-gradient-to-b from-sky-50 via-sky-50/80 to-indigo-50/40 shadow-xl ring-2 ring-sky-500/30 sm:col-span-2 lg:col-span-1"
                      : "bg-white border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className={`text-xs font-black uppercase tracking-wider ${ehHoje ? "text-sky-800" : "text-zinc-600"}`}>
                      {dia}
                    </span>
                    {ehHoje && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm animate-pulse">
                        ★ HOJE
                      </span>
                    )}
                  </div>

                  {turmasDoDia.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {turmasDoDia.slice(0, 2).map((t) => {
                        const st = statusAtividade[t.id];
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTurmaModal(t)}
                            className={`w-full text-left rounded-xl p-3 text-xs border transition-all active:scale-95 group shadow-sm ${
                              ehHoje
                                ? "bg-white hover:bg-sky-50/80 border-sky-300 shadow-sky-100"
                                : "bg-zinc-50/80 hover:bg-zinc-100 border-zinc-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-extrabold text-zinc-900 truncate group-hover:text-sky-700">{t.nome}</span>
                              <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 font-bold">
                              <span>08:00 às 09:30</span>
                              {st === "em_andamento" && (
                                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Iniciada</span>
                              )}
                              {st === "concluido" && (
                                <span className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">Concluída</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <AlertCircle className="h-5 w-5 text-zinc-300 mb-1" />
                      <span className="text-[11px] font-medium text-zinc-400 leading-tight">
                        Sem treino agendado
                      </span>
                    </div>
                  )}
                </Card>
              );
            });
          })()}
        </div>
      </div>

      {/* 3. CARROSSEL INTELIGENTE DE TURMAS (LOGA ABAIXO DA GRADE) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-600" />
              <span>Turmas em Destaque — Aula Atual ou Próxima</span>
            </h2>
            <p className="text-xs text-zinc-500">Turmas ordenadas priorizando o horário de treino de hoje ({diaSemanaAtual})</p>
          </div>

          {turmasOrdenadas.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={slideAnterior}
                className="rounded-xl border border-zinc-200 bg-white p-2 hover:bg-zinc-50 text-zinc-600 shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={proximosSlides}
                className="rounded-xl border border-zinc-200 bg-white p-2 hover:bg-zinc-50 text-zinc-600 shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {turmasOrdenadas.length === 0 ? (
          <Card className="p-8 text-center text-zinc-400">
            Nenhuma turma vinculada a este professor no momento.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmasOrdenadas.slice(slideAtual, slideAtual + 3).map((turma, idx) => {
              const vagas = turma.vagasTotais || 0;
              const inscritos = 0;
              const porcentagem = vagas > 0 ? Math.round((inscritos / vagas) * 100) : 0;
              const ehPrimeiro = idx === 0;

              return (
                <Card
                  key={turma.id}
                  className={`p-5 flex flex-col justify-between gap-4 transition-all ${
                    ehPrimeiro
                      ? "border-2 border-sky-500 bg-sky-50/30 shadow-md ring-2 ring-sky-500/20"
                      : "border border-zinc-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={ehPrimeiro ? "sky" : "zinc"}>
                        {ehPrimeiro ? "AULA AGORA / HOJE" : "PRÓXIMA AULA"}
                      </Badge>
                      <span className="text-xs font-bold text-zinc-500 font-mono">08:00 às 09:30</span>
                    </div>

                    <h3 className="font-bold text-zinc-900 text-base mt-2">
                      {turma.nome}
                    </h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Dumbbell className="h-3.5 w-3.5 text-zinc-400" />
                      {turma.nucleo?.identificacao || "Polo Esportivo"}
                    </p>

                    <div className="mt-4 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-600">{inscritos} alunos inscritos</span>
                        <span className="text-zinc-400">{vagas} vagas</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setTurmaModal(turma)}
                    className="w-full justify-center flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-colors"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Abrir Ações da Aula</span>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. GESTÃO DE MATRÍCULAS DO PROFESSOR */}
      <GestaoMatriculasProfessor
        turmas={turmas}
        todosBeneficiarios={todosBeneficiarios}
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
                <p className="text-xs text-zinc-500 font-mono mt-0.5">Horário: 08:00 às 09:30 · {turmaModal.nucleo?.identificacao || "Polo Esportivo"}</p>
              </div>
              <button
                type="button"
                onClick={() => setTurmaModal(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Opção 1: Iniciar / Finalizar Atividade e Ponto */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sky-600" />
                <span>1. Início de Atividade & Ponto do Professor</span>
              </h4>

              {statusAtividade[turmaModal.id] !== "em_andamento" && statusAtividade[turmaModal.id] !== "concluido" && (
                <Button
                  onClick={() => handleIniciarAtividade(turmaModal.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>Iniciar Atividade & Bater Entrada</span>
                </Button>
              )}

              {statusAtividade[turmaModal.id] === "em_andamento" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl bg-emerald-100/70 p-3 text-xs text-emerald-900 font-semibold border border-emerald-300">
                    ✓ Atividade em andamento! Entrada registrada às <span className="font-mono font-bold">{horaInicio[turmaModal.id]}</span>.
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
                  ✓ Atividade e Ponto concluídos! Entrada: {horaInicio[turmaModal.id]} · Saída: {horaFim[turmaModal.id]}
                </div>
              )}
            </div>

            {/* Opção 2: Dar Presença */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>2. Frequência de Beneficiários</span>
              </h4>

              <Link
                href="/professor/chamada"
                className="w-full justify-center flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Dar Presença para os Alunos Desta Turma</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
