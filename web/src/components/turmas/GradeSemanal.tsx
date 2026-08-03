"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus, X, Clock } from "lucide-react";

const DIAS_OPCOES = [
  { key: "Dom", label: "Domingo" },
  { key: "Seg", label: "Segunda" },
  { key: "Ter", label: "Terça" },
  { key: "Qua", label: "Quarta" },
  { key: "Qui", label: "Quinta" },
  { key: "Sex", label: "Sexta" },
  { key: "Sáb", label: "Sábado" },
];

const PERIODOS = [
  { key: "manha", label: "Manhã", range: [6, 12] },
  { key: "tarde", label: "Tarde", range: [12, 18] },
  { key: "noite", label: "Noite", range: [18, 22] },
];

const TODAS_HORAS = Array.from({ length: 17 }, (_, i) => i + 6); // 06h–22h

export interface SlotAula {
  dia: string;
  inicio: number;
  fim: number;
}

interface GradeSemanalProps {
  atividadeNome?: string;
  slots?: SlotAula[];
  onChange?: (slots: SlotAula[]) => void;
}

function formatHora(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

// Modal de adicionar slot
interface ModalSlotProps {
  atividadeNome: string;
  diasVisiveis: string[];
  onConfirm: (slot: SlotAula) => void;
  onClose: () => void;
}

function ModalSlot({ atividadeNome, diasVisiveis, onConfirm, onClose }: ModalSlotProps) {
  const [dia, setDia] = useState(diasVisiveis[0] ?? "Seg");
  const [inicio, setInicio] = useState(8);
  const [fim, setFim] = useState(9);

  function handleConfirm() {
    if (fim <= inicio) return;
    onConfirm({ dia, inicio, fim });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800">Adicionar slot — {atividadeNome}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Dia */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Dia da semana</label>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_OPCOES.filter((d) => diasVisiveis.includes(d.key)).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDia(d.key)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    dia === d.key
                      ? "bg-sky-500 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                  ].join(" ")}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Início</label>
              <select
                value={inicio}
                onChange={(e) => setInicio(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                {TODAS_HORAS.slice(0, -1).map((h) => (
                  <option key={h} value={h}>{formatHora(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Fim</label>
              <select
                value={fim}
                onChange={(e) => setFim(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                {TODAS_HORAS.slice(1).map((h) => (
                  <option key={h} value={h} disabled={h <= inicio}>{formatHora(h)}</option>
                ))}
              </select>
            </div>
          </div>

          {fim <= inicio && (
            <p className="text-xs text-red-500">Horário de fim deve ser após o início.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={fim <= inicio}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GradeSemanal({ atividadeNome = "Aula", slots = [], onChange }: GradeSemanalProps) {
  const [items, setItems] = useState<SlotAula[]>(slots);
  const [diasVisiveis, setDiasVisiveis] = useState<Set<string>>(
    new Set(["Seg", "Ter", "Qua", "Qui", "Sex"])
  );
  const [periodosVisiveis, setPeriodosVisiveis] = useState<Set<string>>(
    new Set(["manha", "tarde"])
  );
  const [dragging, setDragging] = useState<{ dia: string; inicio: number } | null>(null);
  const [dragHover, setDragHover] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const horasVisiveis = TODAS_HORAS.filter((h) =>
    [...periodosVisiveis].some((p) => {
      const periodo = PERIODOS.find((x) => x.key === p);
      return periodo && h >= periodo.range[0] && h < periodo.range[1];
    })
  );

  const diasColuna = DIAS_OPCOES.filter((d) => diasVisiveis.has(d.key));

  function notify(next: SlotAula[]) {
    setItems(next);
    onChange?.(next);
  }

  function toggleDia(key: string) {
    setDiasVisiveis((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePeriodo(key: string) {
    setPeriodosVisiveis((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function getSlot(dia: string, hora: number) {
    return items.find((s) => s.dia === dia && hora >= s.inicio && hora < s.fim);
  }

  function isSlotStart(dia: string, hora: number) {
    return items.find((s) => s.dia === dia && s.inicio === hora);
  }

  function handleMouseDown(dia: string, hora: number) {
    const existing = getSlot(dia, hora);
    if (existing) {
      notify(items.filter((s) => s !== existing));
      return;
    }
    setDragging({ dia, inicio: hora });
    setDragHover(hora);
  }

  function handleMouseEnter(dia: string, hora: number) {
    if (!dragging || dragging.dia !== dia) return;
    setDragHover(hora);
  }

  function handleMouseUp(dia: string, hora: number) {
    if (!dragging || dragging.dia !== dia) {
      setDragging(null);
      setDragHover(null);
      return;
    }
    const inicio = Math.min(dragging.inicio, hora);
    const fim = Math.max(dragging.inicio, hora) + 1;
    const filtered = items.filter((s) => s.dia !== dia || s.fim <= inicio || s.inicio >= fim);
    notify([...filtered, { dia, inicio, fim }]);
    setDragging(null);
    setDragHover(null);
  }

  function addSlotFromModal(slot: SlotAula) {
    const filtered = items.filter(
      (s) => s.dia !== slot.dia || s.fim <= slot.inicio || s.inicio >= slot.fim
    );
    notify([...filtered, slot]);
  }

  const isDragHighlight = (dia: string, hora: number) => {
    if (!dragging || dragging.dia !== dia || dragHover === null) return false;
    const lo = Math.min(dragging.inicio, dragHover);
    const hi = Math.max(dragging.inicio, dragHover);
    return hora >= lo && hora <= hi;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Controles acima da grade */}
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        {/* Dias */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Dias</span>
          <div className="flex flex-wrap gap-1">
            {DIAS_OPCOES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDia(d.key)}
                className={[
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  diasVisiveis.has(d.key)
                    ? "bg-sky-500 text-white"
                    : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-100",
                ].join(" ")}
              >
                {d.key}
              </button>
            ))}
          </div>
        </div>

        {/* Períodos */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Período</span>
          <div className="flex flex-wrap gap-1">
            {PERIODOS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePeriodo(p.key)}
                className={[
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  periodosVisiveis.has(p.key)
                    ? "bg-sky-500 text-white"
                    : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-100",
                ].join(" ")}
              >
                <Clock size={11} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botão adicionar */}
        <div className="ml-auto self-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setModalAberto(true)}
            disabled={diasColuna.length === 0 || horasVisiveis.length === 0}
          >
            <Plus size={14} />
            Adicionar slot
          </Button>
        </div>
      </div>

      {/* Grade */}
      {diasColuna.length === 0 || horasVisiveis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-400">
          Selecione ao menos um dia e um período.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white select-none">
          <div className="flex" style={{ minWidth: `${56 + diasColuna.length * 80}px` }}>
            {/* Coluna horas */}
            <div className="flex flex-col">
              <div className="h-10 w-14 border-b border-zinc-100" />
              {horasVisiveis.map((h) => (
                <div key={h} className="flex h-12 w-14 items-start justify-end pr-2 pt-1">
                  <span className="text-[11px] text-zinc-400">{formatHora(h)}</span>
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {diasColuna.map(({ key, label }) => (
              <div key={key} className="flex flex-1 flex-col border-l border-zinc-100">
                <div className="flex h-10 items-center justify-center border-b border-zinc-100 bg-zinc-50">
                  <span className="hidden text-xs font-semibold text-zinc-600 sm:inline">{label}</span>
                  <span className="text-xs font-semibold text-zinc-600 sm:hidden">{key}</span>
                </div>

                <div className="relative">
                  {horasVisiveis.map((hora) => {
                    const slot = getSlot(key, hora);
                    const isStart = isSlotStart(key, hora);
                    const highlight = isDragHighlight(key, hora);

                    return (
                      <div
                        key={hora}
                        className={[
                          "relative h-12 cursor-pointer border-b border-zinc-100 transition-colors",
                          slot ? "" : highlight ? "bg-sky-100" : "hover:bg-sky-50",
                        ].join(" ")}
                        onMouseDown={() => handleMouseDown(key, hora)}
                        onMouseUp={() => handleMouseUp(key, hora)}
                        onMouseEnter={() => handleMouseEnter(key, hora)}
                      >
                        {isStart && slot && (
                          <div
                            className="absolute inset-x-0.5 z-10 rounded-md border border-sky-600 bg-sky-500 px-1.5 py-0.5 text-[11px] font-medium leading-tight text-white shadow-sm"
                            style={{ top: 2, height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)` }}
                          >
                            <div className="truncate">{atividadeNome}</div>
                            <div className="opacity-80">{formatHora(slot.inicio)}–{formatHora(slot.fim)}</div>
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
      )}

      {/* Modal */}
      {modalAberto && (
        <ModalSlot
          atividadeNome={atividadeNome}
          diasVisiveis={[...diasVisiveis]}
          onConfirm={addSlotFromModal}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
