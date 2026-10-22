"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Info,
  Flag,
  Lock,
  Check,
  CheckSquare,
  Shield,
  HelpCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { FuncionarioApi, NucleoApi } from "@/lib/api/services";

export interface TurmaMontada {
  id: string;
  identificador: string;
  min: number | null;
  max: number | null;
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
  totalAlunosPolo?: number;
  onConcluirHomologacao: (dados: {
    turmas: Array<{
      id: string;
      identificador: string;
      min: number;
      max: number;
      label: string;
    }>;
    diasSelecionados: string[];
    gradeHorarios: SlotHorarioGrade[];
  }) => Promise<void>;
  onCancelar?: () => void;
}

const DIAS_MAP: Record<string, { id: string; nome: string; curto: string; order: number }> = {
  seg: { id: "seg", nome: "Segunda-feira", curto: "Seg", order: 1 },
  ter: { id: "ter", nome: "Terça-feira", curto: "Ter", order: 2 },
  qua: { id: "qua", nome: "Quarta-feira", curto: "Qua", order: 3 },
  qui: { id: "qui", nome: "Quinta-feira", curto: "Qui", order: 4 },
  sex: { id: "sex", nome: "Sexta-feira", curto: "Sex", order: 5 },
  sab: { id: "sab", nome: "Sábado", curto: "Sáb", order: 6 },
};

const TODAS_AS_IDADES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const LETRAS_TURMAS = ["A", "B", "C", "D", "E", "F", "G", "H"];

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
  totalAlunosPolo = 0,
  onConcluirHomologacao,
  onCancelar,
}: GateHomologacaoGradeProps) {
  // Stepper: 1 = Minhas Turmas, 2 = Dias de Treino, 3 = Grade Semanal
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // 1ª Etapa: Turmas Montadas (inicia 100% vazia)
  const [turmasMontadas, setTurmasMontadas] = useState<TurmaMontada[]>([]);

  // 2ª Etapa: Dias da Semana Selecionados (inicia 100% limpa, zero pré-marcado)
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
  const [highlightFim, setHighlightFim] = useState(false);

  // Modal Confirmação Duplicidade de Horário no mesmo dia
  const [modalDuplicidadeAberto, setModalDuplicidadeAberto] = useState(false);
  const [pendenteTurmaDuplicadaId, setPendenteTurmaDuplicadaId] = useState<string | null>(null);
  const [infoDuplicidade, setInfoDuplicidade] = useState<{
    turmaNome: string;
    diaNome: string;
    horarioStr: string;
  } | null>(null);
  const [turmasDuplicadasAprovadas, setTurmasDuplicadasAprovadas] = useState<Set<string>>(new Set());

  // Modal de Confirmação de Duração / Horário Completo em Bloco Multiturma
  const [modalDuracaoAberta, setModalDuracaoAberta] = useState(false);
  const [duracaoConfirmada, setDuracaoConfirmada] = useState(false);

  // Estado de envio
  const [salvando, setSalvando] = useState(false);

  // -------------------------------------------------------------
  // VALIDAÇÕES DA ETAPA 1 (FAIXAS CONTÍGUAS, SEM OVERLAP E SEM LACUNAS)
  // -------------------------------------------------------------
  const conflitosIdade = useMemo(() => {
    const conflitos: Array<{
      turma1: TurmaMontada;
      turma2: TurmaMontada;
      sobreposicao: string;
    }> = [];

    for (let i = 0; i < turmasMontadas.length; i++) {
      for (let j = i + 1; j < turmasMontadas.length; j++) {
        const t1 = turmasMontadas[i];
        const t2 = turmasMontadas[j];

        if (t1.min === null || t1.max === null || t2.min === null || t2.max === null) {
          continue;
        }

        const inicioMax = Math.max(t1.min, t2.min);
        const fimMin = Math.min(t1.max, t2.max);

        if (inicioMax <= fimMin) {
          conflitos.push({
            turma1: t1,
            turma2: t2,
            sobreposicao: `${inicioMax} a ${fimMin} anos`,
          });
        }
      }
    }

    return conflitos;
  }, [turmasMontadas]);

  const lacunasIdade = useMemo(() => {
    const completas = turmasMontadas.filter((t) => t.min !== null && t.max !== null);
    if (completas.length < 2) return [];

    const ordenadas = [...completas].sort((a, b) => (a.min ?? 0) - (b.min ?? 0));
    const lacunas: Array<{
      turmaAnterior: TurmaMontada;
      turmaProxima: TurmaMontada;
      idades: number[];
      descricao: string;
    }> = [];

    for (let i = 0; i < ordenadas.length - 1; i++) {
      const tAtual = ordenadas[i];
      const tProx = ordenadas[i + 1];

      if (tAtual.max !== null && tProx.min !== null && tProx.min > tAtual.max + 1) {
        const idades: number[] = [];
        for (let age = tAtual.max + 1; age < tProx.min; age++) {
          idades.push(age);
        }
        lacunas.push({
          turmaAnterior: tAtual,
          turmaProxima: tProx,
          idades,
          descricao:
            idades.length === 1 ? `${idades[0]} anos` : `${idades[0]} a ${idades[idades.length - 1]} anos`,
        });
      }
    }
    return lacunas;
  }, [turmasMontadas]);

  const todasCompletas = useMemo(() => {
    return turmasMontadas.length > 0 && turmasMontadas.every((t) => t.min !== null && t.max !== null);
  }, [turmasMontadas]);

  const ultimaTurmaCompleta = useMemo(() => {
    if (turmasMontadas.length === 0) return true;
    const ultima = turmasMontadas[turmasMontadas.length - 1];
    return ultima.min !== null && ultima.max !== null;
  }, [turmasMontadas]);

  const podeAvancarEtapa1 =
    todasCompletas && conflitosIdade.length === 0 && lacunasIdade.length === 0;

  function adicionarNovaTurma() {
    if (turmasMontadas.length > 0) {
      const ultima = turmasMontadas[turmasMontadas.length - 1];
      if (ultima.min === null || ultima.max === null) {
        alert(
          `Por favor, configure a idade mínima e máxima da Turma ${ultima.identificador} antes de adicionar outra.`
        );
        return;
      }
    }

    const nextId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const letra = LETRAS_TURMAS[turmasMontadas.length % LETRAS_TURMAS.length];

    setTurmasMontadas((prev) => [
      ...prev,
      {
        id: nextId,
        identificador: letra,
        min: null,
        max: null,
        label: `Turma ${letra}`,
        cor: "sky",
      },
    ]);
  }

  function removerTurma(turmaId: string) {
    setTurmasMontadas((prev) => prev.filter((x) => x.id !== turmaId));
    setDistribuicaoHorarios((prev) =>
      prev
        .map((slot) => ({
          ...slot,
          turmasIds: slot.turmasIds.filter((id) => id !== turmaId),
        }))
        .filter((slot) => slot.turmasIds.length > 0)
    );
  }

  function atualizarIdadeTurma(turmaId: string, campo: "min" | "max", valor: number | null) {
    setTurmasMontadas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const clone = { ...t, [campo]: valor };

        if (campo === "min") {
          if (clone.max !== null && (valor === null || clone.max < valor)) {
            clone.max = null;
          }
          const outrasSuperiores = prev.filter(
            (o) => o.id !== t.id && o.min !== null && valor !== null && o.min > valor
          );
          if (outrasSuperiores.length > 0) {
            const menorInicio = Math.min(...outrasSuperiores.map((o) => o.min as number));
            if (clone.max !== null && clone.max >= menorInicio) {
              clone.max = null;
            }
          }
        }
        return clone;
      })
    );
  }

  function avancarParaEtapa2() {
    if (!podeAvancarEtapa1) return;
    setEtapa(2);
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES DA ETAPA 2 (DIAS DA SEMANA)
  // -------------------------------------------------------------
  function toggleDiaEtapa2(diaKey: string) {
    setDiasSelecionados((prev) => {
      if (prev.includes(diaKey)) {
        setDistribuicaoHorarios((slots) => slots.filter((s) => s.dia !== diaKey));
        return prev.filter((d) => d !== diaKey);
      } else {
        return [...prev, diaKey];
      }
    });
  }

  function avancarParaEtapa3() {
    if (diasSelecionados.length === 0) return;
    setEtapa(3);
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES DA ETAPA 3 (CALENDÁRIO & CHECKLIST DE ALOCAÇÃO)
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

  const turmasPendentes = useMemo(() => {
    return statusAlocacaoTurmas.filter((s) => !s.alocada);
  }, [statusAlocacaoTurmas]);

  const todasTurmasDistribuidas =
    turmasMontadas.length > 0 && turmasPendentes.length === 0;

  const diasOrdenados = useMemo(() => {
    return [...diasSelecionados].sort((a, b) => (DIAS_MAP[a]?.order ?? 0) - (DIAS_MAP[b]?.order ?? 0));
  }, [diasSelecionados]);

  function abrirModalNovoBloco(diaEscolhido?: string) {
    setSlotEmEdicaoId(null);
    setDuracaoConfirmada(false);
    setTurmasDuplicadasAprovadas(new Set());
    setBannerAvisoAjusteCompleto(false);

    const dia = diaEscolhido || diasOrdenados[0] || "seg";
    setDiaAlvoModal(dia);

    const slotsDoDia = distribuicaoHorarios
      .filter((s) => s.dia === dia)
      .sort((a, b) => horaParaMinutos(a.fim) - horaParaMinutos(b.fim));

    let defInicio = "08:00";
    let defFim = dia === "sab" ? "11:00" : "09:30";

    if (slotsDoDia.length > 0) {
      const ultimoSlot = slotsDoDia[slotsDoDia.length - 1];
      const minFim = horaParaMinutos(ultimoSlot.fim);
      if (minFim < 18 * 60) {
        defInicio = ultimoSlot.fim;
        const duracaoMin = dia === "sab" ? 180 : 90;
        const novoMinFim = Math.min(minFim + duracaoMin, 19 * 60);
        const hFim = String(Math.floor(novoMinFim / 60)).padStart(2, "0");
        const mFim = String(novoMinFim % 60).padStart(2, "0");
        defFim = `${hFim}:${mFim}`;
      }
    }

    setModalInicio(defInicio);
    setModalFim(defFim);
    setTurmasMarcadasModal([]);
    setDiasReplicacaoModal([]);
    setModalBlocoAberto(true);
  }

  function abrirModalEditarBloco(slot: SlotHorarioGrade) {
    setSlotEmEdicaoId(slot.id);
    setDiaAlvoModal(slot.dia);
    setTurmasDuplicadasAprovadas(new Set(slot.turmasIds));
    setDuracaoConfirmada(slot.turmasIds.length >= 2);
    setBannerAvisoAjusteCompleto(false);

    setModalInicio(slot.inicio);
    setModalFim(slot.fim);
    setTurmasMarcadasModal([...slot.turmasIds]);
    setDiasReplicacaoModal([]);
    setModalBlocoAberto(true);
  }

  const conflitoSlotNoDia = useMemo(() => {
    if (!modalBlocoAberto) return null;
    if (!modalInicio || !modalFim || horaParaMinutos(modalInicio) >= horaParaMinutos(modalFim)) {
      return null;
    }

    const slotExistente = distribuicaoHorarios.find(
      (s) =>
        s.id !== slotEmEdicaoId &&
        s.dia === diaAlvoModal &&
        horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
    );

    if (slotExistente) {
      return {
        diaNome: DIAS_MAP[diaAlvoModal]?.nome || diaAlvoModal,
        inicio: slotExistente.inicio,
        fim: slotExistente.fim,
      };
    }
    return null;
  }, [modalBlocoAberto, modalInicio, modalFim, slotEmEdicaoId, diaAlvoModal, distribuicaoHorarios]);

  function aoAlternarCheckboxTurma(turmaId: string) {
    const isMarcada = turmasMarcadasModal.includes(turmaId);

    if (!isMarcada) {
      const colidente = distribuicaoHorarios.find(
        (s) =>
          s.id !== slotEmEdicaoId &&
          s.dia === diaAlvoModal &&
          s.turmasIds.includes(turmaId) &&
          horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
      );

      if (colidente) {
        const t = turmasMontadas.find((x) => x.id === turmaId);
        const nomeT = t ? `Turma ${t.identificador}` : "Esta turma";
        alert(
          `Atenção: A ${nomeT} jamais poderá ser adicionada no mesmo horário no mesmo dia (${DIAS_MAP[diaAlvoModal].nome} das ${colidente.inicio} às ${colidente.fim}).\n\nMude o horário do bloco para poder adicionar esta turma.`
        );
        return;
      }

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

      const novas = [...turmasMarcadasModal, turmaId];
      setTurmasMarcadasModal(novas);

      if (novas.length >= 2 && !duracaoConfirmada) {
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

  function confirmarDuracaoConjunta() {
    setDuracaoConfirmada(true);
    setModalDuracaoAberta(false);
    setBannerAvisoAjusteCompleto(false);
  }

  function recusarDuracaoConjunta() {
    setModalDuracaoAberta(false);
    setDuracaoConfirmada(true);
    setBannerAvisoAjusteCompleto(true);
    setHighlightFim(true);
    setTimeout(() => setHighlightFim(false), 3500);
  }

  function togglePillReplicacao(dia: string) {
    setDiasReplicacaoModal((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  function salvarBlocoModal() {
    if (!modalInicio || !modalFim) {
      alert("Por favor, informe o horário de início e término do bloco.");
      return;
    }

    if (horaParaMinutos(modalInicio) >= horaParaMinutos(modalFim)) {
      alert("O horário de término deve ser posterior ao horário de início.");
      return;
    }

    if (turmasMarcadasModal.length === 0) {
      alert("Selecione ao menos 1 turma para treinar neste bloco.");
      return;
    }

    const diasParaInserir = [diaAlvoModal, ...diasReplicacaoModal];

    for (const dia of diasParaInserir) {
      const slotExistente = distribuicaoHorarios.find(
        (s) =>
          s.id !== slotEmEdicaoId &&
          s.dia === dia &&
          horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
      );

      if (slotExistente) {
        alert(
          `Nenhum slot pode ter o mesmo horário no mesmo dia!\n\nJá existe outro bloco cadastrado em ${DIAS_MAP[dia].nome} no horário das ${slotExistente.inicio} às ${slotExistente.fim}.\n\nSe mais de uma turma treina neste horário, edite o bloco existente e selecione todas as turmas que treinam juntas.`
        );
        return;
      }

      for (const turmaId of turmasMarcadasModal) {
        const conflitoTurma = distribuicaoHorarios.find(
          (s) =>
            s.id !== slotEmEdicaoId &&
            s.dia === dia &&
            s.turmasIds.includes(turmaId) &&
            horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
        );
        if (conflitoTurma) {
          const t = turmasMontadas.find((x) => x.id === turmaId);
          const nomeT = t ? `Turma ${t.identificador}` : "A turma";
          alert(
            `Bloqueio de Horário:\n\n${nomeT} JAMAIS poderá ser adicionada no mesmo horário no mesmo dia!\n\nEla já possui aula em ${DIAS_MAP[dia].nome} das ${conflitoTurma.inicio} às ${conflitoTurma.fim}. Mude o horário para adicioná-la.`
          );
          return;
        }
      }
    }

    const slotEditando = slotEmEdicaoId
      ? distribuicaoHorarios.find((s) => s.id === slotEmEdicaoId)
      : null;
    const grupoIdAlvo = slotEditando?.grupoId || `grp_${Date.now()}`;

    setDistribuicaoHorarios((prev) => {
      let novaLista = [...prev];

      if (slotEmEdicaoId) {
        novaLista = novaLista.map((s) =>
          s.id === slotEmEdicaoId
            ? {
                ...s,
                inicio: modalInicio,
                fim: modalFim,
                turmasIds: [...turmasMarcadasModal],
                grupoId: grupoIdAlvo,
              }
            : s
        );

        diasReplicacaoModal.forEach((dia) => {
          const existenteOutroDia = novaLista.find(
            (s) =>
              s.dia === dia &&
              ((slotEditando?.grupoId && s.grupoId === slotEditando.grupoId) ||
                (s.inicio === modalInicio && s.fim === modalFim))
          );
          if (existenteOutroDia) {
            existenteOutroDia.inicio = modalInicio;
            existenteOutroDia.fim = modalFim;
            existenteOutroDia.turmasIds = [...turmasMarcadasModal];
            existenteOutroDia.grupoId = grupoIdAlvo;
          } else {
            novaLista.push({
              id: `slot_${Date.now()}_${dia}_${Math.random().toString(36).substring(2, 6)}`,
              dia,
              inicio: modalInicio,
              fim: modalFim,
              turmasIds: [...turmasMarcadasModal],
              grupoId: grupoIdAlvo,
            });
          }
        });
      } else {
        diasParaInserir.forEach((dia) => {
          novaLista.push({
            id: `slot_${Date.now()}_${dia}_${Math.random().toString(36).substring(2, 6)}`,
            dia,
            inicio: modalInicio,
            fim: modalFim,
            turmasIds: [...turmasMarcadasModal],
            grupoId: grupoIdAlvo,
          });
        });
      }

      return novaLista;
    });

    setModalBlocoAberto(false);
  }

  function removerSlotDistribuicao(id: string) {
    setDistribuicaoHorarios((prev) => prev.filter((s) => s.id !== id));
  }

  // -------------------------------------------------------------
  // CONFIRMAÇÃO FINAL E PERSISTÊNCIA MANDATÓRIA
  // -------------------------------------------------------------
  async function finalizarHomologacao() {
    if (!todasTurmasDistribuidas) {
      alert(
        "Atenção: Não é possível confirmar a grade pois existem turmas que ainda não foram alocadas em nenhum horário da semana."
      );
      return;
    }

    if (distribuicaoHorarios.length === 0) {
      alert("Coloque ao menos 1 bloco de aula no calendário antes de confirmar.");
      return;
    }

    try {
      setSalvando(true);
      const turmasSanitizadas = turmasMontadas.map((t) => ({
        id: t.id,
        identificador: t.identificador,
        min: t.min ?? 8,
        max: t.max ?? 11,
        label: t.label || `Turma ${t.identificador}`,
      }));

      await onConcluirHomologacao({
        turmas: turmasSanitizadas,
        diasSelecionados,
        gradeHorarios: distribuicaoHorarios,
      });
    } catch (err: any) {
      console.error("Erro na homologação:", err);
      alert(err?.message || "Ocorreu um erro ao gravar a grade. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const iniciaisProfessor = (professor.nomeCompleto || "PR")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const duracaoMinTotalModal = horaParaMinutos(modalFim) - horaParaMinutos(modalInicio);
  const horasTotModal = Math.floor(duracaoMinTotalModal / 60);
  const minsTotModal = duracaoMinTotalModal % 60;
  const duracaoStrTotModal =
    minsTotModal > 0 ? `${horasTotModal}h${minsTotModal}m` : `${horasTotModal} horas`;

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col">
      {/* ============================================================== */}
      {/* HEADER INTEGRADO DO PORTAL DO PROFESSOR                        */}
      {/* ============================================================== */}
      <div className="w-full bg-gradient-to-r from-sky-950 via-sky-900 to-indigo-950 text-white shadow-md border-b border-sky-800/40">
        <div className="max-w-7xl mx-auto w-full p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-base shadow-sm">
                {iniciaisProfessor}
              </div>
              <div>
                <div className="text-xs text-sky-200 font-semibold uppercase tracking-wider">
                  Professor(a) Responsável
                </div>
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {professor.nomeCompleto}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs text-sky-200">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-sky-300" />
                    {nucleo?.identificacao || "Polo Esportivo"}
                  </span>
                  <span>•</span>
                  <span>{totalAlunosPolo} alunos vinculados ao polo</span>
                </div>
              </div>
            </div>

            {onCancelar && (
              <button
                type="button"
                onClick={onCancelar}
                className="self-start sm:self-auto text-xs font-bold text-sky-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/15 transition cursor-pointer"
              >
                Cancelar e Voltar ao Painel
              </button>
            )}
          </div>

          {/* Stepper Integrado das 3 Etapas */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  etapa >= 1 ? "bg-sky-400" : "bg-white/20"
                }`}
              />
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  etapa >= 2 ? "bg-sky-400" : "bg-white/20"
                }`}
              />
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  etapa >= 3 ? "bg-sky-400" : "bg-white/20"
                }`}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-sky-200 font-medium">
              <span className="font-bold text-white">
                {etapa === 1 && "Etapa 1 de 3: Minhas Turmas"}
                {etapa === 2 && "Etapa 2 de 3: Dias de Treino"}
                {etapa === 3 && "Etapa 3 de 3: Grade Semanal"}
              </span>
              <span className="text-sky-300 font-mono">
                {etapa === 1 && "Passo 1/3 (33%)"}
                {etapa === 2 && "Passo 2/3 (66%)"}
                {etapa === 3 && "Passo 3/3 (100%)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CONTEÚDO DA ÁREA ÚTIL                                          */}
      {/* ============================================================== */}
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col space-y-6">
        {/* ============================================================ */}
        {/* ETAPA 1: DEFINIR AS TURMAS (SELECTS + LINHA CONTÍNUA)        */}
        {/* ============================================================ */}
        {etapa === 1 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" /> 1ª Etapa • Estruturação das Turmas
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Quais turmas você atende neste polo?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Defina a idade mínima e máxima de cada turma. Nenhuma faixa pode sobrepor ou deixar idades sem atendimento.
              </p>
            </div>

            {/* Regras de Validação das Faixas */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-950">
                  Regras de Validação das Faixas Etárias:
                </div>
                <ul className="text-xs text-amber-900 leading-snug mt-1.5 space-y-1">
                  <li>• Você escolhe livremente a idade mínima e máxima de cada turma atendida no polo.</li>
                  <li>• As idades <strong>não podem se cruzar</strong>. Se a Turma A vai até 11 anos, a próxima turma deve iniciar em 12 anos.</li>
                  <li>• <strong>Linha contínua:</strong> nenhuma idade pode ficar de fora (buraco/lacuna) entre as turmas do polo.</li>
                </ul>
              </div>
            </div>

            {/* Banner Dinâmico de Alerta (Sobreposição ou Lacuna) */}
            {conflitosIdade.length > 0 && (
              <div className="rounded-2xl p-4 text-xs font-bold flex items-start gap-2.5 bg-rose-50 border-2 border-rose-400 text-rose-950 animate-pulse">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black text-sm">Conflito de Sobreposição de Idades:</span>
                  <span className="text-xs font-medium block mt-0.5">
                    A <strong>Turma {conflitosIdade[0].turma1.identificador}</strong> e a{" "}
                    <strong>Turma {conflitosIdade[0].turma2.identificador}</strong> possuem idades
                    sobrepostas ({conflitosIdade[0].sobreposicao}). Corrija para continuar.
                  </span>
                </div>
              </div>
            )}

            {conflitosIdade.length === 0 && lacunasIdade.length > 0 && (
              <div className="rounded-2xl p-4 text-xs font-bold flex items-start gap-2.5 bg-amber-50 border-2 border-amber-400 text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black text-sm">
                    Idade fora da linha de turmas ({lacunasIdade[0].descricao} sem atendimento):
                  </span>
                  <span className="text-xs font-medium block mt-0.5">
                    Ficou uma lacuna entre a{" "}
                    <strong>
                      Turma {lacunasIdade[0].turmaAnterior.identificador} (até{" "}
                      {lacunasIdade[0].turmaAnterior.max} anos)
                    </strong>{" "}
                    e a{" "}
                    <strong>
                      Turma {lacunasIdade[0].turmaProxima.identificador} (começa em{" "}
                      {lacunasIdade[0].turmaProxima.min} anos)
                    </strong>
                    . Ajuste as faixas para que nenhuma idade fique sem atendimento.
                  </span>
                </div>
              </div>
            )}

            {/* Lista de Turmas Montadas */}
            <div className="space-y-3">
              {turmasMontadas.length === 0 ? (
                <div className="py-10 px-4 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto text-lg shadow-xs">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    Nenhuma turma adicionada ainda
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Toque no botão abaixo para adicionar a <strong>Turma A</strong> e definir a faixa
                    etária atendida no polo esportivo.
                  </p>
                </div>
              ) : (
                turmasMontadas
                  .slice()
                  .sort((a, b) => {
                    if (a.min === null) return 1;
                    if (b.min === null) return -1;
                    return a.min - b.min;
                  })
                  .map((t) => {
                    const emConflito = conflitosIdade.some(
                      (c) => c.turma1.id === t.id || c.turma2.id === t.id
                    );
                    const incompleta = t.min === null || t.max === null;
                    const lacunaAposEsta = lacunasIdade.find(
                      (l) => l.turmaAnterior.id === t.id
                    );

                    let cardBorder = "border-emerald-200 bg-white";
                    if (emConflito) {
                      cardBorder = "border-rose-400 bg-rose-50/20 ring-2 ring-rose-300";
                    } else if (lacunaAposEsta) {
                      cardBorder = "border-amber-400 bg-amber-50/15";
                    } else if (incompleta) {
                      cardBorder = "border-amber-300 bg-amber-50/15";
                    }

                    return (
                      <div key={t.id} className="space-y-2">
                        <div className={`p-4 sm:p-5 rounded-2xl border-2 transition shadow-xs space-y-3.5 ${cardBorder}`}>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shadow-xs ${
                                  emConflito
                                    ? "bg-rose-600 text-white"
                                    : lacunaAposEsta
                                    ? "bg-amber-500 text-white"
                                    : incompleta
                                    ? "bg-slate-200 text-slate-700"
                                    : "bg-sky-700 text-white"
                                }`}
                              >
                                {t.identificador}
                              </span>
                              <div>
                                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                  Turma {t.identificador}
                                  {emConflito && (
                                    <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded font-bold">
                                      Idade Sobreposta
                                    </span>
                                  )}
                                  {!emConflito && lacunaAposEsta && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Falta {lacunaAposEsta.descricao}
                                    </span>
                                  )}
                                  {!emConflito && !lacunaAposEsta && incompleta && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold">
                                      Configurando faixa...
                                    </span>
                                  )}
                                  {!emConflito && !lacunaAposEsta && !incompleta && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Faixa Definida
                                    </span>
                                  )}
                                </h4>
                                <div>
                                  {t.min === null && t.max === null ? (
                                    <span className="text-xs text-slate-400 font-medium">
                                      Selecione a idade mínima e máxima da turma
                                    </span>
                                  ) : t.min !== null && t.max === null ? (
                                    <span className="text-xs text-amber-700 font-bold">
                                      Mínima: {t.min} anos • Selecione a idade máxima
                                    </span>
                                  ) : (
                                    <span
                                      className={`text-xs ${
                                        lacunaAposEsta ? "text-amber-800 font-black" : "text-emerald-700 font-bold"
                                      }`}
                                    >
                                      Faixa etária: {t.min} a {t.max} anos
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removerTurma(t.id)}
                              className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-bold cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-xs font-bold text-slate-600 block mb-1.5">
                                Idade Mínima:
                              </label>
                              <select
                                value={t.min ?? ""}
                                onChange={(e) =>
                                  atualizarIdadeTurma(
                                    t.id,
                                    "min",
                                    e.target.value ? parseInt(e.target.value, 10) : null
                                  )
                                }
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer ${
                                  emConflito
                                    ? "border-rose-400 focus:ring-rose-500"
                                    : "border-slate-200 focus:ring-sky-500"
                                }`}
                              >
                                <option value="" disabled>
                                  -- Selecione a Mínima --
                                </option>
                                {TODAS_AS_IDADES.map((a) => {
                                  const ocupante = turmasMontadas.find(
                                    (o) =>
                                      o.id !== t.id &&
                                      o.min !== null &&
                                      o.max !== null &&
                                      a >= o.min &&
                                      a <= o.max
                                  );

                                  if (ocupante) {
                                    return (
                                      <option key={a} value={a} disabled className="text-slate-300 font-normal bg-slate-50">
                                        {a} anos (Ocupado na Turma {ocupante.identificador})
                                      </option>
                                    );
                                  }
                                  return (
                                    <option key={a} value={a}>
                                      {a} anos
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-600 block mb-1.5">
                                Idade Máxima:
                              </label>
                              <select
                                value={t.max ?? ""}
                                disabled={t.min === null}
                                onChange={(e) =>
                                  atualizarIdadeTurma(
                                    t.id,
                                    "max",
                                    e.target.value ? parseInt(e.target.value, 10) : null
                                  )
                                }
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-800 ${
                                  t.min === null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                                } ${
                                  emConflito
                                    ? "border-rose-400 focus:ring-rose-500"
                                    : "border-slate-200 focus:ring-sky-500"
                                }`}
                              >
                                {t.min === null ? (
                                  <option value="" disabled>
                                    -- Escolha a mínima primeiro --
                                  </option>
                                ) : (
                                  <>
                                    <option value="" disabled>
                                      -- Selecione a Máxima --
                                    </option>
                                    {(() => {
                                      const outrasSuperiores = turmasMontadas.filter(
                                        (o) => o.id !== t.id && o.min !== null && o.min > (t.min ?? 0)
                                      );
                                      const menorInicioSuperior =
                                        outrasSuperiores.length > 0
                                          ? Math.min(...outrasSuperiores.map((o) => o.min as number))
                                          : 999;
                                      const turmaBloqueadora = outrasSuperiores.find(
                                        (o) => o.min === menorInicioSuperior
                                      );

                                      return TODAS_AS_IDADES.filter((a) => a >= (t.min ?? 0)).map((a) => {
                                        if (a >= menorInicioSuperior) {
                                          return (
                                            <option
                                              key={a}
                                              value={a}
                                              disabled
                                              className="text-slate-300 font-normal bg-slate-50"
                                            >
                                              {a} anos (Ocupado na Turma{" "}
                                              {turmaBloqueadora ? turmaBloqueadora.identificador : ""})
                                            </option>
                                          );
                                        }
                                        return (
                                          <option key={a} value={a}>
                                            {a} anos
                                          </option>
                                        );
                                      });
                                    })()}
                                  </>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Gap Card Inserido Diretamente Entre as Duas Turmas com Buraco */}
                        {lacunaAposEsta && (
                          <div className="bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-2xl p-3.5 text-center space-y-1 shadow-2xs">
                            <div className="text-xs font-black text-amber-950 flex items-center justify-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              Buraco na linha de idades: <strong>{lacunaAposEsta.descricao}</strong> sem atendimento!
                            </div>
                            <p className="text-xs text-amber-800 leading-snug">
                              Entre a <strong>Turma {lacunaAposEsta.turmaAnterior.identificador} ({lacunaAposEsta.turmaAnterior.max} anos)</strong> e a{" "}
                              <strong>Turma {lacunaAposEsta.turmaProxima.identificador} ({lacunaAposEsta.turmaProxima.min} anos)</strong> não há nenhuma turma.
                            </p>
                            <div className="text-[11px] text-amber-900 font-bold bg-amber-100 rounded-lg py-1 px-3 inline-block mt-0.5">
                              Ajuste as faixas para cobrir a idade de {lacunaAposEsta.descricao} e poder avançar.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Bloco Adicionar Próxima Turma */}
            <div>
              <button
                type="button"
                onClick={adicionarNovaTurma}
                disabled={!ultimaTurmaCompleta}
                className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  !ultimaTurmaCompleta
                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "border-sky-500 bg-sky-50/60 hover:bg-sky-100 text-sky-800"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {turmasMontadas.length === 0
                    ? "+ Adicionar Turma A"
                    : !ultimaTurmaCompleta
                    ? "+ Adicionar Próxima Turma (Bloqueado)"
                    : `+ Adicionar Turma ${LETRAS_TURMAS[turmasMontadas.length % LETRAS_TURMAS.length]}`}
                </span>
              </button>
              <p className="text-xs text-slate-400 text-center mt-2 font-medium">
                {turmasMontadas.length === 0
                  ? "Defina as idades mínima e máxima de cada turma atendida no polo."
                  : !ultimaTurmaCompleta
                  ? "Configure a idade mínima e máxima da turma atual para liberar a próxima."
                  : "Faixas anteriores preenchidas. Você pode adicionar a próxima turma."}
              </p>
            </div>

            {/* Botão Avançar para Etapa 2 */}
            <div className="pt-3">
              <button
                type="button"
                onClick={avancarParaEtapa2}
                disabled={!podeAvancarEtapa1}
                className={`w-full py-4 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition duration-200 ${
                  !podeAvancarEtapa1
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-md"
                }`}
              >
                {!podeAvancarEtapa1 && <Lock className="w-4 h-4" />}
                <span>
                  {turmasMontadas.length === 0
                    ? "Adicione ao menos 1 turma para continuar"
                    : conflitosIdade.length > 0
                    ? "Corrija as faixas sobrepostas para avançar"
                    : lacunasIdade.length > 0
                    ? `Preencha a lacuna de ${lacunasIdade[0].descricao} para avançar`
                    : !todasCompletas
                    ? "Complete as idades mínima e máxima de todas as turmas"
                    : `Avançar para Escolher os Dias de Treino (${turmasMontadas.length} ${
                        turmasMontadas.length === 1 ? "Turma" : "Turmas"
                      })`}
                </span>
                {podeAvancarEtapa1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2: DIAS DA SEMANA (100% LIMPA / ZERO PRÉ-MARCADO)       */}
        {/* ============================================================ */}
        {etapa === 2 && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="text-xs text-sky-700 font-bold flex items-center gap-1 mb-2 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Turmas
              </button>
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" /> 2ª Etapa • Dias de Atividade
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                Em quais dias da semana você atende neste polo?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Selecione apenas os dias em que haverá treinos no campo (nada vem pré-marcado):
              </p>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-sky-950">Selecione seus dias de atendimento:</div>
                <p className="text-xs text-sky-800 leading-snug mt-1">
                  Toque nos dias em que você realiza os treinos. Na próxima etapa, o sistema montará a{" "}
                  <strong>grade semanal exclusivamente com os dias selecionados</strong> para você distribuir os horários.
                </p>
              </div>
            </div>

            {/* Grid dos Dias da Semana (TODOS DESMARCADOS NO INÍCIO) */}
            <div className="grid grid-cols-2 gap-3">
              {["seg", "ter", "qua", "qui", "sex", "sab"].map((diaKey) => {
                const ativo = diasSelecionados.includes(diaKey);
                return (
                  <button
                    key={diaKey}
                    type="button"
                    onClick={() => toggleDiaEtapa2(diaKey)}
                    className={`p-4 rounded-2xl border flex items-center justify-between font-bold text-xs sm:text-sm transition cursor-pointer ${
                      ativo
                        ? "bg-sky-600 text-white border-sky-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <span>{DIAS_MAP[diaKey]?.nome}</span>
                    <Check
                      className={`w-4 h-4 transition-opacity ${
                        ativo ? "opacity-100 text-white" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={avancarParaEtapa3}
                disabled={diasSelecionados.length === 0}
                className={`w-full py-4 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition duration-200 ${
                  diasSelecionados.length === 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-sky-700 hover:bg-sky-800 text-white cursor-pointer shadow-md"
                }`}
              >
                <span>
                  {diasSelecionados.length === 0
                    ? "Selecione ao menos 1 dia para continuar"
                    : `Avançar para a Grade de Horários (${diasSelecionados.length} ${
                        diasSelecionados.length === 1 ? "dia selecionado" : "dias selecionados"
                      })`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3: GRADE SEMANAL (CALENDÁRIO & BLOCOS DE HORÁRIO)      */}
        {/* ============================================================ */}
        {etapa === 3 && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setEtapa(2)}
                className="text-xs text-sky-700 font-bold flex items-center gap-1 mb-2 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Dias de Treino
              </button>
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckSquare className="w-4 h-4" /> 3ª Etapa • Distribuição da Grade
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Grade Semanal de Treinos
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Distribua todas as suas turmas nos horários da semana. Toque em qualquer bloco para editar:
              </p>
            </div>

            {/* Checklist de Alocação de 100% das Turmas */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-sky-600" /> Status de Alocação das Turmas:
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                    todasTurmasDistribuidas
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  {statusAlocacaoTurmas.filter((s) => s.alocada).length} de {turmasMontadas.length} turmas alocadas
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Todas as turmas cadastradas na Etapa 1 precisam ter pelo menos um bloco na semana para homologar a grade:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {statusAlocacaoTurmas.map((st) => (
                  <span
                    key={st.turma.id}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border ${
                      st.alocada
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-300 font-black animate-pulse"
                    }`}
                  >
                    {st.alocada ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                    )}
                    <span>
                      Turma {st.turma.identificador} ({st.alocada ? `${st.totalSlots} ${st.totalSlots === 1 ? "bloco" : "blocos"}` : "Sem horário"})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* O Calendário da Semana com Colunas para Cada Dia Selecionado */}
            <div className="w-full space-y-2.5">
              {diasOrdenados.length > 3 && (
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                  <span>Grade com {diasOrdenados.length} dias de treino:</span>
                  <span className="flex items-center gap-1 text-sky-800 font-bold bg-sky-100/80 px-2.5 py-1 rounded-xl border border-sky-200">
                    <ArrowRight className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                    Passe para o lado para ver todos os dias
                  </span>
                </div>
              )}

              <div className="w-full overflow-x-auto pb-4 pt-1">
                <div
                  className={`flex gap-3.5 ${
                    diasOrdenados.length <= 3 ? "flex-wrap md:flex-nowrap" : "min-w-max"
                  }`}
                >
                  {diasOrdenados.map((diaKey) => {
                    const info = DIAS_MAP[diaKey];
                    const slotsDoDia = distribuicaoHorarios.filter((s) => s.dia === diaKey);

                    return (
                      <div
                        key={diaKey}
                        className={`bg-white border border-slate-200 rounded-2xl flex flex-col min-h-[360px] overflow-hidden shadow-xs ${
                          diasOrdenados.length <= 3
                            ? "flex-1 min-w-[280px]"
                            : "w-[280px] sm:w-[310px] md:w-[320px] shrink-0"
                        }`}
                      >
                      {/* Header do Dia */}
                      <div className="bg-gradient-to-b from-sky-700 to-sky-800 text-white p-2.5 text-center">
                        <div className="text-[10px] font-black tracking-wider uppercase opacity-80">
                          {info.curto}
                        </div>
                        <div className="text-xs font-bold leading-tight">
                          {info.nome.split("-")[0]}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          {slotsDoDia.length} {slotsDoDia.length === 1 ? "bloco" : "blocos"}
                        </div>
                      </div>

                      {/* Blocos de Horário do Dia */}
                      <div className="bg-slate-50/70 flex-1 p-2.5 flex flex-col gap-2.5">
                        {slotsDoDia.map((slot) => {
                          const turmasAlocadas = turmasMontadas.filter((t) =>
                            slot.turmasIds.includes(t.id)
                          );
                          const isConjunta = turmasAlocadas.length > 1;
                          const duracaoMin =
                            horaParaMinutos(slot.fim) - horaParaMinutos(slot.inicio);
                          const horas = Math.floor(duracaoMin / 60);
                          const mins = duracaoMin % 60;
                          const duracaoStr = mins > 0 ? `${horas}h${mins}m` : `${horas}h`;

                          return (
                            <div
                              key={slot.id}
                              onClick={() => abrirModalEditarBloco(slot)}
                              title="Toque para editar este bloco"
                              className={`p-2.5 rounded-xl border-l-4 border transition cursor-pointer hover:shadow-md ${
                                isConjunta
                                  ? "border-l-amber-500 border-amber-300 bg-amber-50/50"
                                  : "border-l-sky-600 border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                                <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-600" /> {slot.inicio}-{slot.fim}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removerSlotDistribuicao(slot.id);
                                  }}
                                  title="Remover bloco"
                                  className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {isConjunta && (
                                <div className="mb-2 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Users className="w-2.5 h-2.5" /> Multi-turmas
                                    </span>
                                    <span className="text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                      {duracaoStr}
                                    </span>
                                  </div>
                                  <div className="text-[9px] font-black text-amber-950 bg-amber-100/90 border border-amber-300/80 rounded px-1.5 py-0.5 flex items-center gap-1">
                                    <Flag className="w-2.5 h-2.5 text-amber-700" /> Término: {slot.fim} ({turmasAlocadas.length} turmas)
                                  </div>
                                </div>
                              )}

                              {/* Cards Verticais Separados para Cada Turma */}
                              <div className="space-y-1">
                                {turmasAlocadas.map((t) => (
                                  <div
                                    key={t.id}
                                    className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs"
                                  >
                                    <div className="text-[10px] font-black text-slate-800 leading-tight">
                                      Turma {t.identificador}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                                      {t.min} a {t.max} anos
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Dropzone para Adicionar Novo Bloco no Dia */}
                        <button
                          type="button"
                          onClick={() => abrirModalNovoBloco(diaKey)}
                          className="mt-auto border-2 border-dashed border-sky-300 bg-sky-50/60 hover:bg-sky-100/90 rounded-xl p-3 text-center transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-sky-600 mx-auto" />
                          <div className="text-[11px] font-black text-sky-800 mt-0.5 leading-tight">
                            + Adicionar Bloco
                          </div>
                          <div className="text-[9px] text-sky-600">Toque aqui</div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

            {/* Botão Finalizar e Homologar Grade */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={finalizarHomologacao}
                disabled={!todasTurmasDistribuidas || salvando}
                className={`w-full py-4 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition duration-200 ${
                  !todasTurmasDistribuidas || salvando
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-lg active:scale-95"
                }`}
              >
                {!todasTurmasDistribuidas ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {salvando
                    ? "Homologando grade..."
                    : !todasTurmasDistribuidas
                    ? `Distribua todas as turmas para confirmar (${turmasPendentes
                        .map((p) => `Turma ${p.turma.identificador}`)
                        .join(", ")} sem horário)`
                    : "Confirmar Grade e Iniciar Aula"}
                </span>
              </button>
              <p className="text-xs text-slate-400 text-center font-medium">
                {!todasTurmasDistribuidas ? (
                  <span className="text-rose-600 font-bold">
                    Você precisa alocar todas as turmas criadas em pelo menos um bloco da semana antes de homologar.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">
                    Todas as turmas estão alocadas! Ao confirmar, a grade será gravada e a 1ª aula do dia será iniciada.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL INSERIR / EDITAR BLOCO (BOTTOM SHEET / DIALOG)            */}
      {/* ============================================================== */}
      {modalBlocoAberto && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setModalBlocoAberto(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-sm font-bold">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                    {slotEmEdicaoId ? "Editar Bloco em " : "Novo Bloco em "}
                    <span className="text-sky-700">{DIAS_MAP[diaAlvoModal]?.nome}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina o horário e marque quais turmas treinam neste bloco
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalBlocoAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Horários do Bloco */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800">1. Horário do Bloco:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Início:</span>
                  <input
                    type="time"
                    value={modalInicio}
                    onChange={(e) => setModalInicio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Término:</span>
                  <input
                    type="time"
                    value={modalFim}
                    onChange={(e) => setModalFim(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition ${
                      highlightFim ? "ring-4 ring-sky-500 bg-sky-50 border-sky-400" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Banner Informativo se Horários Divididos */}
            {bannerAvisoAjusteCompleto && (
              <div className="rounded-2xl p-3 bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium flex items-start gap-2.5 animate-in fade-in">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-amber-950 text-xs">
                    Ajuste o horário completo deste bloco
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                    Como as turmas dividem o tempo, informe o horário completo de início e término em que
                    você estará em atividade com elas (ex: 08:00 às 11:00). Ambas permanecerão cadastradas neste mesmo bloco.
                  </div>
                </div>
              </div>
            )}

            {/* Alerta de Conflito no Mesmo Dia */}
            {conflitoSlotNoDia && (
              <div className="rounded-2xl p-3.5 bg-rose-50 border-2 border-rose-400 text-xs text-rose-950 font-bold flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-rose-900 text-xs">Horário já ocupado neste dia!</div>
                  <div className="font-normal text-[11px] text-rose-800 mt-0.5 leading-snug">
                    Nenhum slot pode ter o mesmo horário no mesmo dia ({conflitoSlotNoDia.diaNome} das{" "}
                    {conflitoSlotNoDia.inicio} às {conflitoSlotNoDia.fim}). Se mais de uma turma treina
                    neste horário, edite o bloco existente para marcar as turmas conjuntas.
                  </div>
                </div>
              </div>
            )}

            {/* 2. Seleção de Turmas Participantes */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  2. Quais turmas treinam neste bloco?
                </label>
                {duracaoConfirmada && turmasMarcadasModal.length >= 2 && (
                  <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Flag className="w-2.5 h-2.5" /> Conjunto até as {modalFim}
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-800 leading-snug">
                Marque as turmas deste horário. A mesma turma não pode ter o mesmo horário no mesmo dia:
              </p>

              <div className="space-y-2 pt-1">
                {turmasMontadas.map((t) => {
                  const marcada = turmasMarcadasModal.includes(t.id);

                  const slotColidenteMesmoHorario = distribuicaoHorarios.find(
                    (s) =>
                      s.id !== slotEmEdicaoId &&
                      s.dia === diaAlvoModal &&
                      s.turmasIds.includes(t.id) &&
                      horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
                  );

                  const outroSlotNoDiaDiferente = distribuicaoHorarios.find(
                    (s) =>
                      s.id !== slotEmEdicaoId &&
                      s.dia === diaAlvoModal &&
                      s.turmasIds.includes(t.id) &&
                      !horariosColidem(modalInicio, modalFim, s.inicio, s.fim)
                  );

                  const desabilitada = Boolean(conflitoSlotNoDia || slotColidenteMesmoHorario);

                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        desabilitada
                          ? "border-rose-200 bg-rose-50/40 opacity-70 cursor-not-allowed"
                          : marcada
                          ? "border-sky-500 bg-sky-50/70 cursor-pointer"
                          : outroSlotNoDiaDiferente
                          ? "border-amber-200 bg-amber-50/20 cursor-pointer hover:border-amber-400"
                          : "border-slate-200 bg-white cursor-pointer hover:border-sky-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={marcada}
                          disabled={desabilitada}
                          onChange={() => aoAlternarCheckboxTurma(t.id)}
                          className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Turma {t.identificador}
                          </span>
                          {slotColidenteMesmoHorario && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 border border-rose-300 font-bold px-1.5 py-0.5 rounded">
                              Já tem aula neste horário ({slotColidenteMesmoHorario.inicio}-{slotColidenteMesmoHorario.fim})
                            </span>
                          )}
                          {!slotColidenteMesmoHorario && outroSlotNoDiaDiferente && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded">
                              {marcada
                                ? `Também às ${outroSlotNoDiaDiferente.inicio}-${outroSlotNoDiaDiferente.fim}`
                                : `Já em ${outroSlotNoDiaDiferente.inicio}-${outroSlotNoDiaDiferente.fim}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded-lg border border-sky-200">
                        {t.min}-{t.max} anos
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Replicar este Bloco em Outros Dias (100% DESMARCADAS) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800">
                3. Replicar este bloco em outros dias de treino? (opcional)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {diasOrdenados
                  .filter((dia) => dia !== diaAlvoModal)
                  .map((dia) => {
                    const ativo = diasReplicacaoModal.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => togglePillReplicacao(dia)}
                        className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          ativo
                            ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {DIAS_MAP[dia]?.curto}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Botões do Modal */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalBlocoAberto(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarBlocoModal}
                disabled={Boolean(conflitoSlotNoDia)}
                className={`flex-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  conflitoSlotNoDia
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-sky-700 hover:bg-sky-800 text-white"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {slotEmEdicaoId ? "Salvar Alterações" : "Colocar Bloco na Grade"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAÇÃO DE DUPLICIDADE NO DIA                       */}
      {/* ============================================================== */}
      {modalDuplicidadeAberto && infoDuplicidade && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            onClick={cancelarTurmaDuplicada}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl shadow-inner">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800">Turma já adicionada no dia</h3>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                A <strong>{infoDuplicidade.turmaNome}</strong> já foi adicionada em{" "}
                <strong>{infoDuplicidade.horarioStr}</strong> ({infoDuplicidade.diaNome}).
                <br />
                <br />
                <span className="font-bold text-slate-800">É isso mesmo que você deseja fazer?</span>
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={cancelarTurmaDuplicada}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Não, cancelar
              </button>
              <button
                type="button"
                onClick={confirmarTurmaDuplicada}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Sim, é isso mesmo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DESTAQUE DE DURAÇÃO CONJUNTA (SOBREPONDO TUDO)          */}
      {/* ============================================================== */}
      {modalDuracaoAberta && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            onClick={recusarDuracaoConjunta}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 border-2 border-amber-400 animate-in fade-in zoom-in-95 duration-150">
            {/* Banner Gigante de Término */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-5 rounded-2xl shadow-xl space-y-1 border border-amber-300/40">
              <div className="text-[11px] uppercase font-black text-amber-100 tracking-wider flex items-center justify-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Horário de Término do Bloco
              </div>
              <div className="text-4xl font-black tracking-tight drop-shadow-sm">{modalFim}</div>
              <div className="text-xs font-bold text-amber-100 bg-black/20 rounded-lg py-1 px-3 inline-block mt-1">
                Duração total: {duracaoStrTotModal} (das {modalInicio} às {modalFim})
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 leading-snug">
                Mais de uma turma neste mesmo bloco
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                O tempo de duração informado ({modalInicio} às {modalFim}) cobre todo o horário deste
                bloco com as turmas selecionadas?
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 font-medium text-left space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-600" /> Como funciona:
              </div>
              <div className="text-amber-800 leading-snug space-y-1">
                <div>
                  • Se todas treinam juntas neste mesmo horário, clique em{" "}
                  <strong>&quot;Sim, o horário do bloco está correto&quot;</strong>.
                </div>
                <div>
                  • Se os horários forem divididos entre as turmas, clique em{" "}
                  <strong>&quot;Não, os horários são divididos&quot;</strong> para informar o início e
                  término total do bloco (ex: 08:00 às 11:00). Ambas as turmas continuarão neste mesmo bloco único.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={confirmarDuracaoConjunta}
                className="w-full py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sim, o horário do bloco está correto (término às {modalFim})</span>
              </button>
              <button
                type="button"
                onClick={recusarDuracaoConjunta}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Não, os horários são divididos (ajustar horário completo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
