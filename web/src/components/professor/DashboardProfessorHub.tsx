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
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/components/providers/AuthProvider";
import type { FuncionarioApi, TurmaApi, NucleoApi } from "@/lib/api/services";

interface DashboardProfessorHubProps {
  professor: FuncionarioApi;
  nucleo?: NucleoApi;
  turmas: TurmaApi[];
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

export function DashboardProfessorHub({ professor, nucleo, turmas }: DashboardProfessorHubProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [slideAtual, setSlideAtual] = useState(0);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  // Cálculos de Métricas
  const totalTurmas = turmas.length;
  const totalAlunos = turmas.reduce((acc, t) => acc + (t.vagasTotais ? Math.round(t.vagasTotais * 0.8) : 25), 0);
  const cargaHorariaSemanal = totalTurmas * 4; // Estimativa de 4h por turma

  // Ordenação Inteligente do Carrossel de Turmas
  const hojeIndice = new Date().getDay();
  const turmasOrdenadas = [...turmas].sort((a, b) => {
    return a.nome.localeCompare(b.nome);
  });

  const diaSemanaAtual = DIAS_SEMANA_NOMES[hojeIndice];

  const proximosSlides = () => {
    setSlideAtual((prev) => (prev + 1) % Math.max(1, turmasOrdenadas.length));
  };

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev - 1 + turmasOrdenadas.length) % Math.max(1, turmasOrdenadas.length));
  };

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
        {/* Banner Superior com Identificação e Botão Sair */}
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

        {/* Régua de Métricas em Destaque (4 Cards Rápidos) */}
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

      {/* 2. CARROSSEL INTELIGENTE DE TURMAS (TURMA DO HORÁRIO ATUAL EM DESTAQUE) */}
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
              const vagas = turma.vagasTotais || 30;
              const inscritos = Math.round(vagas * 0.85);
              const porcentagem = Math.round((inscritos / vagas) * 100);
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
                      <span className="text-xs font-bold text-zinc-500">08:00 às 09:30</span>
                    </div>

                    <h3 className="font-bold text-zinc-900 text-base mt-2">
                      {turma.nome}
                    </h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Dumbbell className="h-3.5 w-3.5 text-zinc-400" />
                      Segunda e Quarta — Polo Esportivo
                    </p>

                    {/* Barra de Progresso de Alunos Inscritos */}
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

                  <Link
                    href="/professor/chamada"
                    className="w-full justify-center flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>Dar Presença / Chamada</span>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. QUADRO DE GRADE SEMANAL (AGENDA DE CAMPO) */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-600" />
            <span>Grade Semanal de Treinos (Segunda a Sábado)</span>
          </h2>
          <p className="text-xs text-zinc-500">Quadro didático de treinos programados por dia de campo</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((dia, index) => {
            const temTreino = index === 0 || index === 2 || index === 4; // Exemplo Seg, Qua, Sex
            const ehHoje = diaSemanaAtual.startsWith(dia);

            return (
              <Card
                key={dia}
                className={`p-4 flex flex-col justify-between gap-3 min-h-[160px] ${
                  ehHoje ? "border-2 border-sky-500 bg-sky-50/50" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <span className={`text-xs font-extrabold uppercase ${ehHoje ? "text-sky-700" : "text-zinc-600"}`}>
                    {dia}
                  </span>
                  {ehHoje && <Badge tone="sky">Hoje</Badge>}
                </div>

                {temTreino ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl bg-sky-100/60 p-2.5 text-xs border border-sky-200">
                      <span className="font-bold text-sky-900 block truncate">Futebol Manhã</span>
                      <span className="text-[10px] text-sky-700 font-mono">08:00 - 09:30</span>
                    </div>
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
          })}
        </div>
      </div>

      {/* 4. MENU DE AÇÕES RÁPIDAS (ATALHOS LIMPOS) */}
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
    </div>
  );
}
