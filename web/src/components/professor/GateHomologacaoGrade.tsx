"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Info,
  Flag,
} from "lucide-react";
import type { FuncionarioApi, NucleoApi } from "@/lib/api/services";

export interface TurmaMontada {
  id: string;
  identificador: string;
  min: number;
  max: number;
  label: string;
  cor: string;
}

export interface SlotHorarioGrade {
  id: string;
  dia: string;
  inicio: string;
  fim: string;
  turmasIds: string[];
  grupoId?: string;
}

export interface GateHomologacaoGradeProps {
  professor: FuncionarioApi;
  nucleo?: NucleoApi;
  onConcluirHomologacao: (dados: {
    turmas: TurmaMontada[];
    diasSelecionados: string[];
    gradeHorarios: SlotHorarioGrade[];
  }) => Promise<void>;
  onCancelar?: () => void;
}

const DIAS_MAP: Record<string, { nome: string; curto: string; order: number }> = {
  seg: { nome: "Segunda-feira", curto: "SEG", order: 1 },
  ter: { nome: "Terça-feira", curto: "TER", order: 2 },
  qua: { nome: "Quarta-feira", curto: "QUA", order: 3 },
  qui: { nome: "Quinta-feira", curto: "QUI", order: 4 },
  sex: { nome: "Sexta-feira", curto: "SEX", order: 5 },
  sab: { nome: "Sábado", curto: "SÁB", order: 6 },
  dom: { nome: "Domingo", curto: "DOM", order: 7 },
};

const CORES_TURMAS = ["sky", "indigo", "emerald", "amber", "purple", "rose", "teal", "cyan"];

function horaParaMinutos(str: string): number {
  if (!str) return 0;
  const parts = str.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function horariosColidem(i1: string, f1: string, i2: string, f2: string): boolean {
  const ini1 = horaParaMinutos(i1);
  const fim1 = horaParaMinutos(f1);
  const ini2 = horaParaMinutos(i2);
  const fim2 = horaParaMinutos(f2);
  return Math.max(ini1, ini2) < Math.min(fim1, fim2);
}

export function GateHomologacaoGrade({
  professor,
  nucleo,
  onConcluirHomologacao,
  onCancelar,
}: GateHomologacaoGradeProps) {
  // Stepper: 1 = Turmas, 2 = Dias, 3 = Calendário/Grade
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // 1ª Etapa: Turmas Montadas (inicia 100% vazia)
  const [turmasMontadas, setTurmasMontadas] = useState<TurmaMontada[]>([]);
  const [novaIdadeMin, setNovaIdadeMin] = useState<number>(8);
  const [novaIdadeMax, setNovaIdadeMax] = useState<number>(11);

  // 2ª Etapa: Dias da Semana Selecionados (inicia 100% limpa)
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);

  // 3ª Etapa: Distribuição da Grade no Calendário
  const [distribuicaoHorarios, setDistribuicaoHorarios] = useState<SlotHorarioGrade[]>([]);

  // Modal de Criação / Edição de Bloco
  const [modalBlocoAberto, setModalBlocoAberto] = useState(false);
  const [slotEmEdicaoId, setSlotEmEdicaoId] = useState<string | null>(null);
  const [diaAlvoModal, setDiaAlvoModal] = useState<string>("seg");
  const [modalInicio, setModalInicio] = useState("08:00");
  const [modalFim, setModalFim] = useState("09:30");
  const [turmasMarcadasModal, setTurmasMarcadasModal] = useState<string[]>([]);
  const [diasReplicacaoModal, setDiasReplicacaoModal] = useState<string[]>([]);
  const [bannerAvisoAjusteCompleto, setBannerAvisoAjusteCompleto] = useState(false);

  // Modal Confirmação Duplicidade de Horário no mesmo dia
  const [modalDuplicidadeAberto, setModalDuplicidadeAberto] = useState(false);
  const [pendenteTurmaDuplicadaId, setPendenteTurmaDuplicadaId] = useState<string | null>(null);
  const [infoDuplicidade, setInfoDuplicidade] = useState<{ turmaNome: string; diaNome: string; horarioStr: string } | null>(null);
  const [turmasDuplicadasAprovadas, setTurmasDuplicadasAprovadas] = useState<Set<string>>(new Set());

  // Modal de Confirmação de Duração / Horário Completo em Bloco Multiturma
  const [modalDuracaoAberta, setModalDuracaoAberta] = useState(false);
  const [duracaoConfirmada, setDuracaoConfirmada] = useState(false);

  // Estado de envio
  const [salvando, setSalvando] = useState(false);

  // -------------------------------------------------------------
  // VALIDAÇÕES DA ETAPA 1 (FAIXAS ETÁRIAS CONTÍGUAS E SEM OVERLAP)
  // -------------------------------------------------------------
  const analiseFaixas = useMemo(() => {
    if (turmasMontadas.length === 0) {
      return { contigua: false, gaps: [], overlaps: [], pronta: false };
    }

    const ordenadas = [...turmasMontadas].sort((a, b) => a.min - b.min);
    const gaps: string[] = [];
    const overlaps: string[] = [];

    for (let i = 0; i < ordenadas.length - 1; i++) {
      const atual = ordenadas[i];
      const proxima = ordenadas[i + 1];

      if (atual.max >= proxima.min) {
        overlaps.push(
          `Sobreposição entre Turma ${atual.identificador} (${atual.min}-${atual.max}) e Turma ${proxima.identificador} (${proxima.min}-${proxima.max})`
        );
      } else if (atual.max + 1 < proxima.min) {
        const gapInicio = atual.max + 1;
        const gapFim = proxima.min - 1;
        const gapStr = gapInicio === gapFim ? `${gapInicio} anos` : `${gapInicio} a ${gapFim} anos`;
        gaps.push(`Lacuna desatendida entre as turmas: ${gapStr}`);
      }
    }

    return {
      contigua: gaps.length === 0 && overlaps.length === 0,
      gaps,
      overlaps,
      pronta: turmasMontadas.length > 0 && gaps.length === 0 && overlaps.length === 0,
    };
  }, [turmasMontadas]);

  function adicionarTurma() {
    if (novaIdadeMin >= novaIdadeMax) {
      alert("A idade mínima deve ser menor que a idade máxima.");
      return;
    }

    // Verifica sobreposição com turmas existentes
    const overlap = turmasMontadas.find(
      (t) => Math.max(t.min, novaIdadeMin) <= Math.min(t.max, novaIdadeMax)
    );

    if (overlap) {
      alert(
        `Esta faixa (${novaIdadeMin} a ${novaIdadeMax} anos) sobrepõe a Turma ${overlap.identificador} (${overlap.min} a ${overlap.max} anos). Ajuste as idades para não sobrepor.`
      );
      return;
    }

    const letrasUsadas = new Set(turmasMontadas.map((t) => t.identificador));
    const todasLetras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const proximaLetra = todasLetras.find((l) => !letrasUsadas.has(l)) || `T${turmasMontadas.length + 1}`;

    const nova: TurmaMontada = {
      id: `turma_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      identificador: proximaLetra,
      min: novaIdadeMin,
      max: novaIdadeMax,
      label: `Turma ${proximaLetra}`,
      cor: CORES_TURMAS[turmasMontadas.length % CORES_TURMAS.length],
    };

    const atualizada = [...turmasMontadas, nova].sort((a, b) => a.min - b.min);
    setTurmasMontadas(atualizada);

    // Sugere a próxima faixa contígua
    if (novaIdadeMax < 20) {
      setNovaIdadeMin(novaIdadeMax + 1);
      setNovaIdadeMax(Math.min(novaIdadeMax + 4, 21));
    }
  }

  function removerTurma(id: string) {
    setTurmasMontadas((prev) => prev.filter((t) => t.id !== id));
    // Remove também de qualquer bloco de horário onde estava vinculada
    setDistribuicaoHorarios((prev) =>
      prev
        .map((slot) => ({
          ...slot,
          turmasIds: slot.turmasIds.filter((tId) => tId !== id),
        }))
        .filter((slot) => slot.turmasIds.length > 0)
    );
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES DA ETAPA 2 (DIAS DA SEMANA)
  // -------------------------------------------------------------
  function toggleDiaSemana(diaKey: string) {
    setDiasSelecionados((prev) => {
      if (prev.includes(diaKey)) {
        // Ao desmarcar dia, remove os slots agendados naquele dia
        setDistribuicaoHorarios((slots) => slots.filter((s) => s.dia !== diaKey));
        return prev.filter((d) => d !== diaKey);
      } else {
        return [...prev, diaKey];
      }
    });
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES DA ETAPA 3 (CALENDÁRIO & MODAL DE BLOCOS)
  // -------------------------------------------------------------
  const statusAlocacaoTurmas = useMemo(() => {
    return turmasMontadas.map((t) => {
      const slots = distribuicaoHorarios.filter((s) => s.turmasIds.includes(t.id));
      return {
        turma: t,
        alocada: slots.length > 0,
        totalSlots: slots.length,
      };
    });
  }, [turmasMontadas, distribuicaoHorarios]);

  const todasTurmasAlocadas =
    turmasMontadas.length > 0 && statusAlocacaoTurmas.every((s) => s.alocada);

  function abrirModalNovoBloco(dia: string) {
    setSlotEmEdicaoId(null);
    setDiaAlvoModal(dia);
    setBannerAvisoAjusteCompleto(false);
    setTurmasDuplicadasAprovadas(new Set());
    setDuracaoConfirmada(false);
    setTurmasMarcadasModal([]);
    // NUNCA PRÉ-MARCADO: INICIA 100% DESMARCADO
    setDiasReplicacaoModal([]);

    // Sugere horário inteligente
    const slotsDoDia = distribuicaoHorarios
      .filter((s) => s.dia === dia)
      .sort((a, b) => horaParaMinutos(a.fim) - horaParaMinutos(b.fim));

    let defInicio = "08:00";
    let defFim = dia === "sab" ? "11:00" : "09:30";

    if (slotsDoDia.length > 0) {
      const ultimo = slotsDoDia[slotsDoDia.length - 1];
      const minFim = horaParaMinutos(ultimo.fim);
      if (minFim < 18 * 60) {
        defInicio = ultimo.fim;
        const dur = dia === "sab" ? 180 : 90;
        const novoFimMin = Math.min(minFim + dur, 19 * 60);
        const hF = String(Math.floor(novoFimMin / 60)).padStart(2, "0");
        const mF = String(novoFimMin % 60).padStart(2, "0");
        defFim = `${hF}:${mF}`;
      }
    }

    setModalInicio(defInicio);
    setModalFim(defFim);
    setModalBlocoAberto(true);
  }

  function abrirModalEditarBloco(slot: SlotHorarioGrade) {
    setSlotEmEdicaoId(slot.id);
    setDiaAlvoModal(slot.dia);
    setBannerAvisoAjusteCompleto(false);
    setTurmasDuplicadasAprovadas(new Set(slot.turmasIds));
    setDuracaoConfirmada(slot.turmasIds.length >= 2);
    setModalInicio(slot.inicio);
    setModalFim(slot.fim);
    setTurmasMarcadasModal([...slot.turmasIds]);
    // NUNCA PRÉ-MARCADO: INICIA 100% DESMARCADO NA EDIÇÃO
    setDiasReplicacaoModal([]);
    setModalBlocoAberto(true);
  }

  // Verificação de conflito estritamente isolada no dia aberto
  const conflitoSlotNoDia = useMemo(() => {
    if (!modalBlocoAberto) return null;
    if (!modalInicio || !modalFim || horaParaMinutos(modalInicio) >= horaParaMinutos(modalFim)) {
      return null;
    }

    const colidente = distribuicaoHorarios.find(
      (s) =>
        s.id !== slotEmEdicaoId &&
        s.dia === diaAlvoModal &&
        horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
    );

    if (colidente) {
      return {
        diaNome: DIAS_MAP[diaAlvoModal]?.nome || diaAlvoModal,
        inicio: colidente.inicio,
        fim: colidente.fim,
      };
    }
    return null;
  }, [modalBlocoAberto, modalInicio, modalFim, slotEmEdicaoId, diaAlvoModal, distribuicaoHorarios]);

  function toggleCheckboxTurmaModal(turmaId: string) {
    const isMarcada = turmasMarcadasModal.includes(turmaId);

    if (!isMarcada) {
      // 1. REGRA: A MESMA TURMA JAMAIS PODE SER ADICIONADA NO MESMO HORÁRIO NO MESMO DIA
      const colidente = distribuicaoHorarios.find(
        (s) =>
          s.id !== slotEmEdicaoId &&
          s.dia === diaAlvoModal &&
          s.turmasIds.includes(turmaId) &&
          horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
      );

      if (colidente) {
        const t = turmasMontadas.find((x) => x.id === turmaId);
        alert(
          `Atenção: A ${t ? `Turma ${t.identificador}` : "turma"} jamais poderá ser adicionada no mesmo horário no mesmo dia (${DIAS_MAP[diaAlvoModal].nome} das ${colidente.inicio} às ${colidente.fim}). Mude o horário do bloco para adicioná-la.`
        );
        return;
      }

      // 2. SE FOR EM OUTRO HORÁRIO NO MESMO DIA: PERGUNTA CONFIRMAÇÃO
      if (!turmasDuplicadasAprovadas.has(turmaId)) {
        const outroSlot = distribuicaoHorarios.find(
          (s) =>
            s.id !== slotEmEdicaoId &&
            s.dia === diaAlvoModal &&
            s.turmasIds.includes(turmaId)
        );

        if (outroSlot) {
          const t = turmasMontadas.find((x) => x.id === turmaId);
          setPendenteTurmaDuplicadaId(turmaId);
          setInfoDuplicidade({
            turmaNome: t ? `Turma ${t.identificador}` : "Esta turma",
            diaNome: DIAS_MAP[diaAlvoModal].nome,
            horarioStr: `${outroSlot.inicio} às ${outroSlot.fim}`,
          });
          setModalDuplicidadeAberto(true);
          return;
        }
      }

      const novasMarcadas = [...turmasMarcadasModal, turmaId];
      setTurmasMarcadasModal(novasMarcadas);

      // 3. SE FICOU COM >= 2 TURMAS: ABRE OVERLAY DE DESTAQUE DO TÉRMINO
      if (novasMarcadas.length >= 2 && !duracaoConfirmada) {
        setModalDuracaoAberta(true);
      }
    } else {
      const restam = turmasMarcadasModal.filter((id) => id !== turmaId);
      setTurmasMarcadasModal(restam);
      turmasDuplicadasAprovadas.delete(turmaId);
      if (restam.length < 2) {
        setDuracaoConfirmada(false);
      }
    }
  }

  function confirmarTurmaDuplicada() {
    if (pendenteTurmaDuplicadaId) {
      turmasDuplicadasAprovadas.add(pendenteTurmaDuplicadaId);
      const novas = [...turmasMarcadasModal, pendenteTurmaDuplicadaId];
      setTurmasMarcadasModal(novas);
      setModalDuplicidadeAberto(false);
      setPendenteTurmaDuplicadaId(null);

      if (novas.length >= 2 && !duracaoConfirmada) {
        setModalDuracaoAberta(true);
      }
    }
  }

  function cancelarTurmaDuplicada() {
    setModalDuplicidadeAberto(false);
    setPendenteTurmaDuplicadaId(null);
  }

  function confirmarDuracaoModal() {
    setDuracaoConfirmada(true);
    setModalDuracaoAberta(false);
    setBannerAvisoAjusteCompleto(false);
  }

  function recusarDuracaoModal() {
    // Opção 1: Ambas as turmas permanecem no bloco, e o professor ajusta o horário completo!
    setDuracaoConfirmada(true);
    setModalDuracaoAberta(false);
    setBannerAvisoAjusteCompleto(true);
  }

  function toggleReplicacaoDia(dia: string) {
    setDiasReplicacaoModal((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  function salvarBlocoModal() {
    if (!modalInicio || !modalFim) {
      alert("Por favor, informe o horário de início e término.");
      return;
    }

    if (horaParaMinutos(modalInicio) >= horaParaMinutos(modalFim)) {
      alert("O horário de término deve ser posterior ao horário de início.");
      return;
    }

    if (turmasMarcadasModal.length === 0) {
      alert("Selecione ao menos 1 turma para este bloco.");
      return;
    }

    if (conflitoSlotNoDia) {
      alert("Já existe outro bloco cadastrado neste mesmo horário para este dia.");
      return;
    }

    const diasAlvo = [diaAlvoModal, ...diasReplicacaoModal];

    // Validação nos outros dias selecionados para replicação
    for (const dia of diasAlvo) {
      const colidente = distribuicaoHorarios.find(
        (s) =>
          s.id !== slotEmEdicaoId &&
          s.dia === dia &&
          horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
      );

      if (colidente) {
        alert(
          `Conflito em ${DIAS_MAP[dia].nome}: Já existe um bloco das ${colidente.inicio} às ${colidente.fim}. Não é possível replicar para este dia.`
        );
        return;
      }
    }

    const grupoId = slotEmEdicaoId
      ? distribuicaoHorarios.find((s) => s.id === slotEmEdicaoId)?.grupoId || `grp_${Date.now()}`
      : `grp_${Date.now()}`;

    setDistribuicaoHorarios((prev) => {
      let novaLista = [...prev];

      if (slotEmEdicaoId) {
        // Atualiza o bloco atual
        novaLista = novaLista.map((s) =>
          s.id === slotEmEdicaoId
            ? {
                ...s,
                inicio: modalInicio,
                fim: modalFim,
                turmasIds: [...turmasMarcadasModal],
                grupoId,
              }
            : s
        );

        // Se replicou para outros dias, cria ou atualiza nos outros dias
        diasReplicacaoModal.forEach((dia) => {
          const existenteOutroDia = novaLista.find(
            (s) => s.dia === dia && s.inicio === modalInicio && s.fim === modalFim
          );
          if (existenteOutroDia) {
            existenteOutroDia.turmasIds = [...turmasMarcadasModal];
            existenteOutroDia.grupoId = grupoId;
          } else {
            novaLista.push({
              id: `slot_${Date.now()}_${dia}_${Math.random().toString(36).substring(2, 6)}`,
              dia,
              inicio: modalInicio,
              fim: modalFim,
              turmasIds: [...turmasMarcadasModal],
              grupoId,
            });
          }
        });
      } else {
        // Criação de novos blocos
        diasAlvo.forEach((dia) => {
          novaLista.push({
            id: `slot_${Date.now()}_${dia}_${Math.random().toString(36).substring(2, 6)}`,
            dia,
            inicio: modalInicio,
            fim: modalFim,
            turmasIds: [...turmasMarcadasModal],
            grupoId,
          });
        });
      }

      return novaLista;
    });

    setModalBlocoAberto(false);
  }

  function removerBloco(id: string) {
    setDistribuicaoHorarios((prev) => prev.filter((s) => s.id !== id));
  }

  // -------------------------------------------------------------
  // FINALIZAÇÃO E HOMOLOGAÇÃO
  // -------------------------------------------------------------
  async function handleFinalizarHomologacao() {
    if (!todasTurmasAlocadas) {
      alert("Atenção: Todas as turmas criadas precisam estar alocadas em ao menos 1 bloco da semana.");
      return;
    }

    try {
      setSalvando(true);
      await onConcluirHomologacao({
        turmas: turmasMontadas,
        diasSelecionados,
        gradeHorarios: distribuicaoHorarios,
      });
    } catch (err: any) {
      alert(`Erro ao salvar grade: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-50 min-h-screen pb-12 flex flex-col font-sans">
      {/* HEADER FIXO DO GATE */}
      <header className="bg-sky-800 text-white px-5 pt-6 pb-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-sky-200">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider">Homologação da Grade</h1>
              <p className="text-[11px] text-sky-200">
                {nucleo?.identificacao || nucleo?.nomeLocal || "Meu Núcleo"} • {professor.nomeCompleto}
              </p>
            </div>
          </div>
          {onCancelar && (
            <button
              onClick={onCancelar}
              className="text-sky-200 hover:text-white text-xs font-bold px-2 py-1"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* STEPPER PROGRESS */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-sky-200">
            <span>
              {etapa === 1 && "Etapa 1 de 3: Minhas Turmas"}
              {etapa === 2 && "Etapa 2 de 3: Dias da Semana"}
              {etapa === 3 && "Etapa 3 de 3: Calendário de Horários"}
            </span>
            <span>{etapa === 1 ? "33%" : etapa === 2 ? "66%" : "100%"}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${etapa >= 1 ? "bg-white" : "bg-white/30"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${etapa >= 2 ? "bg-white" : "bg-white/30"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${etapa >= 3 ? "bg-white" : "bg-white/30"}`} />
          </div>
        </div>
      </header>

      {/* CONTEÚDO DAS ETAPAS */}
      <main className="p-4 flex-1">
        {/* ========================================================= */}
        {/* ETAPA 1: MINHAS TURMAS */}
        {/* ========================================================= */}
        {etapa === 1 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-700" />
                Definição das Turmas por Idade
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Crie as turmas do seu núcleo informando as faixas etárias. As idades devem ser contínuas e sem sobreposição.
              </p>
            </div>

            {/* FORMULÁRIO DE ADIÇÃO DE TURMA */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                + Nova Turma
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Idade Mínima:</span>
                  <select
                    value={novaIdadeMin}
                    onChange={(e) => setNovaIdadeMin(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} anos
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Idade Máxima:</span>
                  <select
                    value={novaIdadeMax}
                    onChange={(e) => setNovaIdadeMax(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                  >
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((num) => (
                      <option key={num} value={num}>
                        {num} anos
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={adicionarTurma}
                className="w-full py-3 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Turma
              </button>
            </div>

            {/* LISTA DAS TURMAS CRIADAS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-800 px-1">
                <span>Turmas Criadas ({turmasMontadas.length})</span>
                {turmasMontadas.length === 0 && (
                  <span className="text-[11px] text-amber-600 font-bold">Nenhuma criada ainda</span>
                )}
              </div>

              {turmasMontadas.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                  Adicione ao menos 1 turma com sua faixa etária para prosseguir.
                </div>
              ) : (
                <div className="space-y-2">
                  {turmasMontadas.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center border border-sky-200">
                          {t.identificador}
                        </span>
                        <div>
                          <div className="text-xs font-black text-slate-900 leading-tight">
                            Turma {t.identificador}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                            {t.min} a {t.max} anos
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerTurma(t.id)}
                        className="text-rose-500 hover:text-rose-700 p-2 rounded-lg text-xs"
                        title="Remover turma"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AVISOS DE GAPS E OVERLAPS */}
            {analiseFaixas.overlaps.length > 0 && (
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3.5 text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Sobreposição de idades detectada:
                </div>
                {analiseFaixas.overlaps.map((msg, i) => (
                  <div key={i} className="text-[11px] text-rose-800 pl-5">
                    • {msg}
                  </div>
                ))}
              </div>
            )}

            {analiseFaixas.gaps.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Lacuna etária entre as turmas:
                </div>
                {analiseFaixas.gaps.map((msg, i) => (
                  <div key={i} className="text-[11px] text-amber-800 pl-5">
                    • {msg}
                  </div>
                ))}
              </div>
            )}

            {/* BOTÃO AVANÇAR */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!analiseFaixas.pronta}
                onClick={() => setEtapa(2)}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition shadow-md ${
                  analiseFaixas.pronta
                    ? "bg-sky-700 hover:bg-sky-800 text-white cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                <span>Avançar para Dias da Semana</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 2: DIAS DA SEMANA */}
        {/* ========================================================= */}
        {etapa === 2 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-700" />
                Dias em que você atende este núcleo
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Selecione os dias da semana em que você dá aulas neste polo. O calendário da próxima etapa mostrará apenas os dias marcados.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(DIAS_MAP).map(([diaKey, info]) => {
                const ativo = diasSelecionados.includes(diaKey);
                return (
                  <button
                    key={diaKey}
                    type="button"
                    onClick={() => toggleDiaSemana(diaKey)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      ativo
                        ? "bg-sky-50 border-sky-600 text-sky-950 font-black shadow-xs ring-1 ring-sky-500"
                        : "bg-white border-slate-200 text-slate-700 font-bold hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                        {info.curto}
                      </div>
                      <div className="text-xs mt-0.5">{info.nome.split("-")[0]}</div>
                    </div>
                    {ativo && <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="flex-1 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={diasSelecionados.length === 0}
                onClick={() => setEtapa(3)}
                className={`flex-2 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition shadow-md ${
                  diasSelecionados.length > 0
                    ? "bg-sky-700 hover:bg-sky-800 text-white cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                <span>Avançar para Calendário</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 3: CALENDÁRIO DE HORÁRIOS */}
        {/* ========================================================= */}
        {etapa === 3 && (
          <div className="space-y-4">
            {/* WIDGET DE CHECKLIST DE TURMAS ALOCADAS */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">Alocação das Turmas na Semana</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    todasTurmasAlocadas
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  {statusAlocacaoTurmas.filter((s) => s.alocada).length} de {turmasMontadas.length} alocadas
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {statusAlocacaoTurmas.map((st) => (
                  <span
                    key={st.turma.id}
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border ${
                      st.alocada
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-300 animate-pulse"
                    }`}
                  >
                    {st.alocada ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                    )}
                    Turma {st.turma.identificador} ({st.totalSlots} {st.totalSlots === 1 ? "bloco" : "blocos"})
                  </span>
                ))}
              </div>
            </div>

            {/* GRID DO MINI-CALENDÁRIO COM OS DIAS SELECIONADOS */}
            <div className="grid grid-cols-1 gap-3">
              {[...diasSelecionados]
                .sort((a, b) => DIAS_MAP[a].order - DIAS_MAP[b].order)
                .map((diaKey) => {
                  const info = DIAS_MAP[diaKey];
                  const slotsDoDia = distribuicaoHorarios.filter((s) => s.dia === diaKey);

                  return (
                    <div
                      key={diaKey}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                    >
                      <div className="bg-sky-800 text-white px-3.5 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                            {info.curto}
                          </span>
                          <span className="text-xs font-bold">{info.nome.split("-")[0]}</span>
                        </div>
                        <span className="text-[10px] opacity-80">
                          {slotsDoDia.length} {slotsDoDia.length === 1 ? "bloco" : "blocos"}
                        </span>
                      </div>

                      <div className="p-3 space-y-2">
                        {slotsDoDia.map((slot) => {
                          const turmasAlocadas = turmasMontadas.filter((t) =>
                            slot.turmasIds.includes(t.id)
                          );
                          const isMulti = turmasAlocadas.length > 1;
                          const durMin = horaParaMinutos(slot.fim) - horaParaMinutos(slot.inicio);
                          const horas = Math.floor(durMin / 60);
                          const mins = durMin % 60;
                          const durStr = mins > 0 ? `${horas}h${mins}m` : `${horas}h`;

                          return (
                            <div
                              key={slot.id}
                              onClick={() => abrirModalEditarBloco(slot)}
                              className={`p-3 rounded-xl border transition cursor-pointer hover:shadow-md ${
                                isMulti
                                  ? "border-amber-400 bg-amber-50/40"
                                  : "border-sky-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                                <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-600" />
                                  {slot.inicio} - {slot.fim}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removerBloco(slot.id);
                                  }}
                                  className="text-rose-400 hover:text-rose-600 p-1 text-xs"
                                  title="Remover bloco"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* DESTAQUE DE TÉRMINO SE MULTI-TURMA */}
                              {isMulti && (
                                <div className="mb-2 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Users className="w-2.5 h-2.5" /> Multi-turmas
                                    </span>
                                    <span className="text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                      {durStr}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-black text-amber-950 bg-amber-100/90 border border-amber-300/80 rounded px-1.5 py-0.5 flex items-center gap-1">
                                    <Flag className="w-3 h-3 text-amber-700" /> Término: {slot.fim} (bloco com {turmasAlocadas.length} turmas)
                                  </div>
                                </div>
                              )}

                              {/* LISTA VERTICAL DE TODAS AS TURMAS COM NOME E IDADE */}
                              <div className="space-y-1">
                                {turmasAlocadas.map((t) => (
                                  <div
                                    key={t.id}
                                    className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs"
                                  >
                                    <span className="font-black text-slate-800">Turma {t.identificador}</span>
                                    <span className="text-[11px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                      {t.min} a {t.max} anos
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* BOTÃO ADICIONAR BLOCO NO DIA */}
                        <button
                          type="button"
                          onClick={() => abrirModalNovoBloco(diaKey)}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-100/60 text-sky-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Adicionar Bloco em {info.nome.split("-")[0]}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* BOTÕES DE VOLTAR E CONFIRMAR GRADE */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  disabled={!todasTurmasAlocadas || salvando}
                  onClick={handleFinalizarHomologacao}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition shadow-lg ${
                    todasTurmasAlocadas && !salvando
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {salvando ? (
                    <span>Homologando Grade...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Grade Completa e Ir para Chamada</span>
                    </>
                  )}
                </button>
              </div>

              {!todasTurmasAlocadas && (
                <p className="text-[11px] text-rose-600 text-center font-bold">
                  Você precisa alocar todas as turmas criadas em pelo menos um horário antes de homologar a grade.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR BLOCO DE HORÁRIO */}
      {/* ========================================================= */}
      {modalBlocoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalBlocoAberto(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative bg-white rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {slotEmEdicaoId ? "Editar Bloco em" : "Novo Bloco em"}{" "}
                  <span className="text-sky-700">{DIAS_MAP[diaAlvoModal]?.nome}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Escolha o horário e marque as turmas participantes</p>
              </div>
              <button
                type="button"
                onClick={() => setModalBlocoAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* HORÁRIOS */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800">1. Horário do Bloco:</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Início:</span>
                  <input
                    type="time"
                    value={modalInicio}
                    onChange={(e) => setModalInicio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Término:</span>
                  <input
                    type="time"
                    value={modalFim}
                    onChange={(e) => setModalFim(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* BANNER INFORMATIVO SE HORÁRIOS DIVIDIDOS */}
            {bannerAvisoAjusteCompleto && (
              <div className="rounded-2xl p-3 bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-amber-950 text-xs">Ajuste o horário completo deste bloco</div>
                  <div className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                    Como as turmas dividem o tempo, informe o horário completo de início e término em que você estará em atividade com elas (ex: 08:00 às 11:00). Ambas permanecerão neste mesmo bloco.
                  </div>
                </div>
              </div>
            )}

            {/* AVISO DE CONFLITO NO MESMO DIA */}
            {conflitoSlotNoDia && (
              <div className="rounded-2xl p-3 bg-rose-50 border border-rose-300 text-xs text-rose-950 font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-rose-900 text-xs">Horário já ocupado neste dia!</div>
                  <div className="text-[11px] text-rose-800 font-normal mt-0.5 leading-snug">
                    Já existe outro bloco cadastrado em {conflitoSlotNoDia.diaNome} das {conflitoSlotNoDia.inicio} às {conflitoSlotNoDia.fim}. Nenhum slot pode ter o mesmo horário no mesmo dia.
                  </div>
                </div>
              </div>
            )}

            {/* SELEÇÃO DE TURMAS PARTICIPANTES */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800">2. Turmas que treinam neste bloco:</label>
              <div className="space-y-1.5">
                {turmasMontadas.map((t) => {
                  const marcada = turmasMarcadasModal.includes(t.id);

                  // Verifica se essa turma já tem outro horário no mesmo dia (sem colisão direta)
                  const outroSlot = distribuicaoHorarios.find(
                    (s) =>
                      s.id !== slotEmEdicaoId &&
                      s.dia === diaAlvoModal &&
                      s.turmasIds.includes(t.id) &&
                      !horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
                  );

                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        marcada
                          ? "border-sky-500 bg-sky-50/40"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={marcada}
                          onChange={() => toggleCheckboxTurmaModal(t.id)}
                          className="w-4 h-4 text-sky-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800">Turma {t.identificador}</span>
                          {outroSlot && (
                            <span className="text-[9px] ml-2 bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded">
                              Também às {outroSlot.inicio}-{outroSlot.fim}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                        {t.min}-{t.max} anos
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* REPLICAR EM OUTROS DIAS (SEMPRE DESMARCADAS POR PADRÃO) */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-xs font-black text-slate-800">
                3. Replicar este bloco em outros dias? (opcional)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {diasSelecionados
                  .filter((d) => d !== diaAlvoModal)
                  .map((diaKey) => {
                    const ativo = diasReplicacaoModal.includes(diaKey);
                    return (
                      <button
                        key={diaKey}
                        type="button"
                        onClick={() => toggleReplicacaoDia(diaKey)}
                        className={`py-2 rounded-xl border text-xs font-bold transition ${
                          ativo
                            ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {DIAS_MAP[diaKey].curto}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* BOTÕES MODAL */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalBlocoAberto(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={Boolean(conflitoSlotNoDia)}
                onClick={salvarBlocoModal}
                className={`flex-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 ${
                  conflitoSlotNoDia
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-sky-700 hover:bg-sky-800 text-white cursor-pointer"
                }`}
              >
                <span>{slotEmEdicaoId ? "Salvar Alterações" : "Colocar Bloco no Calendário"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE DURAÇÃO (SOBREPÕE TUDO) */}
      {/* ========================================================= */}
      {modalDuracaoAberta && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            onClick={recusarDuracaoModal}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 border-2 border-amber-400">
            {/* BANNER GIGANTE DE TÉRMINO */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-5 rounded-2xl shadow-xl space-y-1 border border-amber-300/40">
              <div className="text-[11px] uppercase font-black text-amber-100 tracking-wider flex items-center justify-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Horário de Término do Bloco
              </div>
              <div className="text-4xl font-black tracking-tight drop-shadow-sm">{modalFim}</div>
              <div className="text-xs font-bold text-amber-100 bg-black/20 rounded-lg py-1 px-3 inline-block mt-1">
                Duração total: das {modalInicio} às {modalFim}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 leading-snug">
                Mais de uma turma neste mesmo bloco
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                O tempo de duração informado ({modalInicio} às {modalFim}) cobre todo o horário deste bloco com as turmas selecionadas?
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 font-medium text-left space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-600" /> Como funciona:
              </div>
              <div className="text-amber-800 leading-snug space-y-1">
                <div>• Se todas treinam juntas neste mesmo horário, clique em <strong>"Sim, o horário está correto"</strong>.</div>
                <div>• Se os horários forem divididos entre as turmas, clique em <strong>"Não, os horários são divididos"</strong> para informar o início e término total do bloco (ex: 08:00 às 11:00). Ambas as turmas continuarão neste mesmo bloco único.</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={confirmarDuracaoModal}
                className="w-full py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sim, o horário do bloco está correto</span>
              </button>
              <button
                type="button"
                onClick={recusarDuracaoModal}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Não, os horários são divididos (ajustar horário completo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAR DUPLICIDADE DE TURMA NO DIA */}
      {/* ========================================================= */}
      {modalDuplicidadeAberto && infoDuplicidade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={cancelarTurmaDuplicada} className="absolute inset-0 bg-slate-900/60" />
          <div className="relative bg-white rounded-3xl p-5 shadow-2xl max-w-xs w-full text-center space-y-3.5 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800">Turma já adicionada no dia</h3>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                A <strong>{infoDuplicidade.turmaNome}</strong> já foi adicionada em <strong>{infoDuplicidade.horarioStr}</strong> ({infoDuplicidade.diaNome}).
                <br />
                <span className="font-bold text-slate-800">É isso mesmo que você deseja fazer?</span>
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={cancelarTurmaDuplicada}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Não, cancelar
              </button>
              <button
                type="button"
                onClick={confirmarTurmaDuplicada}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md"
              >
                Sim, é isso mesmo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
