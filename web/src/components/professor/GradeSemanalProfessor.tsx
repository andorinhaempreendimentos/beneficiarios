"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TurmaApi, SlotAulaGrid, NucleoApi } from "@/lib/api/services";

interface GradeSemanalProfessorProps {
  turmas: TurmaApi[];
  slotsGrid: SlotAulaGrid[];
  onSelectSlot: (slot: SlotAulaGrid, turma: TurmaApi, dataStr: string) => void;
  nucleo?: NucleoApi;
}

const DIAS_COLUNA = [
  { key: "Seg", label: "Segunda", num: 1 },
  { key: "Ter", label: "Terça", num: 2 },
  { key: "Qua", label: "Quarta", num: 3 },
  { key: "Qui", label: "Quinta", num: 4 },
  { key: "Sex", label: "Sexta", num: 5 },
  { key: "Sáb", label: "Sábado", num: 6 },
];

const HORAS_GRADE = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function formatHora(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function getSegundaDaSemana(offset: number): Date {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diffParaSegunda = dia === 0 ? -6 : 1 - dia;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diffParaSegunda + offset * 7);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

export function GradeSemanalProfessor({
  turmas,
  slotsGrid,
  onSelectSlot,
  nucleo,
}: GradeSemanalProfessorProps) {
  const [semanaOffset, setSemanaOffset] = useState(0);

  // Config de retroatividade
  const permitirRetroativa = nucleo?.permitirChamadaRetroativa === true;
  const tipoRestricao = nucleo?.tipoRestricaoChamada ?? "horario";
  const diasLimite = nucleo?.diasLimiteRetroativo ?? 7;
  const podeNavegar = permitirRetroativa && tipoRestricao === "data";

  // Calcular limites de navegação
  const semanasMaxRetro = Math.ceil(diasLimite / 7);
  const podeVoltar = podeNavegar && semanaOffset > -semanasMaxRetro;
  const podeAvancar = semanaOffset < 0;

  // Datas da semana exibida
  const segundaBase = useMemo(() => getSegundaDaSemana(semanaOffset), [semanaOffset]);

  const datasColuna = useMemo(() => {
    return DIAS_COLUNA.map((col) => {
      const d = new Date(segundaBase);
      d.setDate(segundaBase.getDate() + (col.num - 1));
      return {
        ...col,
        data: d,
        dataStr: d.toISOString().slice(0, 10),
        dataFormatada: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      };
    });
  }, [segundaBase]);

  const hojeStr = new Date().toISOString().slice(0, 10);
  const isSemanAtual = semanaOffset === 0;

  // Slots
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

  // Label da semana
  const labelSemana = useMemo(() => {
    const seg = datasColuna[0];
    const sab = datasColuna[datasColuna.length - 1];
    return `${seg.dataFormatada} — ${sab.dataFormatada}`;
  }, [datasColuna]);

  return (
    <div className="flex flex-col gap-2">
      {/* Navegação semanal */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          disabled={!podeVoltar}
          onClick={() => setSemanaOffset((o) => o - 1)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <span className="text-xs font-bold text-zinc-700">
          {isSemanAtual ? `Esta semana (${labelSemana})` : labelSemana}
        </span>

        <button
          type="button"
          disabled={!podeAvancar}
          onClick={() => setSemanaOffset((o) => o + 1)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grade */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white select-none shadow-sm">
        <div className="flex min-w-[700px]">
          <div className="flex flex-col border-r border-zinc-100 bg-zinc-50/50">
            <div className="h-12 w-16 border-b border-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">
              Hora
            </div>
            {HORAS_GRADE.map((h) => (
              <div key={h} className="flex h-12 w-16 items-start justify-end pr-2 pt-1">
                <span className="text-[11px] font-mono text-zinc-400 font-medium">{formatHora(h)}</span>
              </div>
            ))}
          </div>

          {datasColuna.map(({ key, label, dataFormatada, dataStr }) => {
            const isHoje = dataStr === hojeStr;
            const isPassado = dataStr < hojeStr;
            const isFuturo = dataStr > hojeStr;

            return (
              <div key={key + dataStr} className="flex flex-1 flex-col border-r border-zinc-100 last:border-r-0">
                <div className={`flex h-12 items-center justify-center border-b border-zinc-100 font-extrabold text-xs uppercase tracking-wider flex-col leading-tight ${
                  isHoje ? 'bg-emerald-50 text-emerald-700' : isPassado ? 'bg-amber-50/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'
                }`}>
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key}</span>
                  <span className={`text-[9px] font-mono font-normal normal-case ${isHoje ? 'text-emerald-500' : 'text-zinc-400'}`}>
                    {dataFormatada}{isHoje ? ' (hoje)' : ''}
                  </span>
                </div>

                <div className="relative">
                  {HORAS_GRADE.map((hora) => {
                    const slot = getSlot(key, hora);
                    const isStart = isSlotStart(key, hora);

                    return (
                      <div
                        key={hora}
                        className={`relative h-12 border-b border-zinc-100 transition-colors ${
                          isFuturo ? 'bg-zinc-50/30' : 'hover:bg-sky-50/50'
                        }`}
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
                              onSelectSlot(slot, tEncontrada, dataStr);
                            }}
                            className={`absolute inset-x-1 z-10 rounded-xl text-white p-2 text-xs font-semibold leading-tight shadow-md cursor-pointer transition-all border active:scale-95 flex flex-col justify-between ${
                              isFuturo
                                ? 'bg-gradient-to-b from-zinc-400 to-zinc-500 border-zinc-300/40 cursor-not-allowed opacity-60'
                                : isPassado
                                  ? 'bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400/40'
                                  : 'bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 border-sky-400/40'
                            }`}
                            style={{ top: 2, height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)` }}
                          >
                            <div className="truncate font-bold text-white flex items-center justify-between gap-1">
                              <span className="truncate">{slot.turmaNome}</span>
                              <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal">
                                {formatHora(slot.inicio)}
                              </span>
                            </div>

                            <div className="text-[10px] text-white/80 truncate mt-0.5 flex items-center gap-1 font-medium">
                              <span>📍 {slot.nucleoNome || "Polo Esportivo"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
