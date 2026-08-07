"use client";

import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Users,
  Camera,
  CalendarCheck,
  MapPin,
  ChevronRight,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { FuncionarioApi, NucleoApi } from "@/lib/api/services";

interface DashboardProfessorHubProps {
  professor: FuncionarioApi;
  nucleo?: NucleoApi;
}

export function DashboardProfessorHub({ professor, nucleo }: DashboardProfessorHubProps) {
  const acoes = [
    {
      id: "ponto",
      titulo: "Bater Ponto",
      descricao: "Registrar horário de entrada/saída e visualizar espelho mensal",
      icone: Clock,
      corIcone: "text-sky-600 bg-sky-50",
      href: `/funcionarios/${professor.id}/ponto`,
      badge: "Ponto Aberto",
      badgeTone: "sky" as const,
    },
    {
      id: "confirmacao",
      titulo: "Verificação / Confirmação de Atividade",
      descricao: "Relatório fotográfico da aula ministrada e observações de campo",
      icone: Camera,
      corIcone: "text-indigo-600 bg-indigo-50",
      href: "/professor/confirmacao",
      badge: "Diário de Aula",
      badgeTone: "green" as const,
    },
    {
      id: "chamada",
      titulo: "Dar Presença para Beneficiários",
      descricao: "Realizar a chamada diária de frequência dos alunos por turma",
      icone: Users,
      corIcone: "text-emerald-600 bg-emerald-50",
      href: "/professor/chamada",
      badge: "Frequência",
      badgeTone: "green" as const,
    },
    {
      id: "agenda",
      titulo: "Agenda de Turmas & Horários",
      descricao: "Consultar dias, horários de aulas e polo de treinamento",
      icone: CalendarCheck,
      corIcone: "text-amber-600 bg-amber-50",
      href: "/professor/agenda",
      badge: "Quadro de Aulas",
      badgeTone: "amber" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2">
      {/* Banner Principal do Professor */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold backdrop-blur-md border border-white/20">
              👔
            </div>
            <div>
              <span className="inline-block rounded-full bg-sky-400/20 px-3 py-0.5 text-xs font-semibold text-sky-200 backdrop-blur-md border border-sky-300/30">
                Painel do Instrutor / Professor
              </span>
              <h1 className="text-2xl font-bold mt-1">{professor.nomeCompleto}</h1>
              <p className="text-xs text-sky-200 flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {nucleo ? nucleo.identificacao : "Polo Palmas/TO"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md text-right border border-white/10">
              <span className="block text-[10px] text-sky-200 uppercase font-semibold">Matrícula</span>
              <span className="text-sm font-bold font-mono">{professor.matricula}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Opções de Acesso */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 px-1">
          Menu de Ações Rápidas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {acoes.map((acao) => {
            const Icone = acao.icone;
            return (
              <Link
                key={acao.id}
                href={acao.href}
                className="group relative flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-sky-500 hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${acao.corIcone}`}>
                  <Icone className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-zinc-900 group-hover:text-sky-600 transition-colors">
                      {acao.titulo}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {acao.descricao}
                  </p>
                  <div className="mt-3">
                    <Badge tone={acao.badgeTone}>{acao.badge}</Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
