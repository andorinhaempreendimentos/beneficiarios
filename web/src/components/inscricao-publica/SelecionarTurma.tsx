"use client";

import { CalendarDays, CheckCircle, Clock, Users, XCircle, Award } from "lucide-react";
import Link from "next/link";
import type { TurmaApi } from "@/lib/api/services";
import type { Turma } from "@/lib/types";

interface SelecionarTurmaProps {
  turmas: (TurmaApi | Turma)[];
  titulo?: string;
}

const DIAS_EXTENSO_MAP: Record<string, string> = {
  Seg: "Segunda-feira",
  Ter: "Terça-feira",
  Qua: "Quarta-feira",
  Qui: "Quinta-feira",
  Sex: "Sexta-feira",
  Sab: "Sábado",
  Dom: "Domingo",
  "1": "Segunda-feira",
  "2": "Terça-feira",
  "3": "Quarta-feira",
  "4": "Quinta-feira",
  "5": "Sexta-feira",
  "6": "Sábado",
  "0": "Domingo",
};

function formatarHoraSlot(hora: string | number | undefined): string {
  if (hora == null) return "00:00";
  const str = String(hora);
  if (str.includes(":")) return str.slice(0, 5);
  return `${str.padStart(2, "0")}:00`;
}

export function SelecionarTurma({ turmas, titulo = "Escolha um grupo" }: SelecionarTurmaProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-900">{titulo}</h2>
        <p className="text-sm text-zinc-500">
          Selecione o grupo com a grade semanal de sessões e faixa etária ideal para o participante.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {turmas.map((t: any) => {
          const vagasTotais = Number(t.vagasTotais || 0);
          const qtdBeneficiarios = Number(t.qtdBeneficiarios || t.vagasOcupadas || 0);
          const vagasLivres = t.vagasLivres != null ? Number(t.vagasLivres) : Math.max(0, vagasTotais - qtdBeneficiarios);
          const cheia = vagasLivres <= 0;

          const termoGrupo = t.atividade?.termoGrupo || "Grupo";
          const termoSessao = t.atividade?.termoSessao || "Sessão";
          const termoParticipante = t.atividade?.termoParticipante || "Participante";

          const minIdade = t.idadeMinima ?? t.faixaEtaria?.idadeMinima ?? t.categoria?.idadeMinima ?? t.atividade?.idadeMinima;
          const maxIdade = t.idadeMaxima ?? t.faixaEtaria?.idadeMaxima ?? t.categoria?.idadeMaxima ?? t.atividade?.idadeMaxima;
          const faixaEtariaNome = t.faixaEtaria?.nome || t.categoria?.nome;

          const slots: any[] = Array.isArray(t.slots) ? t.slots : [];

          return (
            <Link
              key={t.id}
              href={`/inscricao/turma/${t.id}`}
              className={`flex flex-col gap-4 rounded-2xl border p-5 transition-all ${
                cheia
                  ? "border-zinc-200 bg-zinc-50 opacity-70 pointer-events-none"
                  : "border-zinc-200 bg-white hover:border-sky-400 hover:bg-sky-50/30 hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                      {termoGrupo}
                    </span>

                    {/* Faixa de Idade */}
                    {(minIdade != null || maxIdade != null || faixaEtariaNome) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-200">
                        <Award className="h-3 w-3 text-amber-700" />
                        {faixaEtariaNome
                          ? faixaEtariaNome
                          : minIdade != null && maxIdade != null
                          ? `${minIdade} a ${maxIdade} anos`
                          : minIdade != null
                          ? `A partir de ${minIdade} anos`
                          : `Até ${maxIdade} anos`}
                      </span>
                    )}

                    {t.nucleo?.identificacao && (
                      <span className="text-xs text-zinc-400 font-medium">
                        · {t.nucleo.identificacao}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-zinc-900">{t.nome}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {cheia ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                      <XCircle className="h-4 w-4" />
                      <span>Vagas esgotadas</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          {vagasLivres} vaga{vagasLivres !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        ({qtdBeneficiarios}/{vagasTotais})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grade Semanal de Sessões */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-400 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-sky-600" />
                  Grade Semanal de {termoSessao}s:
                </span>

                {slots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
                    {slots.map((s, idx) => {
                      const diaNome = DIAS_EXTENSO_MAP[s.dia] || DIAS_EXTENSO_MAP[String(s.diaSemana ?? s.dia_semana)] || s.dia || "Dia";
                      const horaIni = formatarHoraSlot(s.inicio);
                      const horaFim = formatarHoraSlot(s.fim);
                      const instrutor = s.responsavel?.nomeCompleto || s.responsavelNome;
                      const atividadeSlot = s.atividade?.nome;

                      return (
                        <div key={idx} className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-sky-500 shrink-0" />
                            <span className="font-semibold text-zinc-800">{diaNome}</span>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {horaIni} às {horaFim}
                            </span>
                          </div>
                          {(instrutor || atividadeSlot) && (
                            <span className="text-[10px] font-medium text-zinc-400 truncate max-w-[120px]">
                              {[atividadeSlot, instrutor].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{t.horario || "Horário a combinar no núcleo"}</span>
                    {Array.isArray(t.dias) && t.dias.length > 0 && (
                      <span>({t.dias.join(", ")})</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {turmas.length === 0 && (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-400">
            Nenhum grupo disponível no momento.
          </p>
        )}
      </div>
    </div>
  );
}
