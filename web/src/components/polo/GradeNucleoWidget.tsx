"use client";

import { useState, useMemo } from "react";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Field, Select } from "@/components/ui";
import type { TurmaApi, CategoriaTurmaApi } from "@/lib/api/services";

const CATEGORIA_CORES: Record<string, { bg: string; border: string; text: string }> = {
  S6:  { bg: "bg-sky-500",     border: "border-sky-600",     text: "text-white" },
  S8:  { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-white" },
  S10: { bg: "bg-amber-500",   border: "border-amber-600",   text: "text-white" },
  S12: { bg: "bg-orange-500",  border: "border-orange-600",  text: "text-white" },
  S14: { bg: "bg-purple-500",  border: "border-purple-600",  text: "text-white" },
  S16: { bg: "bg-pink-500",    border: "border-pink-600",    text: "text-white" },
  S17: { bg: "bg-rose-500",    border: "border-rose-600",    text: "text-white" },
};
const COR_INTERNA = { bg: "bg-zinc-300", border: "border-zinc-400", text: "text-zinc-700" };
const COR_PADRAO  = { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-white" };

const DIAS = [
  { key: "Seg", label: "Segunda", num: 1 },
  { key: "Ter", label: "Terça",   num: 2 },
  { key: "Qua", label: "Quarta",  num: 3 },
  { key: "Qui", label: "Quinta",  num: 4 },
  { key: "Sex", label: "Sexta",   num: 5 },
  { key: "Sáb", label: "Sábado",  num: 6 },
  { key: "Dom", label: "Domingo", num: 0 },
];

const DIA_NUM_TO_KEY: Record<number, string> = {
  0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb",
};

function formatH(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

interface Slot {
  turmaId: string;
  turmaNome: string;
  dia: string;
  inicio: number;
  fim: number;
  sigla?: string;
  usoInterno?: boolean;
}

interface GradeNucleoWidgetProps {
  turmas: TurmaApi[];
  categorias: CategoriaTurmaApi[];
}

export function GradeNucleoWidget({ turmas, categorias }: GradeNucleoWidgetProps) {
  const [aberto, setAberto] = useState(false);
  const [atividadeId, setAtividadeId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  // Atividades únicas das turmas do núcleo
  const atividades = useMemo(() => {
    const seen = new Set<string>();
    return turmas
      .filter((t) => t.atividadeId && t.atividade?.nome)
      .filter((t) => {
        if (seen.has(t.atividadeId!)) return false;
        seen.add(t.atividadeId!);
        return true;
      })
      .map((t) => ({ id: t.atividadeId!, nome: t.atividade!.nome }));
  }, [turmas]);

  const turmasFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      if (atividadeId && t.atividadeId !== atividadeId) return false;
      if (categoriaId && t.categoriaId !== categoriaId) return false;
      return true;
    });
  }, [turmas, atividadeId, categoriaId]);

  const slots: Slot[] = useMemo(() => {
    return turmasFiltradas.flatMap((t) =>
      (t.slots ?? []).map((s: any) => ({
        turmaId: t.id,
        turmaNome: t.nome,
        dia: typeof s.dia === "number" ? DIA_NUM_TO_KEY[s.dia] : s.dia,
        inicio: s.inicio,
        fim: s.fim,
        sigla: t.categoria?.sigla,
        usoInterno: t.atividade?.usoInterno ?? false,
      }))
    );
  }, [turmasFiltradas]);

  const diasComSlots = useMemo(() => {
    const set = new Set(slots.map((s) => s.dia));
    return DIAS.filter((d) => set.has(d.key));
  }, [slots]);

  const horasVisiveis = useMemo(() => {
    if (slots.length === 0) return Array.from({ length: 14 }, (_, i) => i + 7);
    const min = Math.max(6, Math.min(...slots.map((s) => s.inicio)));
    const max = Math.min(22, Math.max(...slots.map((s) => s.fim)));
    return Array.from({ length: max - min }, (_, i) => i + min);
  }, [slots]);

  function getSlotsAt(dia: string, hora: number): Slot[] {
    return slots.filter((s) => s.dia === dia && s.inicio === hora);
  }

  function isSlotCovered(dia: string, hora: number): boolean {
    return slots.some((s) => s.dia === dia && hora > s.inicio && hora < s.fim);
  }

  function corSlot(slot: Slot) {
    if (slot.usoInterno) return COR_INTERNA;
    if (slot.sigla && CATEGORIA_CORES[slot.sigla]) return CATEGORIA_CORES[slot.sigla];
    return COR_PADRAO;
  }

  return (
    <div className="border-t border-zinc-100">
      {/* Botão de toggle */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          Grade Semanal
        </span>
        {aberto ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
      </button>

      {aberto && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="w-48">
              <Field label="Atividade">
                <Select value={atividadeId} onChange={(e) => setAtividadeId(e.target.value)}>
                  <option value="">Todas</option>
                  {atividades.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="w-48">
              <Field label="Categoria">
                <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Todas</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          {/* Legenda */}
          {turmasFiltradas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {turmasFiltradas.map((t) => {
                const sigla = t.categoria?.sigla;
                const interno = t.atividade?.usoInterno;
                const cor = interno
                  ? COR_INTERNA
                  : sigla && CATEGORIA_CORES[sigla]
                  ? CATEGORIA_CORES[sigla]
                  : COR_PADRAO;
                return (
                  <span
                    key={t.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cor.bg} ${cor.text}`}
                  >
                    {sigla && <span className="opacity-70">{sigla}</span>}
                    {t.nome}
                  </span>
                );
              })}
            </div>
          )}

          {/* Grade */}
          {slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
              Nenhum horário cadastrado para esse filtro
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white select-none">
              <div className="flex" style={{ minWidth: `${56 + diasComSlots.length * 120}px` }}>
                {/* Horas */}
                <div className="flex flex-col shrink-0">
                  <div className="h-10 w-14 border-b border-zinc-100" />
                  {horasVisiveis.map((h) => (
                    <div key={h} className="flex h-12 w-14 items-start justify-end pr-2 pt-1">
                      <span className="text-[11px] text-zinc-400">{formatH(h)}</span>
                    </div>
                  ))}
                </div>

                {/* Dias */}
                {diasComSlots.map(({ key, label }) => (
                  <div key={key} className="flex flex-1 flex-col border-l border-zinc-100">
                    <div className="flex h-10 items-center justify-center border-b border-zinc-100 bg-zinc-50">
                      <span className="text-xs font-semibold text-zinc-600">{label}</span>
                    </div>
                    <div className="relative">
                      {horasVisiveis.map((hora) => {
                        const slotsNaHora = getSlotsAt(key, hora);
                        const covered = isSlotCovered(key, hora);
                        return (
                          <div
                            key={hora}
                            className={`relative h-12 border-b border-zinc-100 ${covered ? "" : "bg-white"}`}
                          >
                            {slotsNaHora.map((slot, idx) => {
                              const cor = corSlot(slot);
                              const total = slotsNaHora.length;
                              return (
                                <div
                                  key={`${slot.turmaId}-${idx}`}
                                  className={`absolute z-10 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-tight overflow-hidden ${cor.bg} ${cor.border} ${cor.text}`}
                                  style={{
                                    top: 2,
                                    left: `calc(${(idx * 100) / total}% + 2px)`,
                                    width: `calc(${100 / total}% - 4px)`,
                                    height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)`,
                                  }}
                                >
                                  <div className="truncate">{slot.turmaNome}</div>
                                  <div className="text-[10px] font-normal opacity-80">
                                    {formatH(slot.inicio)}–{formatH(slot.fim)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
