"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus, X, Clock } from "lucide-react";
import type { AtividadeApi } from "@/lib/api/services";

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
  atividadeId?: string;
  atividadeNome?: string;
  isControleInterno?: boolean;
}

interface GradeSemanalProps {
  atividade?: AtividadeApi;
  atividadeNome?: string;
  atividadesLocais?: AtividadeApi[];
  slots?: SlotAula[];
  onChange?: (slots: SlotAula[]) => void;
}

function formatHora(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

// Modal de adicionar/criar slot por clique ou arrasto
interface ModalSlotProps {
  atividadeAtual?: AtividadeApi;
  atividadeNome: string;
  atividadesLocais?: AtividadeApi[];
  diasVisiveis: string[];
  initialDia?: string;
  initialInicio?: number;
  initialFim?: number;
  onConfirm: (slot: SlotAula) => void;
  onClose: () => void;
}

function ModalSlot({
  atividadeAtual,
  atividadeNome,
  atividadesLocais = [],
  diasVisiveis,
  initialDia,
  initialInicio,
  initialFim,
  onConfirm,
  onClose,
}: ModalSlotProps) {
  const [dia, setDia] = useState(initialDia || diasVisiveis[0] || "Seg");
  const [inicio, setInicio] = useState(initialInicio ?? 8);
  const [fim, setFim] = useState(initialFim ?? 9);

  const [selectedAtividadeId, setSelectedAtividadeId] = useState(atividadeAtual?.id || "");

  const atvSelecionada = atividadesLocais.find((a) => a.id === selectedAtividadeId) || atividadeAtual;
  const isControleInterno = atvSelecionada ? !atvSelecionada.disponivelPreInscricao : false;
  const nomeExibicao = atvSelecionada?.nome || atividadeNome;

  function handleConfirm() {
    if (fim <= inicio) return;
    onConfirm({
      dia,
      inicio,
      fim,
      atividadeId: atvSelecionada?.id,
      atividadeNome: nomeExibicao,
      isControleInterno,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Adicionar Slot de Horário</h3>
            <p className="text-xs text-zinc-500">Defina o tipo de aula ou atividade de controle interno</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {atividadesLocais.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Atividade / Bloco</label>
              <select
                value={selectedAtividadeId}
                onChange={(e) => setSelectedAtividadeId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                {atividadesLocais.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} {!a.disponivelPreInscricao ? "(🔒 Controle Interno)" : "(Turma)"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Dia da semana</label>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_OPCOES.filter((d) => diasVisiveis.includes(d.key)).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDia(d.key)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    dia === d.key
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                  ].join(" ")}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Início</label>
              <select
                value={inicio}
                onChange={(e) => setInicio(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                {TODAS_HORAS.slice(0, -1).map((h) => (
                  <option key={h} value={h}>{formatHora(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Fim</label>
              <select
                value={fim}
                onChange={(e) => setFim(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
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
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={fim <= inicio}>
            Adicionar à Grade
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal de opções do slot existente (Duplicar, Trocar Atividade, Deletar)
interface ModalOpcoesSlotProps {
  slot: SlotAula;
  atividadesLocais?: AtividadeApi[];
  onDuplicar: (diaDestino: string) => void;
  onTrocarAtividade: (novaAtividade: AtividadeApi) => void;
  onDeletar: () => void;
  onClose: () => void;
}

function ModalOpcoesSlot({
  slot,
  atividadesLocais = [],
  onDuplicar,
  onTrocarAtividade,
  onDeletar,
  onClose,
}: ModalOpcoesSlotProps) {
  const [aba, setAba] = useState<"opcoes" | "duplicar" | "trocar">("opcoes");
  const [diaDestino, setDiaDestino] = useState(slot.dia);
  const [novaAtividadeId, setNovaAtividadeId] = useState(slot.atividadeId || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
              <span>{slot.isControleInterno ? "🔒" : "📌"}</span>
              <span>{slot.atividadeNome || "Slot de Horário"}</span>
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {DIAS_OPCOES.find((d) => d.key === slot.dia)?.label} ({formatHora(slot.inicio)} às {formatHora(slot.fim)})
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        {aba === "opcoes" && (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setAba("duplicar")}
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-zinc-200 bg-white hover:bg-sky-50/60 hover:border-sky-300 text-left transition-all text-xs font-bold text-zinc-800 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-700 font-bold">📋</span>
                <div>
                  <span className="block text-zinc-900">Duplicar Slot</span>
                  <span className="text-[11px] font-normal text-zinc-500">Copiar para outro dia da semana</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAba("trocar")}
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-zinc-200 bg-white hover:bg-amber-50/60 hover:border-amber-300 text-left transition-all text-xs font-bold text-zinc-800 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold">🔄</span>
                <div>
                  <span className="block text-zinc-900">Trocar Atividade</span>
                  <span className="text-[11px] font-normal text-zinc-500">Alterar tipo de aula ou controle interno</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onDeletar}
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-100/60 text-left transition-all text-xs font-bold text-red-700 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-red-100 text-red-700 font-bold">🗑️</span>
                <div>
                  <span className="block text-red-900">Excluir Slot</span>
                  <span className="text-[11px] font-normal text-red-600">Remover este horário da grade</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {aba === "duplicar" && (
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-zinc-800 block">Escolha o dia para onde deseja copiar:</label>
            <div className="grid grid-cols-2 gap-2">
              {DIAS_OPCOES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDiaDestino(d.key)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    diaDestino === d.key
                      ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                      : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setAba("opcoes")}
                className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Voltar
              </button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onDuplicar(diaDestino);
                  onClose();
                }}
              >
                Confirmar Cópia
              </Button>
            </div>
          </div>
        )}

        {aba === "trocar" && (
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-zinc-800 block">Selecione a nova atividade para este slot:</label>
            <select
              value={novaAtividadeId}
              onChange={(e) => setNovaAtividadeId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
            >
              {atividadesLocais.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} {!a.disponivelPreInscricao ? "(🔒 Controle Interno)" : "(Turma)"}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setAba("opcoes")}
                className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Voltar
              </button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const novaAtv = atividadesLocais.find((a) => a.id === novaAtividadeId);
                  if (novaAtv) onTrocarAtividade(novaAtv);
                  onClose();
                }}
              >
                Salvar Alteração
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function GradeSemanal({ atividade, atividadeNome = "Aula", atividadesLocais = [], slots = [], onChange }: GradeSemanalProps) {
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
  const [slotDraft, setSlotDraft] = useState<{ dia: string; inicio: number; fim: number } | null>(null);
  const [slotSelecionadoOpcoes, setSlotSelecionadoOpcoes] = useState<SlotAula | null>(null);

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
      setSlotSelecionadoOpcoes(existing);
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

    setSlotDraft({ dia, inicio, fim });
    setModalAberto(true);

    setDragging(null);
    setDragHover(null);
  }

  function addSlotFromModal(slot: SlotAula) {
    const filtered = items.filter(
      (s) => s.dia !== slot.dia || s.fim <= slot.inicio || s.inicio >= slot.fim
    );
    notify([...filtered, slot]);
    setSlotDraft(null);
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
            <div className="flex flex-col">
              <div className="h-10 w-14 border-b border-zinc-100" />
              {horasVisiveis.map((h) => (
                <div key={h} className="flex h-12 w-14 items-start justify-end pr-2 pt-1">
                  <span className="text-[11px] text-zinc-400">{formatHora(h)}</span>
                </div>
              ))}
            </div>

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
                            className={`absolute inset-x-0.5 z-10 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-tight shadow-sm cursor-pointer hover:opacity-90 ${
                              slot.isControleInterno
                                ? "bg-amber-600 border-amber-700 text-white"
                                : "bg-sky-600 border-sky-700 text-white"
                            }`}
                            style={{ top: 2, height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)` }}
                          >
                            <div className="truncate flex items-center gap-1">
                              {slot.isControleInterno && <span>🔒</span>}
                              <span>{slot.atividadeNome || atividadeNome}</span>
                            </div>
                            <div className="opacity-90 text-[10px] font-normal">{formatHora(slot.inicio)}–{formatHora(slot.fim)}</div>
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

      {/* Modal de Criação / Arrasto */}
      {modalAberto && (
        <ModalSlot
          atividadeAtual={atividade}
          atividadeNome={atividadeNome}
          atividadesLocais={atividadesLocais}
          diasVisiveis={[...diasVisiveis]}
          initialDia={slotDraft?.dia}
          initialInicio={slotDraft?.inicio}
          initialFim={slotDraft?.fim}
          onConfirm={addSlotFromModal}
          onClose={() => {
            setModalAberto(false);
            setSlotDraft(null);
          }}
        />
      )}

      {/* Modal de Opções do Slot Existente (Duplicar, Trocar Atividade, Excluir) */}
      {slotSelecionadoOpcoes && (
        <ModalOpcoesSlot
          slot={slotSelecionadoOpcoes}
          atividadesLocais={atividadesLocais}
          onDuplicar={(diaDestino) => {
            const copia: SlotAula = {
              ...slotSelecionadoOpcoes,
              dia: diaDestino,
            };
            const filtered = items.filter(
              (s) => s.dia !== diaDestino || s.fim <= copia.inicio || s.inicio >= copia.fim
            );
            notify([...filtered, copia]);
            setSlotSelecionadoOpcoes(null);
          }}
          onTrocarAtividade={(novaAtv) => {
            const atualizado: SlotAula = {
              ...slotSelecionadoOpcoes,
              atividadeId: novaAtv.id,
              atividadeNome: novaAtv.nome,
              isControleInterno: !novaAtv.disponivelPreInscricao,
            };
            notify(items.map((s) => (s === slotSelecionadoOpcoes ? atualizado : s)));
            setSlotSelecionadoOpcoes(null);
          }}
          onDeletar={() => {
            notify(items.filter((s) => s !== slotSelecionadoOpcoes));
            setSlotSelecionadoOpcoes(null);
          }}
          onClose={() => setSlotSelecionadoOpcoes(null)}
        />
      )}
    </div>
  );
}
