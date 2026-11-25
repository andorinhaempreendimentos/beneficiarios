"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users, X, Clock } from "lucide-react";
import type { TurmaApi, SlotAulaGrid, NucleoApi } from "@/lib/api/services";
import { getDataHojeBrasil, formatDateBrasil } from "@/lib/dateUtils";

interface GradeSemanalProfessorProps {
  turmas: TurmaApi[];
  slotsGrid: SlotAulaGrid[];
  onSelectSlot: (slot: SlotAulaGrid, turma: TurmaApi, dataStr: string) => void;
  nucleo?: NucleoApi;
}

const DIAS_COLUNA = [
  { key: "Dom", label: "Domingo", num: 0 },
  { key: "Seg", label: "Segunda", num: 1 },
  { key: "Ter", label: "Terça", num: 2 },
  { key: "Qua", label: "Quarta", num: 3 },
  { key: "Qui", label: "Quinta", num: 4 },
  { key: "Sex", label: "Sexta", num: 5 },
  { key: "Sáb", label: "Sábado", num: 6 },
];

const HORAS_GRADE_PADRAO = Array.from({ length: 16 }, (_, i) => i + 7); // 07h–22h (cobre aulas até 23:00)

function formatHora(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function getDomingoDaSemana(offset: number): Date {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diffParaDomingo = -dia;
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() + diffParaDomingo + offset * 7);
  domingo.setHours(0, 0, 0, 0);
  return domingo;
}

export function GradeSemanalProfessor({
  turmas,
  slotsGrid,
  onSelectSlot,
  nucleo,
}: GradeSemanalProfessorProps) {
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [blocoEscolhaTurma, setBlocoEscolhaTurma] = useState<{
    slot: SlotAulaGrid;
    dataStr: string;
    turmas: TurmaApi[];
  } | null>(null);

  // Config de retroatividade
  const permitirRetroativa = nucleo?.permitirChamadaRetroativa === true;
  const tipoRestricao = nucleo?.tipoRestricaoChamada ?? "horario";
  const diasLimite = nucleo?.diasLimiteRetroativo ?? 7;
  const podeNavegar = permitirRetroativa && tipoRestricao === "data";

  // Data limite para retroatividade
  const dataLimiteRetro = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - diasLimite);
    return formatDateBrasil(d);
  }, [diasLimite]);

  // Calcular limites de navegação
  const semanasMaxRetro = Math.ceil(diasLimite / 7);
  const podeVoltar = podeNavegar && semanaOffset > -semanasMaxRetro;
  const podeAvancar = semanaOffset < 0;

  // Datas da semana exibida
  const domBase = useMemo(() => getDomingoDaSemana(semanaOffset), [semanaOffset]);

  const hojeStr = getDataHojeBrasil();
  const isSemanAtual = semanaOffset === 0;

  const datasColuna = useMemo(() => {
    return DIAS_COLUNA.map((col) => {
      const d = new Date(domBase);
      d.setDate(domBase.getDate() + col.num);
      const dStr = formatDateBrasil(d);
      return {
        ...col,
        data: d,
        dataStr: dStr,
        dataFormatada: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        isFuturo: dStr > hojeStr,
        isHoje: dStr === hojeStr,
        isPassado: dStr < hojeStr,
        foraDoLimite: dStr < dataLimiteRetro,
      };
    });
  }, [domBase, hojeStr, dataLimiteRetro]);

  // Slots reais vindos do banco
  const items: SlotAulaGrid[] = slotsGrid ?? [];

  const horasGrade = useMemo(() => {
    if (items.length === 0) return HORAS_GRADE_PADRAO;
    const inicio = Math.max(0, Math.min(7, ...items.map((s) => s.inicio)));
    const fim = Math.min(23, Math.max(22, ...items.map((s) => Math.max(s.inicio, s.fim - 1))));
    return Array.from({ length: Math.max(1, fim - inicio + 1) }, (_, i) => i + inicio);
  }, [items]);

  function getStartingSlots(dia: string, hora: number) {
    return items.filter((s) => s.dia === dia && s.inicio === hora);
  }

  function resolverTurmasDoSlot(slot: SlotAulaGrid): TurmaApi[] {
    const ids = slot.turmasIds && slot.turmasIds.length > 0 ? slot.turmasIds : [slot.turmaId];
    return ids.map((tid, idx) => {
      const encontrada = turmas.find((t) => t.id === tid);
      if (encontrada) return encontrada;
      return {
        id: tid,
        nome: slot.turmasNomes?.[idx] || slot.turmaNome,
        tipo: "regular",
        vagasTotais: 0,
        vagasOcupadas: 0,
        vagasLivres: 0,
        exclusiva: false,
        criadoEm: new Date().toISOString(),
        nucleoId: slot.nucleoId || "",
        atividadeId: slot.atividadeId || "",
        responsaveis: [],
      };
    });
  }

  // Se algum slot tiver menos de 2h, usar célula maior para melhor visualização
  const temSlotCurto = items.some((s) => (s.fim - s.inicio) < 2);
  const horaAlturaPx = temSlotCurto ? 96 : 48;
  const horaAlturaClass = temSlotCurto ? "h-24" : "h-12";

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
            <div className={`${horaAlturaClass} w-16 border-b border-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase`}>
              Hora
            </div>
            {horasGrade.map((h) => (
              <div key={h} className={`flex ${horaAlturaClass} w-16 items-start justify-end pr-2 pt-1`}>
                <span className="text-[11px] font-mono text-zinc-400 font-medium">{formatHora(h)}</span>
              </div>
            ))}
          </div>

          {datasColuna.map(({ key, label, dataFormatada, dataStr, isFuturo, isHoje, isPassado, foraDoLimite }) => {
            const bloqueado = isFuturo || foraDoLimite;

            return (
              <div key={key + dataStr} className="flex flex-1 flex-col border-r border-zinc-100 last:border-r-0">
                <div className={`flex ${horaAlturaClass} items-center justify-center border-b border-zinc-100 font-extrabold text-xs uppercase tracking-wider flex-col leading-tight ${
                  isHoje ? 'bg-emerald-50 text-emerald-700' : foraDoLimite ? 'bg-red-50/30 text-zinc-400' : isPassado ? 'bg-amber-50/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'
                }`}>
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key}</span>
                  <span className={`text-[9px] font-mono font-normal normal-case ${isHoje ? 'text-emerald-500' : foraDoLimite ? 'text-red-400' : 'text-zinc-400'}`}>
                    {dataFormatada}{isHoje ? ' (hoje)' : foraDoLimite ? ' (fora do prazo)' : ''}
                  </span>
                </div>

                <div className="relative">
                  {horasGrade.map((hora) => {
                    const startingSlots = getStartingSlots(key, hora);

                    return (
                      <div
                        key={hora}
                        className={`relative ${horaAlturaClass} border-b border-zinc-100 transition-colors ${
                          bloqueado ? 'bg-zinc-50/30' : 'hover:bg-sky-50/50'
                        }`}
                      >
                        {startingSlots.length > 0 && (
                          <div
                            className="absolute inset-x-1 z-10 flex gap-1"
                            style={{
                              top: 2,
                              height: `calc(${Math.max(1, Math.max(...startingSlots.map((s) => s.fim - s.inicio))) * horaAlturaPx}px - 4px)`,
                            }}
                          >
                            {startingSlots.map((slot) => {
                              const turmasDoBloco = resolverTurmasDoSlot(slot);
                              const isMultiTurma = turmasDoBloco.length > 1;
                              const isPlanejamento = turmasDoBloco.every(
                                (t) => t.tipo === "operacional" || t.nome?.toLowerCase().includes("planejamento")
                              );
                              const semBeneficiarios =
                                !isPlanejamento && turmasDoBloco.every((t) => (t.vagasOcupadas ?? 0) === 0);
                              const tituloCard = isMultiTurma
                                ? turmasDoBloco.map((t) => t.nome).join(" + ")
                                : turmasDoBloco[0]?.nome || slot.turmaNome;

                              return (
                                <div
                                  key={slot.id}
                                  onClick={() => {
                                    if (bloqueado) return;
                                    if (turmasDoBloco.length > 1) {
                                      setBlocoEscolhaTurma({ slot, dataStr, turmas: turmasDoBloco });
                                    } else {
                                      onSelectSlot(slot, turmasDoBloco[0], dataStr);
                                    }
                                  }}
                                  className={`flex-1 min-w-0 h-full rounded-xl text-white p-2 text-xs font-semibold leading-tight shadow-md transition-all border active:scale-95 flex flex-col justify-between overflow-hidden ${
                                    bloqueado
                                      ? 'bg-gradient-to-b from-zinc-400 to-zinc-500 border-zinc-300/40 cursor-not-allowed opacity-60'
                                      : isPassado
                                        ? semBeneficiarios
                                          ? 'bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 border-amber-500/50 cursor-pointer'
                                          : 'bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400/40 cursor-pointer'
                                        : semBeneficiarios
                                          ? 'bg-gradient-to-b from-sky-700 to-indigo-800 hover:from-sky-600 hover:to-indigo-700 border-sky-400/50 cursor-pointer'
                                          : 'bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 border-sky-400/40 cursor-pointer'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    {isMultiTurma && (
                                      <span className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide mb-0.5">
                                        <Users className="h-2.5 w-2.5" />
                                        {turmasDoBloco.length} turmas
                                      </span>
                                    )}
                                    <div className="truncate font-bold text-white">
                                      <span className="truncate block">{tituloCard}</span>
                                    </div>
                                  </div>

                                  {semBeneficiarios ? (
                                    <div className="text-[9px] text-white/90 font-semibold mt-0.5">
                                      {isPassado
                                        ? permitirRetroativa
                                          ? "Sem alunos (Regularizar)"
                                          : "Sem beneficiários"
                                        : "Conferir Alunos"}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                      {slot.atividadeNome && (
                                        <div className="text-[9px] text-white/90 truncate font-semibold uppercase tracking-wide">
                                          {slot.atividadeNome}
                                        </div>
                                      )}
                                      <div className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal w-fit">
                                        {slot.horaInicioRaw && slot.horaFimRaw
                                          ? `${slot.horaInicioRaw} – ${slot.horaFimRaw}`
                                          : `${formatHora(slot.inicio)} – ${formatHora(slot.fim)}`}
                                      </div>
                                    </div>
                                  )}

                                  <div className="text-[10px] text-white/80 truncate flex items-center gap-1 font-medium">
                                    <span>📍 {slot.nucleoNome || "Polo Esportivo"}</span>
                                  </div>
                                </div>
                              );
                            })}
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

      {/* Modal de escolha de turma para blocos multi-turmas */}
      {blocoEscolhaTurma && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setBlocoEscolhaTurma(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Bloco Multi-Turmas
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 mt-0.5">
                  Selecione a turma para acessar
                </h3>
                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    {blocoEscolhaTurma.slot.horaInicioRaw && blocoEscolhaTurma.slot.horaFimRaw
                      ? `${blocoEscolhaTurma.slot.horaInicioRaw} – ${blocoEscolhaTurma.slot.horaFimRaw}`
                      : `${formatHora(blocoEscolhaTurma.slot.inicio)} – ${formatHora(blocoEscolhaTurma.slot.fim)}`}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlocoEscolhaTurma(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {blocoEscolhaTurma.turmas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const { slot, dataStr } = blocoEscolhaTurma;
                    setBlocoEscolhaTurma(null);
                    onSelectSlot(slot, t, dataStr);
                  }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 hover:bg-sky-50 hover:border-sky-300 p-3.5 text-left transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-zinc-900 truncate">{t.nome}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {t.idadeMinima != null && t.idadeMaxima != null
                        ? `${t.idadeMinima} a ${t.idadeMaxima} anos`
                        : "Faixa etária não informada"}
                      {" · "}
                      {t.vagasOcupadas ?? 0} aluno(s)
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-sky-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
