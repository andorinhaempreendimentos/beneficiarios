"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui";
import { Plus, X, Calendar, Clock, Users, Copy, Trash2, Edit3, Repeat, CalendarDays, UserCheck, Sparkles, AlertCircle } from "lucide-react";
import type { AtividadeApi, FuncionarioApi, NucleoApi } from "@/lib/api/services";

export const DIAS_OPCOES = [
  { key: "Dom", label: "Domingo" },
  { key: "Seg", label: "Segunda" },
  { key: "Ter", label: "Terça" },
  { key: "Qua", label: "Quarta" },
  { key: "Qui", label: "Quinta" },
  { key: "Sex", label: "Sexta" },
  { key: "Sáb", label: "Sábado" },
];

export const TODAS_HORAS = Array.from({ length: 18 }, (_, i) => i + 6); // 06h–23h

export type TipoRecorrencia = "semanal" | "mensal_dia_fixo" | "mensal_dia_semana" | "pontual";
export type AjusteFimDeSemana = "manter" | "proximo_util" | "anterior_util";

export interface BlocoHorarioAula {
  id?: string;
  dia: string;
  diaSemana?: number;
  dia_semana?: number;
  inicio: number;
  fim: number;
  horaInicio?: string;
  horaFim?: string;
  duracaoHoras?: number;
  duracaoMinutos?: number;
  grupoId?: string | null;
  grupoNome?: string;
  turmaId?: string | null;
  turmaNome?: string;
  nucleoId?: string;
  nucleoNome?: string;
  atividadeId?: string;
  atividadeNome?: string;
  responsavelId?: string;
  responsavelNome?: string;
  isControleInterno?: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  diaMes?: number;
  ordemSemanaMes?: number;
  ajusteFimDeSemana?: AjusteFimDeSemana;
  dataEspecifica?: string;
  gruposAdicionaisIds?: string[];
  gruposAdicionaisNomes?: string[];
}

export type SlotAula = BlocoHorarioAula; // Alias de compatibilidade retroativa

export interface GradeSemanalProps {
  modo?: "nucleo" | "turma";
  atividade?: AtividadeApi;
  atividadeNome?: string;
  atividadesLocais?: AtividadeApi[];
  funcionarios?: FuncionarioApi[];
  nucleos?: NucleoApi[];
  nucleoPadraoId?: string;
  nucleoPadraoNome?: string;
  turmasDisponiveis?: { id: string; nome: string; nucleoId?: string }[];
  turmaAtualId?: string;
  slots?: BlocoHorarioAula[];
  onChange?: (slots: BlocoHorarioAula[]) => void;
  onAlocarTurma?: (blocoId: string, turmaId: string | null) => Promise<void>;
  onCriarTurmaRapida?: (nome: string, atividadeId?: string) => Promise<{ id: string; nome: string }>;
}

function formatHora(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

// Modal de adicionar/criar bloco de horário
export interface ModalBlocoProps {
  modo?: "nucleo" | "turma";
  atividadeAtual?: AtividadeApi;
  atividadeNome: string;
  atividadesLocais?: AtividadeApi[];
  funcionarios?: FuncionarioApi[];
  nucleos?: NucleoApi[];
  nucleoPadraoId?: string;
  nucleoPadraoNome?: string;
  turmasDisponiveis?: { id: string; nome: string; nucleoId?: string }[];
  turmaAtualId?: string;
  diasVisiveis: string[];
  initialDia?: string;
  initialInicio?: number;
  initialFim?: number;
  initialResponsavelId?: string;
  onConfirm: (blocos: BlocoHorarioAula[]) => void;
  onClose: () => void;
  onCriarTurmaRapida?: (nome: string, atividadeId?: string) => Promise<{ id: string; nome: string }>;
}

export function ModalBloco({
  modo = "turma",
  atividadeAtual,
  atividadeNome,
  atividadesLocais = [],
  funcionarios = [],
  nucleos = [],
  nucleoPadraoId,
  nucleoPadraoNome,
  turmasDisponiveis = [],
  turmaAtualId,
  diasVisiveis,
  initialDia,
  initialInicio,
  initialFim,
  initialResponsavelId,
  onConfirm,
  onClose,
  onCriarTurmaRapida,
}: ModalBlocoProps) {
  // Aba de recorrência: "semanal" | "mensal" | "pontual"
  const [recorrenciaTab, setRecorrenciaTab] = useState<"semanal" | "mensal" | "pontual">("semanal");
  
  // Campos de tempo
  const [diaBase, setDiaBase] = useState(initialDia || diasVisiveis[0] || "Seg");
  const [inicio, setInicio] = useState(initialInicio ?? 8);
  const [fim, setFim] = useState(initialFim ?? 9);

  // Repetição Semanal (múltiplos dias)
  const [diasSemanaSelecionados, setDiasSemanaSelecionados] = useState<string[]>([
    initialDia || diasVisiveis[0] || "Seg",
  ]);

  // Recorrência mensal
  const [modalidadeMensal, setModalidadeMensal] = useState<"dia_semana" | "dia_fixo">("dia_semana");
  const [diaMes, setDiaMes] = useState<number>(10);
  const [repetirSegundoDiaFixo, setRepetirSegundoDiaFixo] = useState(false);
  const [segundoDiaMes, setSegundoDiaMes] = useState<number>(25);
  const [ordensSemanaSelecionadas, setOrdensSemanaSelecionadas] = useState<number[]>([1]);
  const [ajusteFimDeSemana, setAjusteFimDeSemana] = useState<AjusteFimDeSemana>("manter");

  // Recorrência pontual (com datas adicionais)
  const [dataEspecifica, setDataEspecifica] = useState<string>(() => {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  });
  const [datasExtras, setDatasExtras] = useState<string[]>([]);
  const [novaDataExtra, setNovaDataExtra] = useState<string>("");

  // Metadados do bloco
  const [selectedAtividadeId, setSelectedAtividadeId] = useState(atividadeAtual?.id || "");
  const [selectedResponsavelId, setSelectedResponsavelId] = useState(initialResponsavelId || "");
  const [selectedNucleoId, setSelectedNucleoId] = useState(nucleoPadraoId || "");

  // Alocação de Turma (especialmente no modo Núcleo)
  const [tipoAlocacao, setTipoAlocacao] = useState<"vago" | "existente" | "nova">(
    modo === "nucleo" ? "vago" : (turmaAtualId ? "existente" : "vago")
  );
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string>(turmaAtualId || "");
  const [novoNomeTurma, setNovoNomeTurma] = useState<string>("");
  const [criandoTurma, setCriandoTurma] = useState(false);

  // Enturmação conjunta
  const [selectedGruposAdicionais, setSelectedGruposAdicionais] = useState<string[]>([]);

  const atvSelecionada = atividadesLocais.find((a) => a.id === selectedAtividadeId) || atividadeAtual;
  const isControleInterno = atvSelecionada ? !atvSelecionada.disponivelPreInscricao : false;
  const nomeExibicao = atvSelecionada?.nome || atividadeNome;

  // Turmas elegíveis para parceria
  const turmasParceirasPossiveis = useMemo(() => {
    return turmasDisponiveis.filter((t) => t.id !== turmaAtualId && t.id !== turmaSelecionadaId);
  }, [turmasDisponiveis, turmaAtualId, turmaSelecionadaId]);

  function toggleDiaSemana(d: string) {
    setDiasSemanaSelecionados((prev) => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev; // Mantém ao menos 1
        return prev.filter((item) => item !== d);
      }
      return [...prev, d];
    });
  }

  function toggleOrdemSemana(ordem: number) {
    setOrdensSemanaSelecionadas((prev) => {
      if (prev.includes(ordem)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== ordem);
      }
      return [...prev, ordem];
    });
  }

  const totalBlocos = useMemo(() => {
    if (recorrenciaTab === "semanal") return diasSemanaSelecionados.length;
    if (recorrenciaTab === "mensal") {
      if (modalidadeMensal === "dia_semana") return ordensSemanaSelecionadas.length;
      return repetirSegundoDiaFixo ? 2 : 1;
    }
    if (recorrenciaTab === "pontual") return 1 + datasExtras.length;
    return 1;
  }, [recorrenciaTab, diasSemanaSelecionados, modalidadeMensal, ordensSemanaSelecionadas, repetirSegundoDiaFixo, datasExtras]);

  async function handleConfirm() {
    if (fim <= inicio) return;
    const duracaoHoras = fim - inicio;
    const respSelecionado = funcionarios.find((f) => f.id === selectedResponsavelId);
    const nucleoObj = nucleos.find((n) => n.id === selectedNucleoId);
    const nucleoFinalNome = nucleoObj?.identificacao || nucleoPadraoNome;

    let finalTurmaId: string | null = null;
    let finalTurmaNome: string | undefined = undefined;

    if (tipoAlocacao === "existente" && turmaSelecionadaId) {
      finalTurmaId = turmaSelecionadaId;
      const tObj = turmasDisponiveis.find((t) => t.id === turmaSelecionadaId);
      finalTurmaNome = tObj?.nome;
    } else if (tipoAlocacao === "nova" && novoNomeTurma.trim() && onCriarTurmaRapida) {
      try {
        setCriandoTurma(true);
        const criada = await onCriarTurmaRapida(novoNomeTurma.trim(), atvSelecionada?.id);
        finalTurmaId = criada.id;
        finalTurmaNome = criada.nome;
      } catch {
        finalTurmaId = null;
      } finally {
        setCriandoTurma(false);
      }
    } else if (modo === "turma" && turmaAtualId) {
      finalTurmaId = turmaAtualId;
    }

    const nomesAdicionais = turmasParceirasPossiveis
      .filter((t) => selectedGruposAdicionais.includes(t.id))
      .map((t) => t.nome);

    const baseBloco: Partial<BlocoHorarioAula> = {
      inicio,
      fim,
      horaInicio: `${String(inicio).padStart(2, "0")}:00:00`,
      horaFim: `${String(fim).padStart(2, "0")}:00:00`,
      duracaoHoras,
      duracaoMinutos: duracaoHoras * 60,
      nucleoId: selectedNucleoId || nucleoPadraoId,
      nucleoNome: nucleoFinalNome,
      atividadeId: atvSelecionada?.id,
      atividadeNome: nomeExibicao,
      responsavelId: respSelecionado?.id,
      responsavelNome: respSelecionado?.nomeCompleto,
      isControleInterno,
      grupoId: finalTurmaId,
      grupoNome: finalTurmaNome,
      turmaId: finalTurmaId,
      turmaNome: finalTurmaNome,
      gruposAdicionaisIds: selectedGruposAdicionais,
      gruposAdicionaisNomes: nomesAdicionais,
    };

    const blocosGerados: BlocoHorarioAula[] = [];

    if (recorrenciaTab === "semanal") {
      for (const d of diasSemanaSelecionados) {
        blocosGerados.push({
          ...(baseBloco as BlocoHorarioAula),
          dia: d,
          tipoRecorrencia: "semanal",
        });
      }
    } else if (recorrenciaTab === "mensal") {
      if (modalidadeMensal === "dia_fixo") {
        blocosGerados.push({
          ...(baseBloco as BlocoHorarioAula),
          dia: diaBase,
          tipoRecorrencia: "mensal_dia_fixo",
          diaMes,
          ajusteFimDeSemana,
        });
        if (repetirSegundoDiaFixo && segundoDiaMes) {
          blocosGerados.push({
            ...(baseBloco as BlocoHorarioAula),
            dia: diaBase,
            tipoRecorrencia: "mensal_dia_fixo",
            diaMes: segundoDiaMes,
            ajusteFimDeSemana,
          });
        }
      } else {
        for (const ord of ordensSemanaSelecionadas) {
          blocosGerados.push({
            ...(baseBloco as BlocoHorarioAula),
            dia: diaBase,
            tipoRecorrencia: "mensal_dia_semana",
            ordemSemanaMes: ord,
          });
        }
      }
    } else if (recorrenciaTab === "pontual") {
      const todasDatas = [dataEspecifica, ...datasExtras].filter(Boolean);
      for (const dtStr of todasDatas) {
        const [ano, m, d] = dtStr.split("-").map(Number);
        const dt = new Date(ano, m - 1, d);
        const diaSemanaNum = dt.getDay();
        const diaCalculado = DIAS_OPCOES[diaSemanaNum]?.key || "Seg";

        blocosGerados.push({
          ...(baseBloco as BlocoHorarioAula),
          dia: diaCalculado,
          tipoRecorrencia: "pontual",
          dataEspecifica: dtStr,
        });
      }
    }

    onConfirm(blocosGerados);
    onClose();
  }

  function toggleGrupoAdicional(id: string) {
    setSelectedGruposAdicionais((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={16} className="text-sky-600" />
              <span>Adicionar Bloco de Horário {modo === "nucleo" ? "no Núcleo" : ""}</span>
            </h3>
            <p className="text-xs text-zinc-500">Defina o planejamento físico, instrutor, repetições e turma alocada</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        {/* Abas de Padrão de Agendamento */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Padrão de Agendamento</label>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setRecorrenciaTab("semanal")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                recorrenciaTab === "semanal"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Repeat size={13} />
              <span>Semanal</span>
            </button>
            <button
              type="button"
              onClick={() => setRecorrenciaTab("mensal")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                recorrenciaTab === "mensal"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <CalendarDays size={13} />
              <span>Mensal</span>
            </button>
            <button
              type="button"
              onClick={() => setRecorrenciaTab("pontual")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                recorrenciaTab === "pontual"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Calendar size={13} />
              <span>Dia Único</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Seletor Semanal com Pergunta de Repetição e Atalhos */}
          {recorrenciaTab === "semanal" && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Repeat size={14} className="text-sky-600" />
                  <span>Repetir em outros dias da semana?</span>
                </label>
                {diasSemanaSelecionados.length > 1 && (
                  <span className="text-[10px] font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    {diasSemanaSelecionados.length} dias selecionados
                  </span>
                )}
              </div>

              {/* Atalhos Rápidos */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] text-zinc-500 font-medium">Atalhos rápidos:</span>
                <button
                  type="button"
                  onClick={() => setDiasSemanaSelecionados(["Ter", "Qui"])}
                  className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors"
                >
                  Terça e Quinta
                </button>
                <button
                  type="button"
                  onClick={() => setDiasSemanaSelecionados(["Seg", "Qua", "Sex"])}
                  className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors"
                >
                  Seg, Qua e Sex
                </button>
                <button
                  type="button"
                  onClick={() => setDiasSemanaSelecionados(["Seg", "Ter", "Qua", "Qui", "Sex"])}
                  className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors"
                >
                  Segunda a Sexta
                </button>
              </div>

              {/* Botões dos 7 dias da semana */}
              <div className="grid grid-cols-7 gap-1 pt-1">
                {DIAS_OPCOES.map((d) => {
                  const ativo = diasSemanaSelecionados.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDiaSemana(d.key)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all text-center ${
                        ativo
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {d.key}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500">
                Gera um bloco de horário idêntico para cada dia selecionado com 1 clique.
              </p>
            </div>
          )}

          {/* Seletor Mensal */}
          {recorrenciaTab === "mensal" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex flex-col gap-3">
              <div className="flex gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidadeMensal"
                    checked={modalidadeMensal === "dia_semana"}
                    onChange={() => setModalidadeMensal("dia_semana")}
                    className="text-sky-600"
                  />
                  <span>Por dia da semana (ex: 1º e 3º sábado)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidadeMensal"
                    checked={modalidadeMensal === "dia_fixo"}
                    onChange={() => setModalidadeMensal("dia_fixo")}
                    className="text-sky-600"
                  />
                  <span>Por dia fixo do mês</span>
                </label>
              </div>

              {modalidadeMensal === "dia_semana" ? (
                <div className="flex flex-col gap-3 pt-1">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-700">Dia da semana</label>
                    <select
                      value={diaBase}
                      onChange={(e) => setDiaBase(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
                    >
                      {DIAS_OPCOES.map((d) => (
                        <option key={d.key} value={d.key}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-700">
                        Semanas do mês em que acontece (Repetição):
                      </label>
                      {ordensSemanaSelecionadas.length > 1 && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                          {ordensSemanaSelecionadas.length} semanas
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { val: 1, label: "1ª sem" },
                        { val: 2, label: "2ª sem" },
                        { val: 3, label: "3ª sem" },
                        { val: 4, label: "4ª sem" },
                        { val: -1, label: "Última" },
                      ].map((item) => {
                        const sel = ordensSemanaSelecionadas.includes(item.val);
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => toggleOrdemSemana(item.val)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                              sel
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOrdensSemanaSelecionadas([1, 3])}
                        className="text-[10.5px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 font-semibold"
                      >
                        Atalho: Quinzenal (1ª e 3ª)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdensSemanaSelecionadas([2, 4])}
                        className="text-[10.5px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 font-semibold"
                      >
                        Atalho: Quinzenal (2ª e 4ª)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">Dia principal do mês</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={diaMes}
                        onChange={(e) => setDiaMes(Math.max(1, Math.min(31, Number(e.target.value))))}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">Fim de semana</label>
                      <select
                        value={ajusteFimDeSemana}
                        onChange={(e) => setAjusteFimDeSemana(e.target.value as AjusteFimDeSemana)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                      >
                        <option value="manter">Manter no dia</option>
                        <option value="proximo_util">Próximo dia útil</option>
                        <option value="anterior_util">Anterior dia útil</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700">
                      <input
                        type="checkbox"
                        checked={repetirSegundoDiaFixo}
                        onChange={(e) => setRepetirSegundoDiaFixo(e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Repetir em um segundo dia fixo (quinzenal)</span>
                    </label>
                    {repetirSegundoDiaFixo && (
                      <div className="mt-2 w-1/2">
                        <label className="mb-1 block text-xs font-semibold text-zinc-700">Segundo dia do mês</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={segundoDiaMes}
                          onChange={(e) => setSegundoDiaMes(Math.max(1, Math.min(31, Number(e.target.value))))}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seletor Pontual */}
          {recorrenciaTab === "pontual" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex flex-col gap-2.5">
              <label className="block text-xs font-semibold text-zinc-700">Data principal do evento / clínica</label>
              <input
                type="date"
                value={dataEspecifica}
                onChange={(e) => {
                  setDataEspecifica(e.target.value);
                  if (e.target.value) {
                    const [ano, m, d] = e.target.value.split("-").map(Number);
                    const dt = new Date(ano, m - 1, d);
                    const diaKey = DIAS_OPCOES[dt.getDay()]?.key;
                    if (diaKey) setDiaBase(diaKey);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              />

              {datasExtras.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-zinc-600">Datas adicionais deste evento:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {datasExtras.map((dExtra, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800"
                      >
                        📅 {dExtra}
                        <button
                          type="button"
                          onClick={() => setDatasExtras((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-sky-600 hover:text-sky-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="date"
                  value={novaDataExtra}
                  onChange={(e) => setNovaDataExtra(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (novaDataExtra && !datasExtras.includes(novaDataExtra) && novaDataExtra !== dataEspecifica) {
                      setDatasExtras((prev) => [...prev, novaDataExtra]);
                      setNovaDataExtra("");
                    }
                  }}
                  disabled={!novaDataExtra}
                  className="rounded-lg bg-zinc-200 hover:bg-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-50"
                >
                  + Adicionar data extra
                </button>
              </div>
            </div>
          )}

          {/* Horário Início e Fim */}
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

          {fim > inicio && (
            <div className="rounded-xl bg-sky-50 border border-sky-200/80 p-2.5 text-xs text-sky-900 flex items-center justify-between">
              <span>Janela: <strong>{formatHora(inicio)} às {formatHora(fim)}</strong></span>
              <span className="font-bold text-sky-700 bg-white border border-sky-200 px-2 py-0.5 rounded-md">
                Duração: {fim - inicio}h
              </span>
            </div>
          )}

          {/* Atividade e Instrutor */}
          {atividadesLocais.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Atividade / Modalidade</label>
              <select
                value={selectedAtividadeId}
                onChange={(e) => setSelectedAtividadeId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                {atividadesLocais.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.termoGrupo || "Grupo"} • {a.termoSessao || "Treino"}) {!a.disponivelPreInscricao ? "[Interno]" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {funcionarios.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Instrutor Responsável Escalado</label>
              <select
                value={selectedResponsavelId}
                onChange={(e) => setSelectedResponsavelId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="">Selecione o profissional de campo (opcional)</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nomeCompleto} {f.funcao ? `(${f.funcao})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Alocação de Turma (Visão do Núcleo) */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <UserCheck size={14} className="text-emerald-600" />
              Alocação da Turma Titular
            </span>

            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipoAlocacao"
                  checked={tipoAlocacao === "vago"}
                  onChange={() => setTipoAlocacao("vago")}
                  className="text-sky-600"
                />
                <span className="font-medium text-amber-700">Horário Vago (Disponível)</span>
              </label>

              {turmasDisponiveis.length > 0 && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoAlocacao"
                    checked={tipoAlocacao === "existente"}
                    onChange={() => setTipoAlocacao("existente")}
                    className="text-sky-600"
                  />
                  <span>Vincular Turma Existente</span>
                </label>
              )}

              {onCriarTurmaRapida && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoAlocacao"
                    checked={tipoAlocacao === "nova"}
                    onChange={() => setTipoAlocacao("nova")}
                    className="text-sky-600"
                  />
                  <span>+ Criar Nova Turma</span>
                </label>
              )}
            </div>

            {tipoAlocacao === "existente" && (
              <div className="pt-1">
                <select
                  value={turmaSelecionadaId}
                  onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                >
                  <option value="">Selecione a turma para ocupar este bloco</option>
                  {turmasDisponiveis.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipoAlocacao === "nova" && (
              <div className="pt-1 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-600">Nome da nova turma:</label>
                <input
                  type="text"
                  placeholder="Ex: Futebol Sub-11 Manhã"
                  value={novoNomeTurma}
                  onChange={(e) => setNovoNomeTurma(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                />
              </div>
            )}
          </div>

          {/* Enturmação Conjunta / Turmas Parceiras */}
          {turmasParceirasPossiveis.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  Enturmação Conjunta (Aulões / Festivais Integrados)
                </span>
                {selectedGruposAdicionais.length > 0 && (
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {selectedGruposAdicionais.length} parceira(s)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mb-2">
                Selecione outras turmas que participarão juntas deste mesmo bloco:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-indigo-100">
                {turmasParceirasPossiveis.map((t) => {
                  const selected = selectedGruposAdicionais.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleGrupoAdicional(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all text-left ${
                        selected
                          ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {t.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {fim <= inicio && (
            <p className="text-xs text-red-500 font-semibold">Horário de término deve ser após o início.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={fim <= inicio || criandoTurma}>
            {criandoTurma
              ? "Criando turma..."
              : totalBlocos > 1
              ? `Confirmar ${totalBlocos} Blocos de Horário`
              : "Confirmar Bloco de Horário"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal de opções do bloco de horário existente
interface ModalOpcoesBlocoProps {
  slot: BlocoHorarioAula;
  atividadesLocais?: AtividadeApi[];
  funcionarios?: FuncionarioApi[];
  nucleos?: NucleoApi[];
  nucleoPadraoId?: string;
  nucleoPadraoNome?: string;
  turmasDisponiveis?: { id: string; nome: string; nucleoId?: string }[];
  turmaAtualId?: string;
  onDuplicar: (diaDestino: string) => void;
  onTrocarAtividade: (novaAtividade: AtividadeApi) => void;
  onTrocarResponsavel?: (novoResponsavel: FuncionarioApi | null) => void;
  onTrocarNucleo?: (novoNucleo: NucleoApi | null) => void;
  onAlocarTurma?: (turmaId: string | null) => void;
  onAtualizarTurmasParceiras?: (turmasIds: string[]) => void;
  onDeletar: () => void;
  onClose: () => void;
}

function ModalOpcoesBloco({
  slot,
  atividadesLocais = [],
  funcionarios = [],
  nucleos = [],
  nucleoPadraoId,
  nucleoPadraoNome,
  turmasDisponiveis = [],
  turmaAtualId,
  onDuplicar,
  onTrocarAtividade,
  onTrocarResponsavel,
  onTrocarNucleo,
  onAlocarTurma,
  onAtualizarTurmasParceiras,
  onDeletar,
  onClose,
}: ModalOpcoesBlocoProps) {
  const [aba, setAba] = useState<"opcoes" | "duplicar" | "editar" | "turma">("opcoes");
  const [diaDestino, setDiaDestino] = useState(slot.dia);
  const [novaAtividadeId, setNovaAtividadeId] = useState(slot.atividadeId || "");
  const [novoResponsavelId, setNovoResponsavelId] = useState(slot.responsavelId || "");
  const [novoNucleoId, setNovoNucleoId] = useState(slot.nucleoId || nucleoPadraoId || "");
  const [turmaAlocadaId, setTurmaAlocadaId] = useState<string>(slot.grupoId || slot.turmaId || "");
  const [parceirasIds, setParceirasIds] = useState<string[]>(slot.gruposAdicionaisIds || []);

  const duracao = slot.duracaoHoras || (slot.fim - slot.inicio);

  const turmasParceirasPossiveis = useMemo(() => {
    return turmasDisponiveis.filter((t) => t.id !== turmaAlocadaId);
  }, [turmasDisponiveis, turmaAlocadaId]);

  function toggleParceira(id: string) {
    setParceirasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-zinc-900">
                {slot.atividadeNome || "Bloco de Horário"}
              </h3>
              {slot.grupoId ? (
                <span className="rounded bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2">
                  {slot.grupoNome || "Turma Alocada"}
                </span>
              ) : (
                <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2">
                  ⚡ Vago
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {DIAS_OPCOES.find((d) => d.key === slot.dia)?.label} ({formatHora(slot.inicio)} às {formatHora(slot.fim)} • {duracao}h)
            </p>
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-zinc-600">
              {slot.tipoRecorrencia && slot.tipoRecorrencia !== "semanal" && (
                <span className="rounded bg-purple-50 text-purple-700 px-1.5 py-0.5 font-bold">
                  {slot.tipoRecorrencia === "pontual" && `📅 Pontual: ${slot.dataEspecifica}`}
                  {slot.tipoRecorrencia === "mensal_dia_fixo" && `🗓️ Mensal: Todo dia ${slot.diaMes}`}
                  {slot.tipoRecorrencia === "mensal_dia_semana" && `🗓️ Mensal: ${slot.ordemSemanaMes}ª semana`}
                </span>
              )}
              {slot.nucleoNome && <span className="rounded bg-zinc-100 px-1.5 py-0.5">📍 {slot.nucleoNome}</span>}
              {slot.responsavelNome && <span className="rounded bg-sky-50 text-sky-700 px-1.5 py-0.5">👤 {slot.responsavelNome}</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        {aba === "opcoes" && (
          <div className="flex flex-col gap-2.5">
            {onAlocarTurma && (
              <button
                type="button"
                onClick={() => setAba("turma")}
                className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-zinc-200 bg-white hover:bg-emerald-50/60 hover:border-emerald-300 text-left transition-all text-xs font-bold text-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold"><UserCheck size={16} /></span>
                  <div>
                    <span className="block text-zinc-900">
                      {slot.grupoId ? "Trocar / Desalocar Turma" : "Alocar Turma neste Bloco"}
                    </span>
                    <span className="text-[11px] font-normal text-zinc-500">
                      {slot.grupoId ? `Atualmente: ${slot.grupoNome || "Turma vinculada"}` : "Bloco livre no núcleo"}
                    </span>
                  </div>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setAba("duplicar")}
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-zinc-200 bg-white hover:bg-sky-50/60 hover:border-sky-300 text-left transition-all text-xs font-bold text-zinc-800"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-700 font-bold"><Copy size={16} /></span>
                <div>
                  <span className="block text-zinc-900">Duplicar Bloco</span>
                  <span className="text-[11px] font-normal text-zinc-500">Copiar para outro dia da semana</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAba("editar")}
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-zinc-200 bg-white hover:bg-amber-50/60 hover:border-amber-300 text-left transition-all text-xs font-bold text-zinc-800"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold"><Edit3 size={16} /></span>
                <div>
                  <span className="block text-zinc-900">Editar Detalhes</span>
                  <span className="text-[11px] font-normal text-zinc-500">Alterar atividade, responsável ou parceiras</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onDeletar}
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-100/60 text-left transition-all text-xs font-bold text-red-700"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-red-100 text-red-700 font-bold"><Trash2 size={16} /></span>
                <div>
                  <span className="block text-red-900">Excluir Bloco</span>
                  <span className="text-[11px] font-normal text-red-600">Remover este horário da grade do núcleo</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {aba === "turma" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Selecione a turma titular:</label>
              <select
                value={turmaAlocadaId}
                onChange={(e) => setTurmaAlocadaId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="">Deixar Vago / Sem turma alocada</option>
                {turmasDisponiveis.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
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
                  onAlocarTurma?.(turmaAlocadaId || null);
                  onClose();
                }}
              >
                Salvar Alocação
              </Button>
            </div>
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

        {aba === "editar" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Atividade do bloco:</label>
              <select
                value={novaAtividadeId}
                onChange={(e) => setNovaAtividadeId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                {atividadesLocais.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.termoGrupo || "Grupo"} • {a.termoSessao || "Treino"}) {!a.disponivelPreInscricao ? "[Interno]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {funcionarios.length > 0 && (
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Instrutor / Responsável:</label>
                <select
                  value={novoResponsavelId}
                  onChange={(e) => setNovoResponsavelId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Sem responsável definido</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nomeCompleto} {f.funcao ? `(${f.funcao})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {nucleos.length > 0 && (
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Espaço / Núcleo:</label>
                <select
                  value={novoNucleoId}
                  onChange={(e) => setNovoNucleoId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value={nucleoPadraoId || ""}>
                    {nucleoPadraoNome ? `${nucleoPadraoNome} (Padrão)` : "Núcleo padrão"}
                  </option>
                  {nucleos
                    .filter((n) => n.id !== nucleoPadraoId)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.identificacao}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {turmasParceirasPossiveis.length > 0 && (
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">Turmas Parceiras Integradas (Aulão):</label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  {turmasParceirasPossiveis.map((t) => {
                    const sel = parceirasIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleParceira(t.id)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                          sel
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {sel ? "✓ " : "+ "}
                        {t.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  const novoResp = funcionarios.find((f) => f.id === novoResponsavelId) || null;
                  const novoNuc = nucleos.find((n) => n.id === novoNucleoId) || null;
                  if (novaAtv) onTrocarAtividade(novaAtv);
                  if (onTrocarResponsavel) onTrocarResponsavel(novoResp);
                  if (onTrocarNucleo) onTrocarNucleo(novoNuc);
                  if (onAtualizarTurmasParceiras) onAtualizarTurmasParceiras(parceirasIds);
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

export function GradeSemanal({
  modo = "turma",
  atividade,
  atividadeNome = "Aula",
  atividadesLocais = [],
  funcionarios = [],
  nucleos = [],
  nucleoPadraoId,
  nucleoPadraoNome,
  turmasDisponiveis = [],
  turmaAtualId,
  slots = [],
  onChange,
  onAlocarTurma,
  onCriarTurmaRapida,
}: GradeSemanalProps) {
  const [items, setItems] = useState<BlocoHorarioAula[]>(slots);
  const [diasVisiveis, setDiasVisiveis] = useState<Set<string>>(() => {
    const base = new Set(["Seg", "Ter", "Qua", "Qui", "Sex"]);
    slots.forEach((s) => {
      if (s.dia) base.add(s.dia);
    });
    return base;
  });
  const [dragging, setDragging] = useState<{ dia: string; inicio: number } | null>(null);
  const [dragHover, setDragHover] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [slotDraft, setSlotDraft] = useState<{ dia: string; inicio: number; fim: number } | null>(null);
  const [slotSelecionadoOpcoes, setSlotSelecionadoOpcoes] = useState<BlocoHorarioAula | null>(null);

  // Sincroniza se slots forem atualizados externamente
  useEffect(() => {
    setItems(slots);
    if (slots.length > 0) {
      setDiasVisiveis((prev) => {
        const next = new Set(prev);
        slots.forEach((s) => {
          if (s.dia) next.add(s.dia);
        });
        return next;
      });
    }
  }, [slots]);

  // Faixa dinâmica de horários
  const horasVisiveis = useMemo(() => {
    if (items.length === 0) {
      return Array.from({ length: 13 }, (_, i) => i + 7);
    }
    const maisCedo = Math.min(...items.map((s) => s.inicio));
    const maisTarde = Math.max(...items.map((s) => s.fim));

    const inicioGrade = Math.max(0, maisCedo - 1);
    const fimGrade = Math.min(23, maisTarde + 1);

    const totalHoras = Math.max(1, fimGrade - inicioGrade + 1);
    return Array.from({ length: totalHoras }, (_, i) => i + inicioGrade);
  }, [items]);

  const diasColuna = DIAS_OPCOES.filter((d) => diasVisiveis.has(d.key));

  function notify(next: BlocoHorarioAula[]) {
    setItems(next);
    setDiasVisiveis((prev) => {
      let changed = false;
      const nextSet = new Set(prev);
      next.forEach((s) => {
        if (s.dia && !nextSet.has(s.dia)) {
          nextSet.add(s.dia);
          changed = true;
        }
      });
      return changed ? nextSet : prev;
    });
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

  function addSlotsFromModal(novosBlocos: BlocoHorarioAula[]) {
    let updated = [...items];
    for (const bloco of novosBlocos) {
      updated = updated.filter(
        (s) => s.dia !== bloco.dia || s.fim <= bloco.inicio || s.inicio >= bloco.fim
      );
      updated.push(bloco);
    }
    notify(updated);
    setSlotDraft(null);
  }

  const isDragHighlight = (dia: string, hora: number) => {
    if (!dragging || dragging.dia !== dia || dragHover === null) return false;
    const lo = Math.min(dragging.inicio, dragHover);
    const hi = Math.max(dragging.inicio, dragHover);
    return hora >= lo && hora <= hi;
  };

  const totalCargaHoraria = useMemo(() => {
    return items.reduce((acc, s) => acc + (s.duracaoHoras || (s.fim - s.inicio)), 0);
  }, [items]);

  const totalOcupados = useMemo(() => {
    return items.filter((s) => Boolean(s.grupoId || s.turmaId)).length;
  }, [items]);

  const totalVagos = items.length - totalOcupados;

  return (
    <div className="flex flex-col gap-3">
      {/* Controles acima da grade */}
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Dias Visíveis</span>
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

        {horasVisiveis.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Horários Exibidos</span>
            <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
              <span>{formatHora(horasVisiveis[0])}</span>
              <span className="text-zinc-400">às</span>
              <span>{formatHora(horasVisiveis[horasVisiveis.length - 1] + 1)}</span>
              <span className="ml-1 text-[10px] font-normal text-zinc-400">(faixa dinâmica)</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Carga Horária Semanal</span>
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
            <span>Total:</span>
            <span className="font-extrabold text-sky-700">{totalCargaHoraria}h</span>
            <span className="text-[10px] font-normal text-zinc-400">
              ({items.length} {items.length === 1 ? "bloco" : "blocos"})
            </span>
          </div>
        </div>

        {modo === "nucleo" && items.length > 0 && (
          <div className="flex items-center gap-2 self-end">
            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              {totalOcupados} ocupado(s)
            </span>
            <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {totalVagos} vago(s)
            </span>
          </div>
        )}

        <div className="ml-auto self-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setModalAberto(true)}
            disabled={diasColuna.length === 0 || horasVisiveis.length === 0}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} />
            Adicionar bloco de horário
          </Button>
        </div>
      </div>

      {/* Grade de Blocos de Horário */}
      {diasColuna.length === 0 || horasVisiveis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-400">
          Selecione ao menos um dia da semana para visualizar e adicionar blocos de horário.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white select-none">
          <div className="flex" style={{ minWidth: `${56 + diasColuna.length * 90}px` }}>
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

                    const isVago = !slot?.grupoId && !slot?.turmaId;

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
                            onClick={(e) => {
                              e.stopPropagation();
                              setSlotSelecionadoOpcoes(slot);
                            }}
                            className={`absolute inset-x-0.5 z-10 flex flex-col justify-between rounded-lg border p-1.5 text-[11px] font-semibold leading-tight shadow-sm cursor-pointer hover:opacity-95 overflow-hidden transition-all ${
                              isVago
                                ? "bg-amber-500/90 border-amber-600 text-white"
                                : slot.isControleInterno
                                ? "bg-amber-600 border-amber-700 text-white"
                                : "bg-sky-600 border-sky-700 text-white"
                            }`}
                            style={{ top: 2, height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)` }}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <div className="truncate flex items-center gap-1 font-bold">
                                  {isVago && <span>⚡</span>}
                                  <span>{slot.grupoNome || (isVago ? "Horário Vago" : slot.atividadeNome || atividadeNome)}</span>
                                </div>
                                <span className="shrink-0 rounded bg-black/25 px-1 py-0.2 text-[9px] font-black uppercase tracking-tight">
                                  {slot.duracaoHoras || (slot.fim - slot.inicio)}h
                                </span>
                              </div>

                              {/* Atividade e Professor */}
                              <div className="truncate opacity-95 text-[9.5px] font-medium flex items-center gap-1">
                                <span>{slot.atividadeNome || "Atividade"}</span>
                                {slot.responsavelNome && <span>• 👤 {slot.responsavelNome}</span>}
                              </div>

                              {/* Recorrência especial */}
                              {slot.tipoRecorrencia && slot.tipoRecorrencia !== "semanal" && (
                                <div className="truncate bg-black/20 text-white rounded px-1 py-0.2 text-[8.5px] font-bold w-fit">
                                  {slot.tipoRecorrencia === "pontual" && `📅 Pontual: ${slot.dataEspecifica}`}
                                  {slot.tipoRecorrencia === "mensal_dia_fixo" && `🗓️ Todo dia ${slot.diaMes}`}
                                  {slot.tipoRecorrencia === "mensal_dia_semana" && `🗓️ ${slot.ordemSemanaMes}ª semana`}
                                </div>
                              )}

                              {/* Turmas Parceiras */}
                              {slot.gruposAdicionaisIds && slot.gruposAdicionaisIds.length > 0 && (
                                <div className="truncate bg-indigo-950/40 text-indigo-100 rounded px-1 py-0.2 text-[8.5px] font-bold w-fit">
                                  👥 +{slot.gruposAdicionaisIds.length} parceira(s)
                                </div>
                              )}
                            </div>
                            <div className="opacity-90 text-[9.5px] font-normal mt-auto">
                              {formatHora(slot.inicio)}–{formatHora(slot.fim)}
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
      )}

      {/* Modal de Criação / Arrasto */}
      {modalAberto && (
        <ModalBloco
          modo={modo}
          atividadeAtual={atividade}
          atividadeNome={atividadeNome}
          atividadesLocais={atividadesLocais}
          funcionarios={funcionarios}
          nucleos={nucleos}
          nucleoPadraoId={nucleoPadraoId}
          nucleoPadraoNome={nucleoPadraoNome}
          turmasDisponiveis={turmasDisponiveis}
          turmaAtualId={turmaAtualId}
          diasVisiveis={[...diasVisiveis]}
          initialDia={slotDraft?.dia}
          initialInicio={slotDraft?.inicio}
          initialFim={slotDraft?.fim}
          onConfirm={addSlotsFromModal}
          onClose={() => {
            setModalAberto(false);
            setSlotDraft(null);
          }}
          onCriarTurmaRapida={onCriarTurmaRapida}
        />
      )}

      {/* Modal de Opções do Bloco Existente */}
      {slotSelecionadoOpcoes && (
        <ModalOpcoesBloco
          slot={slotSelecionadoOpcoes}
          atividadesLocais={atividadesLocais}
          funcionarios={funcionarios}
          nucleos={nucleos}
          nucleoPadraoId={nucleoPadraoId}
          nucleoPadraoNome={nucleoPadraoNome}
          turmasDisponiveis={turmasDisponiveis}
          turmaAtualId={turmaAtualId}
          onDuplicar={(diaDestino) => {
            const copia: BlocoHorarioAula = {
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
            const atualizado: BlocoHorarioAula = {
              ...slotSelecionadoOpcoes,
              atividadeId: novaAtv.id,
              atividadeNome: novaAtv.nome,
              isControleInterno: !novaAtv.disponivelPreInscricao,
            };
            notify(items.map((s) => (s === slotSelecionadoOpcoes ? atualizado : s)));
            setSlotSelecionadoOpcoes(null);
          }}
          onTrocarResponsavel={(novoResp) => {
            const atualizado: BlocoHorarioAula = {
              ...slotSelecionadoOpcoes,
              responsavelId: novoResp ? novoResp.id : undefined,
              responsavelNome: novoResp ? novoResp.nomeCompleto : undefined,
            };
            notify(items.map((s) => (s === slotSelecionadoOpcoes ? atualizado : s)));
            setSlotSelecionadoOpcoes(null);
          }}
          onTrocarNucleo={(novoNuc) => {
            const atualizado: BlocoHorarioAula = {
              ...slotSelecionadoOpcoes,
              nucleoId: novoNuc ? novoNuc.id : nucleoPadraoId,
              nucleoNome: novoNuc ? novoNuc.identificacao : nucleoPadraoNome,
            };
            notify(items.map((s) => (s === slotSelecionadoOpcoes ? atualizado : s)));
            setSlotSelecionadoOpcoes(null);
          }}
          onAlocarTurma={
            onAlocarTurma
              ? async (turmaId) => {
                  const tObj = turmasDisponiveis.find((t) => t.id === turmaId);
                  const atualizado: BlocoHorarioAula = {
                    ...slotSelecionadoOpcoes,
                    grupoId: turmaId,
                    grupoNome: tObj?.nome,
                    turmaId: turmaId,
                    turmaNome: tObj?.nome,
                  };
                  if (slotSelecionadoOpcoes.id) {
                    await onAlocarTurma(slotSelecionadoOpcoes.id, turmaId);
                  }
                  notify(items.map((s) => (s === slotSelecionadoOpcoes ? atualizado : s)));
                }
              : undefined
          }
          onAtualizarTurmasParceiras={(turmasIds) => {
            const nomes = turmasDisponiveis.filter((t) => turmasIds.includes(t.id)).map((t) => t.nome);
            const atualizado: BlocoHorarioAula = {
              ...slotSelecionadoOpcoes,
              gruposAdicionaisIds: turmasIds,
              gruposAdicionaisNomes: nomes,
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
