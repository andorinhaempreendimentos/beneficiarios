"use client";

import { useState } from "react";
import type { TurmaApi, SlotAulaGrid } from "@/lib/api/services";

interface GradeSemanalProfessorProps {
  turmas: TurmaApi[];
  slotsGrid: SlotAulaGrid[];
  onSelectSlot: (slot: SlotAulaGrid, turma: TurmaApi) => void;
}

const DIAS_COLUNA = [
  { key: "Seg", label: "Segunda" },
  { key: "Ter", label: "Terça" },
  { key: "Qua", label: "Quarta" },
  { key: "Qui", label: "Quinta" },
  { key: "Sex", label: "Sexta" },
  { key: "Sáb", label: "Sábado" },
];

const HORAS_GRADE = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function formatHora(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function GradeSemanalProfessor({
  turmas,
  slotsGrid,
  onSelectSlot,
}: GradeSemanalProfessorProps) {
  const items: SlotAulaGrid[] = [];

  slotsGrid.forEach((s) => items.push(s));

  turmas.forEach((t) => {
    const jaTem = items.some((s) => s.turmaId === t.id);
    if (!jaTem) {
      ["Seg", "Qua", "Sex"].forEach((d) => {
        items.push({
          id: `def-${t.id}-${d}`,
          turmaId: t.id,
          turmaNome: t.nome,
          dia: d as any,
          diaSemanaNum: d === "Seg" ? 1 : d === "Qua" ? 3 : 5,
          inicio: 8,
          fim: 10,
          atividadeNome: t.atividade?.nome || "Futsal / Treino",
          nucleoNome: t.nucleo?.identificacao || "Polo Esportivo",
        });
      });
    }
  });

  function getSlot(dia: string, hora: number) {
    return items.find((s) => s.dia === dia && hora >= s.inicio && hora < s.fim);
  }

  function isSlotStart(dia: string, hora: number) {
    return items.find((s) => s.dia === dia && s.inicio === hora);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white select-none shadow-sm">
      <div className="flex min-w-[700px]">
        <div className="flex flex-col border-r border-zinc-100 bg-zinc-50/50">
          <div className="h-10 w-16 border-b border-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">
            Hora
          </div>
          {HORAS_GRADE.map((h) => (
            <div key={h} className="flex h-12 w-16 items-start justify-end pr-2 pt-1">
              <span className="text-[11px] font-mono text-zinc-400 font-medium">{formatHora(h)}</span>
            </div>
          ))}
        </div>

        {DIAS_COLUNA.map(({ key, label }) => (
          <div key={key} className="flex flex-1 flex-col border-r border-zinc-100 last:border-r-0">
            <div className="flex h-10 items-center justify-center border-b border-zinc-100 bg-zinc-50 font-extrabold text-xs text-zinc-700 uppercase tracking-wider">
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{key}</span>
            </div>

            <div className="relative">
              {HORAS_GRADE.map((hora) => {
                const slot = getSlot(key, hora);
                const isStart = isSlotStart(key, hora);

                return (
                  <div
                    key={hora}
                    className="relative h-12 border-b border-zinc-100 transition-colors hover:bg-sky-50/50"
                  >
                    {isStart && slot && (
                      <div
                        onClick={() => {
                          const tEncontrada = turmas.find((t) => t.id === slot.turmaId) || {
                            id: slot.turmaId,
                            nome: slot.turmaNome,
                            vagasTotais: 30,
                            exclusiva: false,
                            criadoEm: new Date().toISOString(),
                            nucleoId: slot.nucleoId || "",
                            atividadeId: slot.atividadeId || "",
                            responsaveis: [],
                          };
                          onSelectSlot(slot, tEncontrada);
                        }}
                        className="absolute inset-x-1 z-10 rounded-xl bg-gradient-to-b from-sky-600 to-sky-700 text-white p-2 text-xs font-semibold leading-tight shadow-md cursor-pointer hover:from-sky-500 hover:to-sky-600 transition-all border border-sky-400/40 active:scale-95 flex flex-col justify-between"
                        style={{ top: 2, height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)` }}
                      >
                        <div className="truncate font-bold text-white flex items-center justify-between gap-1">
                          <span className="truncate">{slot.turmaNome}</span>
                          <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal">
                            {formatHora(slot.inicio)}
                          </span>
                        </div>

                        <div className="text-[10px] text-sky-100 truncate mt-0.5 flex items-center gap-1 font-medium">
                          <span>📍 {slot.nucleoNome || "Polo Esportivo"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
