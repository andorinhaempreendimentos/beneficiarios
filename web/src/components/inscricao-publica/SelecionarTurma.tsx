"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, Clock, Sun, Sunset, Users, XCircle } from "lucide-react";
import Link from "next/link";
import type { Turma } from "@/lib/types";

interface SelecionarTurmaProps {
  turmas: Turma[];
  titulo?: string;
}

function obterTurnoTurma(t: Turma): "manha" | "tarde" {
  const texto = `${t.nome} ${t.horario || ""}`.toLowerCase();
  if (texto.includes("manhã") || texto.includes("manha") || texto.includes("08:") || texto.includes("09:") || texto.includes("10:") || texto.includes("11:")) {
    return "manha";
  }
  if (texto.includes("tarde") || texto.includes("12:") || texto.includes("13:") || texto.includes("14:") || texto.includes("15:") || texto.includes("16:") || texto.includes("17:")) {
    return "tarde";
  }
  return "manha";
}

export function SelecionarTurma({ turmas, titulo = "Escolha uma turma" }: SelecionarTurmaProps) {
  const [filtroTurno, setFiltroTurno] = useState<"todos" | "manha" | "tarde">("todos");

  const turmasFiltradas = turmas.filter((t) => {
    if (filtroTurno === "todos") return true;
    return obterTurnoTurma(t) === filtroTurno;
  });

  const qtdManha = turmas.filter((t) => obterTurnoTurma(t) === "manha").length;
  const qtdTarde = turmas.filter((t) => obterTurnoTurma(t) === "tarde").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{titulo}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Selecione a turma com o horário que melhor se encaixa na sua rotina.
          </p>
        </div>

        {/* Filtro por Turno (Manhã / Tarde) */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setFiltroTurno("todos")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filtroTurno === "todos"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Todos ({turmas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTurno("manha")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filtroTurno === "manha"
                ? "bg-sky-600 text-white shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Manhã ({qtdManha})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTurno("tarde")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filtroTurno === "tarde"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Sunset className="h-3.5 w-3.5" />
            Tarde ({qtdTarde})
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {turmasFiltradas.map((t) => {
          const vagasTotais = Number(t.vagasTotais || 0);
          const qtdBeneficiarios = Number(t.qtdBeneficiarios || 0);
          const vagasLivres = vagasTotais - qtdBeneficiarios;
          const cheia = vagasLivres <= 0;
          const turno = obterTurnoTurma(t);

          return (
            <Link
              key={t.id}
              href={`/inscricao/turma/${t.id}`}
              className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                cheia
                  ? "border-zinc-200 bg-zinc-50 opacity-70 pointer-events-none"
                  : "border-zinc-200 bg-white hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{t.nome}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      turno === "manha"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {turno === "manha" ? "Manhã" : "Tarde"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
                  {(t.horario || (Array.isArray(t.slots) && t.slots.length > 0)) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.horario || `${t.slots?.[0]?.inicio || 8}h–${t.slots?.[0]?.fim || 10}h`}
                    </span>
                  )}
                  {((Array.isArray(t.dias) && t.dias.length > 0) || (Array.isArray(t.slots) && t.slots.length > 0)) && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {Array.isArray(t.dias) && t.dias.length > 0
                        ? t.dias.join(", ")
                        : Array.from(new Set((t.slots || []).map((s: any) => s.dia).filter(Boolean))).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {cheia ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-500">Vagas esgotadas</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      {vagasLivres} vaga{vagasLivres !== 1 ? "s" : ""} disponível
                    </span>
                    <Users className="ml-2 h-4 w-4 text-zinc-300" />
                    <span className="text-sm text-zinc-400">{qtdBeneficiarios}/{vagasTotais}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}

        {turmasFiltradas.length === 0 && (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-400">
            Nenhuma turma disponível no turno selecionado.
          </p>
        )}
      </div>
    </div>
  );
}
