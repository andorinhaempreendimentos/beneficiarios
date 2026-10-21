"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Square,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Camera,
  Upload,
  ArrowLeft,
  Calendar,
  Sparkles,
  Check,
  FileText,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  MapPin,
  Activity,
  Info,
  X,
  HelpCircle,
  Award,
} from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { getDataHojeBrasil } from "@/lib/dateUtils";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  execucoesSessaoApi,
  professoresApi,
  turmasApi,
  type TurmaApi,
  type FuncionarioApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import type { ExecucaoSessaoApi, BeneficiarioPresencaApi } from "@/lib/types/execucaoAula";
import { ModalInformacoesAula } from "./ModalInformacoesAula";

interface ExecucaoSessaoClientProps {
  turma: TurmaApi;
  beneficiarios: BeneficiarioApi[];
  beneficiariosPolo?: BeneficiarioApi[];
  funcionarios?: FuncionarioApi[];
  dataQuery: string;
  execucaoInicial: ExecucaoSessaoApi | null;
  presencasIniciais: BeneficiarioPresencaApi[];
  autoStart?: boolean;
}

export type ExecucaoAulaClientProps = ExecucaoSessaoClientProps;

const JUSTIFICATIVAS_PREDEFINIDAS = [
  "Sem internet no local",
  "Reposição de aula aprovada",
  "Chuva / Condições climáticas",
  "Problema no aparelho / sistema",
  "Atividade externa / Evento",
];

function parseHora(timeStr: string | null | undefined, fallback = "00:00"): string {
  if (!timeStr) return fallback;
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return fallback;
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return timeStr.slice(0, 5);
}

function parseHoraMinutos(timeStr: string | null | undefined): [number, number] {
  const formatado = parseHora(timeStr, "00:00");
  const [h, m] = formatado.split(":").map(Number);
  return [isNaN(h) ? 0 : h, isNaN(m) ? 0 : m];
}

function calcularIdade(dataNascStr?: string | null): number | null {
  if (!dataNascStr) return null;
  const nasc = new Date(dataNascStr);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

const DIAS_SEMANA_MAP: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

import { formatStorageUrl } from "@/lib/storage";

export function ExecucaoSessaoClient({
  turma,
  beneficiarios,
  beneficiariosPolo = [],
  funcionarios = [],
  dataQuery,
  execucaoInicial,
  presencasIniciais,
  autoStart,
}: ExecucaoSessaoClientProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const autoStartRef = useRef(autoStart);

  const [execucao, setExecucao] = useState<ExecucaoSessaoApi | null>(execucaoInicial);
  const [dataAula, setDataAula] = useState<string>(
    execucaoInicial?.data || dataQuery || getDataHojeBrasil()
  );

  // Horários e Atividade da Sessão para a data selecionada
  const slotHoje = useMemo(() => {
    if (!turma.slots || turma.slots.length === 0) return null;
    const [ano, mes, dia] = dataAula.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay(); // 0 = Domingo, 1 = Segunda...
    return (
      turma.slots.find((s: any) => s.dia_semana === diaSemana || s.dia === DIAS_SEMANA_MAP[diaSemana]?.slice(0, 3)) ||
      null
    );
  }, [turma.slots, dataAula]);

  // Termos dinâmicos baseados na atividade vinculada à sessão ou ao grupo
  const atividadeSessao = slotHoje?.atividade || turma.atividade;
  const termoGrupo = atividadeSessao?.termoGrupo || turma.atividade?.termoGrupo || "Grupo";
  const termoSessao = atividadeSessao?.termoSessao || turma.atividade?.termoSessao || "Sessão";
  const termoResponsavel = atividadeSessao?.termoResponsavel || turma.atividade?.termoResponsavel || "Responsável";
  const termoParticipante = atividadeSessao?.termoParticipante || turma.atividade?.termoParticipante || "Participante";

  // Etapas: "inicio" (Step 1) | "chamada" (Step 2) | "em_andamento" (Step 3) | "finalizacao" (Step 4) | "concluida"
  const [etapa, setEtapa] = useState<"inicio" | "chamada" | "em_andamento" | "finalizacao" | "concluida">(() => {
    if (execucaoInicial?.status === "concluida") return "concluida";
    if (execucaoInicial) return "em_andamento";
    return "inicio";
  });

  // Mapa de presenças: beneficiarioId -> { status, observacao }
  const [presencas, setPresencas] = useState<
    Record<string, { status: "presente" | "falta" | "falta_justificada"; observacao?: string }>
  >(() => {
    const map: Record<string, { status: "presente" | "falta" | "falta_justificada"; observacao?: string }> = {};
    if (presencasIniciais && presencasIniciais.length > 0) {
      for (const p of presencasIniciais) {
        map[p.beneficiarioId] = {
          status: p.status,
          observacao: p.observacao,
        };
      }
    } else {
      // Default: todos os beneficiários inicializados como 'presente' para agilizar fluxo
      for (const b of beneficiarios) {
        map[b.id] = { status: "presente" };
      }
    }
    return map;
  });

  // Base unificada de alunos do polo para a conferência
  const listaAlunosPolo = useMemo(() => {
    if (beneficiariosPolo && beneficiariosPolo.length > 0) {
      return beneficiariosPolo;
    }
    return beneficiarios;
  }, [beneficiariosPolo, beneficiarios]);

  // Alunos confirmados para esta turma (inicia vazio para conferência ativa pelo professor)
  const [selecionadosIds, setSelecionadosIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    if (execucaoInicial && presencasIniciais && presencasIniciais.length > 0) {
      for (const p of presencasIniciais) {
        ids.add(p.beneficiarioId);
      }
    }
    return ids;
  });

  // Alunos ativos nesta turma durante a execução da sessão:
  // Se a aula já foi iniciada/conferida (presencasIniciais), lista ESTRITAMENTE os alunos conferidos!
  const [beneficiariosTurma, setBeneficiariosTurma] = useState<BeneficiarioApi[]>(() => {
    const pool = (beneficiariosPolo && beneficiariosPolo.length > 0) ? beneficiariosPolo : beneficiarios;
    if (presencasIniciais && presencasIniciais.length > 0) {
      const idsPres = new Set(presencasIniciais.map((p) => p.beneficiarioId));
      const conferidos = pool.filter((b) => idsPres.has(b.id));
      if (conferidos.length > 0) return conferidos;
    }
    return beneficiarios;
  });

  // Estados de Filtro e Busca na Conferência Pré-Aula
  const [buscaConferencia, setBuscaConferencia] = useState("");
  const [filtroConferencia, setFiltroConferencia] = useState<"todos" | "confirmados" | "sem_turma">("todos");

  const toggleConfirmacaoAluno = (id: string) => {
    setSelecionadosIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Estados de Filtro e Busca na Chamada
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "presente" | "falta" | "falta_justificada">("todos");

  // Estados de Finalização (Foto e Diário)
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    execucaoInicial?.fotoComprovanteUrl ? formatStorageUrl(execucaoInicial.fotoComprovanteUrl) : null
  );
  const [dispensarFotoComprovante, setDispensarFotoComprovante] = useState(false);
  const [observacoes, setObservacoes] = useState(execucaoInicial?.observacoes || "");

  // Estados de Controle Temporal e Retroatividade
  const [justificativaRetroativa, setJustificativaRetroativa] = useState(
    execucaoInicial?.justificativaRetroativa || ""
  );
  const [showJustificativaModal, setShowJustificativaModal] = useState(false);

  // Estados de Encerramento Antecipado
  const [showEncerrarAntecipadoModal, setShowEncerrarAntecipadoModal] = useState(false);
  const [justificativaEncerramento, setJustificativaEncerramento] = useState("");

  // Estados de Carregamento
  const [salvando, setSalvando] = useState(false);
  const [salvandoPresencas, setSalvandoPresencas] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Cronômetro ao Vivo
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);

  // Hydration-safe: evita mismatch SSR vs client em cálculos com new Date()
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Referências para inputs de arquivo
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Identificação do Professor Responsável
  const professor = useMemo(() => {
    if (user) {
      const match = funcionarios.find(
        (f) =>
          f.id === user.entidadeId ||
          (f.email && user.email && f.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.refId && f.id === user.refId)
      );
      if (match) return match;
    }
    if (turma.responsaveis && turma.responsaveis.length > 0) {
      const respId = turma.responsaveis[0];
      const matchResp = funcionarios.find((f) => f.id === respId);
      if (matchResp) return matchResp;
    }
    return null;
  }, [user, funcionarios, turma]);

  const horaInicioPrevista = useMemo(() => {
    if (!slotHoje) return "08:00";
    if (slotHoje.horaInicio) return slotHoje.horaInicio.slice(0, 5);
    const ini = String(slotHoje.inicio);
    return ini.includes(":") ? ini.slice(0, 5) : `${ini.padStart(2, "0")}:00`;
  }, [slotHoje]);

  const horaFimPrevista = useMemo(() => {
    if (!slotHoje) return "10:00";
    if (slotHoje.horaFim) return slotHoje.horaFim.slice(0, 5);
    const fim = String(slotHoje.fim);
    return fim.includes(":") ? fim.slice(0, 5) : `${fim.padStart(2, "0")}:00`;
  }, [slotHoje]);

  const diaSemanaAula = useMemo(() => {
    const [ano, mes, dia] = dataAula.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaNum = dataObj.getDay();
    return DIAS_SEMANA_MAP[diaNum] || "Terça-feira";
  }, [dataAula]);

  const duracaoBlocoFormatada = useMemo(() => {
    const [h1, m1] = horaInicioPrevista.split(":").map(Number);
    const [h2, m2] = horaFimPrevista.split(":").map(Number);
    if (isNaN(h1) || isNaN(h2)) return "1h";
    let totalMin = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
    if (totalMin <= 0) totalMin += 24 * 60;
    const horas = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (horas > 0 && mins > 0) return `${horas}h${String(mins).padStart(2, "0")}`;
    if (horas > 0) return `${horas}h`;
    return `${mins} min`;
  }, [horaInicioPrevista, horaFimPrevista]);

  // Horários Efetivos (Regra de Ouro 3: Hora Real no Retroativo)
  const [horaInicioEfetiva, setHoraInicioEfetiva] = useState(horaInicioPrevista);
  const [horaFimEfetiva, setHoraFimEfetiva] = useState(horaFimPrevista);

  useEffect(() => {
    setHoraInicioEfetiva(horaInicioPrevista);
  }, [horaInicioPrevista]);

  useEffect(() => {
    setHoraFimEfetiva(horaFimPrevista);
  }, [horaFimPrevista]);

  // Verificação de Janela e Retroatividade
  const hojeStr = useMemo(() => getDataHojeBrasil(), []);
  const isDataRetroativa = dataAula < hojeStr;
  const isDataFutura = dataAula > hojeStr;

  const isForaDaJanelaHorario = useMemo(() => {
    if (isDataRetroativa || isDataFutura) return true;
    
    // Se a restrição for apenas por 'data', não checa horário do mesmo dia
    if (turma.nucleo?.tipoRestricaoChamada === "data") {
      return false;
    }

    // Se for por 'horario', verifica a janela exata
    const now = new Date();
    const [fimH, fimM] = horaFimPrevista.split(":").map(Number);
    const toleranciaMinutos = turma.nucleo?.toleranciaFimMinutos ?? 15;
    const limiteHoras = fimH + Math.floor((fimM + toleranciaMinutos) / 60);
    const limiteMinutos = (fimM + toleranciaMinutos) % 60;
    const horaAtualMinutos = now.getHours() * 60 + now.getMinutes();
    const limiteMinutosTotal = limiteHoras * 60 + limiteMinutos;
    return horaAtualMinutos > limiteMinutosTotal;
  }, [dataAula, isDataRetroativa, isDataFutura, horaFimPrevista, turma.nucleo, segundosDecorridos]);

  // Verificar se é cedo demais para iniciar
  const isAntesDaJanela = useMemo(() => {
    if (isDataRetroativa || isDataFutura) return false;
    if (turma.nucleo?.tipoRestricaoChamada === "data") return false;

    const now = new Date();
    const [iniH, iniM] = horaInicioPrevista.split(":").map(Number);
    const toleranciaMinutos = turma.nucleo?.toleranciaInicioMinutos ?? 15;
    const inicioPermitidoMinutos = (iniH * 60 + iniM) - toleranciaMinutos;
    const horaAtualMinutos = now.getHours() * 60 + now.getMinutes();
    return horaAtualMinutos < inicioPermitidoMinutos;
  }, [dataAula, isDataRetroativa, isDataFutura, horaInicioPrevista, turma.nucleo, segundosDecorridos]);

  const isForaDoHorarioRegular = mounted ? (isDataRetroativa || isForaDaJanelaHorario) : false;
  const isModoRegularizacao = Boolean(
    isForaDoHorarioRegular ||
    isDataRetroativa ||
    execucao?.justificativaRetroativa ||
    execucao?.statusAprovacao === "pendente_aprovacao"
  );
  const dispensaFoto = beneficiariosTurma.length === 0 && isModoRegularizacao;

  // Alunos do polo filtrados para a conferência pré-aula
  const alunosConferenciaFiltrados = useMemo(() => {
    const termo = buscaConferencia.toLowerCase().trim();
    return listaAlunosPolo.filter((b) => {
      const matchBusca =
        !termo ||
        b.nomeCompleto.toLowerCase().includes(termo) ||
        b.matricula.toLowerCase().includes(termo);
      if (!matchBusca) return false;

      const isSel = selecionadosIds.has(b.id);
      if (filtroConferencia === "confirmados") return isSel;
      if (filtroConferencia === "sem_turma") return !isSel;
      return true;
    }).sort((a, b) => {
      const aSel = selecionadosIds.has(a.id);
      const bSel = selecionadosIds.has(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR");
    });
  }, [listaAlunosPolo, buscaConferencia, filtroConferencia, selecionadosIds]);

  const saldoSemTurmaConferencia = useMemo(() => {
    return listaAlunosPolo.filter((b) => !selecionadosIds.has(b.id)).length;
  }, [listaAlunosPolo, selecionadosIds]);

  // Atualização do Cronômetro ao Vivo quando a aula estiver em andamento
  useEffect(() => {
    if (etapa === "concluida" || !execucao?.horaInicioReal) return;

    function calcularSegundos() {
      let inicio = new Date();
      if (execucao?.horaInicioReal?.includes("T")) {
        inicio = new Date(execucao.horaInicioReal);
      } else {
        const [hIni, mIni] = parseHoraMinutos(execucao?.horaInicioReal);
        inicio.setHours(hIni, mIni, 0, 0);
      }
      const agora = new Date();

      const diff = Math.max(0, Math.floor((agora.getTime() - inicio.getTime()) / 1000));
      setSegundosDecorridos(diff);
    }

    calcularSegundos();
    const timer = setInterval(calcularSegundos, 1000);
    return () => clearInterval(timer);
  }, [execucao?.horaInicioReal, etapa]);

  // Formatação de Tempo Decorrido (HH:MM:SS)
  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Contadores de Presença
  const contadores = useMemo(() => {
    let presentes = 0;
    let faltas = 0;
    let justificadas = 0;

    for (const b of beneficiariosTurma) {
      const item = presencas[b.id];
      const st = item?.status || "presente";
      if (st === "presente") presentes++;
      else if (st === "falta") faltas++;
      else if (st === "falta_justificada") justificadas++;
    }

    return {
      total: beneficiariosTurma.length,
      presentes,
      faltas,
      justificadas,
      taxaPresenca: beneficiariosTurma.length > 0 ? Math.round((presentes / beneficiariosTurma.length) * 100) : 0,
    };
  }, [beneficiariosTurma, presencas]);

  // Beneficiários filtrados para a listagem
  const beneficiariosFiltrados = useMemo(() => {
    return beneficiariosTurma.filter((b) => {
      const matchBusca =
        !busca ||
        b.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
        b.matricula.toLowerCase().includes(busca.toLowerCase());

      const statusAtual = presencas[b.id]?.status || "presente";
      const matchStatus = filtroStatus === "todos" || statusAtual === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [beneficiariosTurma, busca, filtroStatus, presencas]);

  // Alterar presença de um beneficiário individual
  const handleTogglePresenca = (
    beneficiarioId: string,
    novoStatus: "presente" | "falta" | "falta_justificada"
  ) => {
    setPresencas((prev) => ({
      ...prev,
      [beneficiarioId]: {
        ...prev[beneficiarioId],
        status: novoStatus,
      },
    }));
  };

  // Alterar observação/motivo de falta justificada
  const handleObservacaoBeneficiario = (beneficiarioId: string, obs: string) => {
    setPresencas((prev) => ({
      ...prev,
      [beneficiarioId]: {
        ...prev[beneficiarioId],
        status: prev[beneficiarioId]?.status || "falta_justificada",
        observacao: obs,
      },
    }));
  };

  // Marcar todos com um status específico (Bulk Action)
  const handleMarcarTodos = (status: "presente" | "falta") => {
    const nextMap: Record<string, { status: "presente" | "falta" | "falta_justificada"; observacao?: string }> = {};
    for (const b of beneficiariosTurma) {
      nextMap[b.id] = {
        ...presencas[b.id],
        status,
      };
    }
    setPresencas(nextMap);
    toast.success(
      status === "presente"
        ? "Todos os beneficiários marcados como Presentes!"
        : "Todos os beneficiários marcados com Falta!"
    );
  };

  // STEP 1: Iniciar Aula (Play) após Conferência Obrigatória
  const handleIniciarAula = async () => {
    const isPlanejamento = turma.tipo === "operacional" || turma.nome?.toLowerCase().includes("planejamento");
    if (selecionadosIds.size === 0 && !isPlanejamento && !isModoRegularizacao) {
      toast.error(`Selecione ao menos 1 ${termoParticipante.toLowerCase()} presente nesta turma para iniciar.`);
      return;
    }
    if (isDataFutura) {
      toast.error("Não é possível iniciar uma aula em data futura.");
      return;
    }
    if (isAntesDaJanela) {
      const [iniH, iniM] = horaInicioPrevista.split(":").map(Number);
      const tol = turma.nucleo?.toleranciaInicioMinutos ?? 15;
      const min = (iniH * 60 + iniM) - tol;
      const hStr = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      toast.error(`Ainda não está no horário. Você poderá iniciar a partir das ${hStr}.`);
      return;
    }
    if (isDataRetroativa) {
      const diasLimite = turma.nucleo?.diasLimiteRetroativo ?? 7;
      const limite = new Date();
      limite.setDate(limite.getDate() - diasLimite);
      const limiteStr = limite.toISOString().slice(0, 10);
      if (dataAula < limiteStr) {
        toast.error(`Prazo de retroatividade expirado. Limite configurado: ${diasLimite} dia(s).`);
        return;
      }
    }
    if (isForaDoHorarioRegular) {
      if (!turma.nucleo?.permitirChamadaRetroativa) {
        toast.error("Lançamento bloqueado. Este polo não permite iniciar aulas fora da janela de horário ou em dias passados.");
        return;
      }
      if (!justificativaRetroativa.trim()) {
        setShowJustificativaModal(true);
        return;
      }
    }

    setSalvando(true);
    try {
      const professorId = professor?.id || turma.responsaveis?.[0] || "";
      if (!professorId) {
        throw new Error("Professor responsável não identificado para esta turma.");
      }

      // 1. Sincroniza a enturmação dos selecionados no banco
      const confirmadosIdsArray = Array.from(selecionadosIds);
      if (confirmadosIdsArray.length > 0) {
        await turmasApi.sincronizarConferenciaEnturmacao(turma.id, confirmadosIdsArray);
      }

      const atividadeId = slotHoje?.atividadeId || turma.atividadeId || turma.atividade?.id;

      // 2. Registra início da sessão
      const novaExecucao = await execucoesSessaoApi.iniciarSessao({
        turmaId: turma.id,
        nucleoId: slotHoje?.nucleoId || turma.nucleoId || turma.nucleo?.id,
        sessaoId: slotHoje?.id,
        professorId,
        data: dataAula,
        horaInicioPrevista,
        horaFimPrevista,
        horaInicioReal: isForaDoHorarioRegular ? horaInicioEfetiva : undefined,
        atividadeId,
        justificativaRetroativa: isForaDoHorarioRegular ? justificativaRetroativa.trim() : undefined,
      });

      setExecucao(novaExecucao);

      // 3. Atualiza a lista de alunos da turma com os confirmados
      const alunosConfirmadosObjetos = listaAlunosPolo.filter((b) => selecionadosIds.has(b.id));
      setBeneficiariosTurma(alunosConfirmadosObjetos);

      // 4. Salva a lista de presenças inicial no banco para os alunos confirmados
      const listaPresencasParaSalvar = alunosConfirmadosObjetos.map((b) => ({
        beneficiarioId: b.id,
        status: presencas[b.id]?.status || ("presente" as const),
        observacao: presencas[b.id]?.observacao,
      }));

      if (listaPresencasParaSalvar.length > 0) {
        await execucoesSessaoApi.salvarPresencas(novaExecucao.id, listaPresencasParaSalvar);
      }

      // 5. Atualiza o mapa de presenças local
      const nextMap = { ...presencas };
      for (const b of alunosConfirmadosObjetos) {
        if (!nextMap[b.id]) {
          nextMap[b.id] = { status: "presente" };
        }
      }
      setPresencas(nextMap);

      setShowJustificativaModal(false);
      if (alunosConfirmadosObjetos.length === 0 && isModoRegularizacao) {
        setEtapa("finalizacao");
      } else {
        setEtapa("chamada");
      }
      toast.success(`▶ ${termoSessao} iniciado(a) com sucesso! ${confirmadosIdsArray.length} ${termoParticipante.toLowerCase()}s confirmados.`);
    } catch (err: any) {
      toast.error(`Erro ao iniciar aula: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    if (autoStartRef.current && etapa === "inicio" && !execucao && !salvando) {
      autoStartRef.current = false; // Garante que rode apenas uma vez
      handleIniciarAula();
    }
  }, [etapa, execucao, salvando]);

  useEffect(() => {
    if (execucaoInicial) {
      setExecucao(execucaoInicial);
      if (execucaoInicial.status === "concluida") {
        setEtapa("concluida");
      } else {
        setEtapa((prev) => (prev === "inicio" ? "em_andamento" : prev));
      }
      if (presencasIniciais && presencasIniciais.length > 0) {
        const idsPres = new Set(presencasIniciais.map((p) => p.beneficiarioId));
        const pool = (beneficiariosPolo && beneficiariosPolo.length > 0) ? beneficiariosPolo : beneficiarios;
        const confirmados = pool.filter((b) => idsPres.has(b.id));
        if (confirmados.length > 0) {
          setBeneficiariosTurma(confirmados);
        }
      }
      if (execucaoInicial.fotoComprovanteUrl) {
        setFotoPreview(formatStorageUrl(execucaoInicial.fotoComprovanteUrl));
      }
      if (execucaoInicial.observacoes) {
        setObservacoes(execucaoInicial.observacoes);
      }
    }
  }, [execucaoInicial, presencasIniciais, beneficiariosPolo, beneficiarios]);

  // Salvar rascunho de presenças
  const handleSalvarRascunhoPresencas = async () => {
    if (!execucao) return;
    setSalvandoPresencas(true);
    try {
      const lista = beneficiariosTurma.map((b) => ({
        beneficiarioId: b.id,
        status: presencas[b.id]?.status || ("presente" as const),
        observacao: presencas[b.id]?.observacao,
      }));

      await execucoesSessaoApi.salvarPresencas(execucao.id, lista);
      toast.success("Presenças atualizadas com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao salvar presenças: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvandoPresencas(false);
    }
  };

  // Upload de Foto Comprobatória
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const url = URL.createObjectURL(file);
      setFotoPreview(url);
    }
  };

  // Verificar se está antes do horário previsto de fim
  const isAntesDoFimPrevisto = useMemo(() => {
    if (isDataRetroativa || isModoRegularizacao) return false;
    if (!horaFimPrevista) return false;
    const now = new Date();
    const [fH, fM] = horaFimPrevista.split(":").map(Number);
    const fimPrevisto = new Date();
    fimPrevisto.setHours(fH, fM, 0, 0);
    return now < fimPrevisto;
  }, [horaFimPrevista, segundosDecorridos, isDataRetroativa, isModoRegularizacao]);

  const minutosRestantes = useMemo(() => {
    if (!horaFimPrevista) return 0;
    const now = new Date();
    const [fH, fM] = horaFimPrevista.split(":").map(Number);
    const fimPrevisto = new Date();
    fimPrevisto.setHours(fH, fM, 0, 0);
    return Math.max(0, Math.ceil((fimPrevisto.getTime() - now.getTime()) / 60000));
  }, [horaFimPrevista, segundosDecorridos]);

  // STEP 3: Encerrar Aula (Stop)
  const handleEncerrarAula = async () => {
    if (!execucao) {
      toast.error("Nenhuma execução de aula ativa.");
      return;
    }

    if (!dispensaFoto && !dispensarFotoComprovante && !fotoFile && !fotoPreview) {
      toast.error("A foto comprobatória é obrigatória, ou marque a declaração de ciência para prosseguir sem foto.");
      return;
    }

    // Se antes do horário previsto e ainda não justificou, mostrar modal
    if (isAntesDoFimPrevisto && !justificativaEncerramento.trim()) {
      setShowEncerrarAntecipadoModal(true);
      return;
    }

    setSalvando(true);
    try {
      let finalFotoUrl = execucao.fotoComprovanteUrl || "";

      // Se houver novo arquivo selecionado, faz o upload para o storage Supabase
      if (fotoFile) {
        setUploadingFoto(true);
        finalFotoUrl = await professoresApi.uploadComprovacao(fotoFile, fotoFile.name);
        setUploadingFoto(false);
      }

      // Salva as presenças finais
      const lista = beneficiariosTurma.map((b) => ({
        beneficiarioId: b.id,
        status: presencas[b.id]?.status || ("presente" as const),
        observacao: presencas[b.id]?.observacao,
      }));
      await execucoesSessaoApi.salvarPresencas(execucao.id, lista);

      // Montar observações com identificação de regularização, dispensa de foto ou encerramento antecipado
      let obsFinais = observacoes.trim();
      if (dispensarFotoComprovante && !fotoFile && !fotoPreview) {
        const carimboSemFoto = "[AULA FINALIZADA SEM FOTO COMPROBATÓRIA - Professor declarou ciente de que a ausência do registro fotográfico pode impactar o processo de supervisão e homologação]";
        obsFinais = obsFinais ? `${carimboSemFoto}\n\n${obsFinais}` : carimboSemFoto;
      }
      if (isModoRegularizacao) {
        const motivo = justificativaRetroativa.trim() || execucao.justificativaRetroativa || "Regularização de aula anterior/offline";
        const agoraStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const carimboSemAlunos = dispensaFoto ? "\n[TURMA SEM BENEFICIÁRIOS MATRICULADOS NA DATA - DISPENSA DE FOTO]" : "";
        const carimbo = `[AULA REGULARIZADA - PENDENTE DE HOMOLOGAÇÃO]${carimboSemAlunos}\nRegistrada em ${agoraStr} por ${professor?.nomeCompleto || "Professor"}.\nMotivo: ${motivo}`;
        obsFinais = obsFinais ? `${carimbo}\n\n${obsFinais}` : carimbo;
      } else if (justificativaEncerramento.trim()) {
        const prefixo = `[ENCERRAMENTO ANTECIPADO - ${minutosRestantes}min antes] ${justificativaEncerramento.trim()}`;
        obsFinais = obsFinais ? `${prefixo}\n\n${obsFinais}` : prefixo;
      }

      // Finaliza a aula e registra ponto de saída
      const aulaConcluida = await execucoesSessaoApi.finalizarSessao(execucao.id, {
        fotoComprovanteUrl: finalFotoUrl || undefined,
        observacoes: obsFinais || undefined,
        horaFimReal: isModoRegularizacao ? horaFimEfetiva : undefined,
      });

      setExecucao(aulaConcluida);
      setEtapa("concluida");
      setShowEncerrarAntecipadoModal(false);
      toast.success(`⏹ ${termoSessao} finalizado(a) com sucesso! Ponto de saída e relatório registrados.`);
    } catch (err: any) {
      toast.error(`Erro ao finalizar ${termoSessao.toLowerCase()}: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvando(false);
      setUploadingFoto(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto py-2 px-3 sm:px-4" suppressHydrationWarning>
      {/* NAVEGAÇÃO SUPERIOR & TÍTULO */}
      <div className="flex items-center justify-between">
        <Link
          href="/professor"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>

        <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Calendar className="h-3 w-3 text-zinc-400" />
          {dataAula.split("-").reverse().join("/")}
        </span>
      </div>

      {/* CARD DO CABEÇALHO DA TURMA */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-5 shadow-lg border border-zinc-700/50">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="bg-sky-500/20 text-sky-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-sky-400/30">
            {turma.atividade?.nome || "Atividade"}
          </span>
          <span className="bg-zinc-700/50 text-zinc-300 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin className="h-3 w-3 text-zinc-400" />
            {turma.nucleo?.identificacao || "Núcleo"}
          </span>
          {isModoRegularizacao && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              Modo Regularização
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight">{turma.nome}</h1>

        <div className="mt-4 pt-3 border-t border-zinc-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horário Previsto</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              {horaInicioPrevista} às {horaFimPrevista}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">{termoResponsavel}</span>
            <span className="font-semibold text-white truncate block mt-0.5">
              {professor?.nomeCompleto || turma.responsaveisNomes?.[0] || "Instrutor"}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">{termoParticipante}s na Turma</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              {etapa === "inicio" ? `${selecionadosIds.size} selecionados` : `${beneficiariosTurma.length} ${termoParticipante}s`}
            </span>
          </div>
        </div>
      </div>

      {/* BANNER INFORMATIVO SE MODO REGULARIZAÇÃO */}
      {isModoRegularizacao && etapa !== "concluida" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <div className="h-8 w-8 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <strong className="font-bold block text-sm text-amber-950">{termoSessao} em Modo Regularização</strong>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Este(a) {termoSessao.toLowerCase()} está sendo registrado(a) retroativamente. Você pode preencher as presenças, anexar a foto comprobatória e concluir o registro a qualquer momento. O lançamento será enviado para homologação do Coordenador.
            </p>
          </div>
        </div>
      )}

      {/* STEPPER PROGRESS BAR (3 ETAPAS ATÔMICAS) */}
      {/* STEPPER DE 4 ETAPAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
        <button
          type="button"
          onClick={() => {
            if (execucao) setEtapa("inicio");
          }}
          disabled={!execucao}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            etapa === "inicio"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
              : execucao
              ? "text-zinc-600 hover:text-zinc-900"
              : "text-zinc-400 opacity-60 cursor-not-allowed"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
              execucao ? "bg-emerald-500 text-white" : "bg-zinc-300 text-zinc-700"
            }`}
          >
            1
          </span>
          <span className="truncate">Início</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (execucao) setEtapa("chamada");
          }}
          disabled={!execucao}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            etapa === "chamada"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
              : execucao
              ? "text-zinc-600 hover:text-zinc-900"
              : "text-zinc-400 opacity-60 cursor-not-allowed"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
              etapa === "em_andamento" || etapa === "finalizacao" || etapa === "concluida"
                ? "bg-emerald-500 text-white"
                : etapa === "chamada"
                ? "bg-sky-600 text-white"
                : "bg-zinc-300 text-zinc-700"
            }`}
          >
            2
          </span>
          <span className="truncate">Chamada</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (execucao) setEtapa("em_andamento");
          }}
          disabled={!execucao}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            etapa === "em_andamento"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
              : execucao
              ? "text-zinc-600 hover:text-zinc-900"
              : "text-zinc-400 opacity-60 cursor-not-allowed"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
              etapa === "finalizacao" || etapa === "concluida"
                ? "bg-emerald-500 text-white"
                : etapa === "em_andamento"
                ? "bg-sky-600 text-white"
                : "bg-zinc-300 text-zinc-700"
            }`}
          >
            3
          </span>
          <span className="truncate">Em Andamento</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (execucao) setEtapa("finalizacao");
          }}
          disabled={!execucao}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            etapa === "finalizacao" || etapa === "concluida"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
              : "text-zinc-400 opacity-60 cursor-not-allowed"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
              etapa === "concluida"
                ? "bg-emerald-500 text-white"
                : etapa === "finalizacao"
                ? "bg-sky-600 text-white"
                : "bg-zinc-300 text-zinc-700"
            }`}
          >
            4
          </span>
          <span className="truncate">Foto & Stop</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ETAPA 1: CONFERÊNCIA OBRIGATÓRIA DE ALUNOS & INÍCIO DE AULA (PLAY) */}
      {/* ========================================================================= */}
      {etapa === "inicio" && (
        <Card className="p-0 flex flex-col border border-amber-200/90 shadow-md overflow-hidden bg-white">
          {/* HEADER COM FUNDO ÂMBAR/CREME DESTACADO */}
          <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-orange-50/40 border-b border-amber-200/80 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-amber-200/70 text-amber-900 border border-amber-300/60">
                    Etapa 1 • Pré-Treino
                  </span>
                  <span className="text-xs font-semibold text-amber-800/80">Conferência de {termoParticipante}s do Polo</span>
                </div>

                {/* LINHA GRANDE: TURMA QUE TREINA + DIA DA SEMANA */}
                <div className="flex flex-wrap items-baseline gap-2.5 pt-0.5">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                    TURMA QUE TREINA
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
                    📅 {diaSemanaAula}
                  </span>
                </div>

                {/* LINHA GRANDE: HORÁRIO + DURAÇÃO */}
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <span className="text-base sm:text-lg font-extrabold text-amber-900 flex items-center gap-1.5">
                    🕒 {horaInicioPrevista} às {horaFimPrevista}
                  </span>
                  <span className="text-xs font-extrabold bg-white border border-amber-300 text-amber-900 px-2.5 py-0.5 rounded-md shadow-2xs">
                    Duração: {duracaoBlocoFormatada}
                  </span>
                </div>
              </div>

              {/* BADGE DE CONFIRMADOS */}
              <div className="self-start sm:self-center shrink-0">
                <div className="px-4 py-2 rounded-xl bg-white border-2 border-emerald-500/80 text-emerald-800 text-xs font-black shadow-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-base font-black text-emerald-700">{selecionadosIds.size}</span>
                  <span>confirmados</span>
                </div>
              </div>
            </div>
          </div>

          {/* CORPO DO CARD */}
          <div className="p-4 sm:p-6 flex flex-col gap-5">

          {/* PAINEL DE CONTROLE DE ACÚMULO / TABS */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <button
              type="button"
              onClick={() => setFiltroConferencia("todos")}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                filtroConferencia === "todos"
                  ? "border-2 border-zinc-800 bg-zinc-50 shadow-xs"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-zinc-500">Total no Polo</div>
              <div className="text-base sm:text-lg font-black text-zinc-900">{listaAlunosPolo.length}</div>
            </button>

            <button
              type="button"
              onClick={() => setFiltroConferencia("confirmados")}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                filtroConferencia === "confirmados"
                  ? "border-2 border-emerald-600 bg-emerald-50 shadow-xs"
                  : "border-zinc-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-700">Nesta Turma</div>
              <div className="text-base sm:text-lg font-black text-emerald-700">{selecionadosIds.size}</div>
            </button>

            <button
              type="button"
              onClick={() => setFiltroConferencia("sem_turma")}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                filtroConferencia === "sem_turma"
                  ? "border-2 border-amber-600 bg-amber-50 shadow-xs"
                  : "border-zinc-200 bg-white hover:border-amber-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-amber-700">Sem Turma</div>
              <div className="text-base sm:text-lg font-black text-amber-700">{saldoSemTurmaConferencia}</div>
            </button>
          </div>

          {/* BUSCA RÁPIDA DE ALUNO */}
          <div className="relative">
            <input
              type="text"
              value={buscaConferencia}
              onChange={(e) => setBuscaConferencia(e.target.value)}
              placeholder={`Buscar ${termoParticipante.toLowerCase()} por nome ou matrícula no polo...`}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            <span className="absolute left-3 top-2.5 text-xs text-zinc-400">🔍</span>
            {buscaConferencia && (
              <button
                type="button"
                onClick={() => setBuscaConferencia("")}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* LISTA ROLÁVEL DE ALUNOS COM CONDIÇÃO E BOTÃO DE CONFIRMAÇÃO */}
          <div className="space-y-2 max-h-84 overflow-y-auto pr-1">
            {alunosConferenciaFiltrados.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                Nenhum {termoParticipante.toLowerCase()} encontrado para este filtro.
              </div>
            ) : (
              alunosConferenciaFiltrados.map((b) => {
                const isSel = selecionadosIds.has(b.id);
                const idade = calcularIdade(b.dataNascimento);

                const btnClass = isSel
                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                  : "border border-zinc-300 bg-white text-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-semibold";

                const btnText = isSel ? "✓ Confirmado" : "+ É da Turma";

                return (
                  <div
                    key={b.id}
                    onClick={() => toggleConfirmacaoAluno(b.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSel
                        ? "border-emerald-500 bg-emerald-50/70"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    {/* DADOS DO ALUNO */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSel
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                        }`}
                      >
                        {isSel ? "✓" : b.nomeCompleto.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                            {b.nomeCompleto}
                          </span>
                          {isSel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                              Presente
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {idade != null ? `${idade} anos` : "Idade não informada"} • Matrícula: {b.matricula}
                        </div>
                      </div>
                    </div>

                    {/* BOTÃO DIRETO DE CONFIRMAÇÃO */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleConfirmacaoAluno(b.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs transition shrink-0 ${btnClass}`}
                    >
                      {btnText}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* BARRA DE RESUMO ANTES DE INICIAR */}
          <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>
                <strong className="text-zinc-900">{selecionadosIds.size}</strong> confirmados para iniciar agora
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>
                <strong className="text-zinc-900">{saldoSemTurmaConferencia}</strong> sem turma
              </span>
            </div>
          </div>

          {/* ALERTA DE DATA FUTURA — BLOQUEIO RÍGIDO */}
          {isDataFutura && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>{termoSessao} Futuro(a) — Início Bloqueado</span>
              </div>
              <p className="text-red-800">
                Não é possível iniciar um(a) {termoSessao.toLowerCase()} em data futura. Volte no dia previsto para iniciá-lo(a).
              </p>
            </div>
          )}

          {/* ALERTA DE NÚCLEO DESATIVADO — BLOQUEIO RÍGIDO */}
          {turma.nucleo?.emFuncionamento === false && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-900 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>Núcleo / Unidade Desativada</span>
              </div>
              <p className="text-red-800">
                O funcionamento deste núcleo encontra-se temporariamente suspenso. Não é possível iniciar ou registrar {termoSessao.toLowerCase()}s nesta unidade.
              </p>
            </div>
          )}

          {/* ALERTA DE HORÁRIO ANTECIPADO — BLOQUEIO RÍGIDO */}
          {!isDataFutura && isAntesDaJanela && turma.nucleo?.emFuncionamento !== false && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>Fora do Horário — Cedo Demais</span>
              </div>
              <p className="text-red-800">
                O(A) {termoSessao.toLowerCase()} está previsto(a) para {horaInicioPrevista}. Aguarde o horário permitido (tolerância de {turma.nucleo?.toleranciaInicioMinutos ?? 15} min antes).
              </p>
            </div>
          )}

          {/* ALERTA DE TOLERÂNCIA / RETROATIVIDADE */}
          {isForaDoHorarioRegular && !isDataFutura && !isAntesDaJanela && turma.nucleo?.emFuncionamento !== false && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>{termoSessao} Fora da Janela Regular ou Retroativo(a)</span>
              </div>
              <p className="text-amber-800">
                Este(a) {termoSessao.toLowerCase()} está sendo iniciado(a) fora da tolerância regular do horário previsto ({horaInicioPrevista} às{" "}
                {horaFimPrevista}). O registro ficará <strong>Pendente de Aprovação</strong> do Coordenador do Núcleo.
              </p>
              <div className="grid grid-cols-2 gap-2 my-1 p-2.5 bg-amber-100/60 rounded-lg border border-amber-300">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-amber-950 mb-0.5">
                    Horário Real Início:
                  </label>
                  <input
                    type="time"
                    value={horaInicioEfetiva}
                    onChange={(e) => setHoraInicioEfetiva(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-md border border-amber-400 bg-white font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-amber-950 mb-0.5">
                    Horário Real Término:
                  </label>
                  <input
                    type="time"
                    value={horaFimEfetiva}
                    onChange={(e) => setHoraFimEfetiva(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-md border border-amber-400 bg-white font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="mt-1">
                <label className="block text-[11px] font-bold uppercase text-amber-900 mb-1">
                  Justificativa Obrigatória do Atraso:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {JUSTIFICATIVAS_PREDEFINIDAS.map((motivo) => {
                    const isSelected = justificativaRetroativa === motivo;
                    return (
                      <button
                        key={motivo}
                        type="button"
                        onClick={() => setJustificativaRetroativa(isSelected ? "" : motivo)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all text-left font-medium cursor-pointer ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-white hover:bg-amber-50 text-amber-900 border-amber-300"
                        }`}
                      >
                        {motivo}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={justificativaRetroativa}
                  onChange={(e) => setJustificativaRetroativa(e.target.value)}
                  placeholder="Ex: Treino iniciado com atraso devido à chuva / Falta de sinal de internet no local."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* BOTÃO DE CONFIRMAR E INICIAR AULA (PLAY) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleIniciarAula}
              disabled={salvando || selecionadosIds.size === 0 || isDataFutura || isAntesDaJanela || turma.nucleo?.emFuncionamento === false}
              className={`w-full font-extrabold py-4 rounded-xl text-sm sm:text-base shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                salvando || selecionadosIds.size === 0 || isDataFutura || isAntesDaJanela || turma.nucleo?.emFuncionamento === false
                  ? "bg-zinc-400 text-zinc-200 shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-600/20"
              }`}
            >
              {salvando ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Play className="h-5 w-5 fill-white" />
                  <span>
                    {selecionadosIds.size === 0
                      ? `Selecione ao menos 1 ${termoParticipante.toLowerCase()} para iniciar`
                      : `Iniciar Aula e Ir para Chamada (${selecionadosIds.size} ${termoParticipante.toLowerCase()}s) →`}
                  </span>
                </>
              )}
            </button>

            {/* SELETOR ALTERNATIVO DE DATA */}
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-500">
              <span>Data da sessão:</span>
              <input
                type="date"
                value={dataAula}
                max={hojeStr}
                onChange={(e) => setDataAula(e.target.value)}
                className="font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          </div>

        </Card>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2: CHAMADA VIVA (PRESENÇA DINÂMICA) */}
      {/* ========================================================================= */}
      {etapa === "chamada" && (
        <div className="flex flex-col gap-4">
          {/* HEADER DA CHAMADA: LIMPO, FOCADO E SEM CRONÔMETRO DISPUTANDO ESPAÇO */}
          <div className="rounded-2xl bg-white p-4 border border-zinc-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-sky-600 tracking-wider bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  Etapa 2 • Chamada Oficial
                </span>
                <span className="text-xs text-zinc-400 font-medium">Turma: {turma.nome}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 mt-1">
                Lista de Presença dos {termoParticipante}s
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Marque quem compareceu antes de dar início às atividades práticas em campo.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await handleSalvarRascunhoPresencas();
                  setEtapa("em_andamento");
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>Concluir Chamada e Iniciar Treino</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* RESUMO DOS CONTADORES */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFiltroStatus(filtroStatus === "presente" ? "todos" : "presente")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                filtroStatus === "presente"
                  ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Presentes</span>
              <span className="text-lg font-black text-emerald-600">{contadores.presentes}</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroStatus(filtroStatus === "falta" ? "todos" : "falta")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                filtroStatus === "falta"
                  ? "bg-rose-50 border-rose-300 shadow-sm"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Faltas</span>
              <span className="text-lg font-black text-rose-600">{contadores.faltas}</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroStatus(filtroStatus === "falta_justificada" ? "todos" : "falta_justificada")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                filtroStatus === "falta_justificada"
                  ? "bg-amber-50 border-amber-300 shadow-sm"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Justificadas</span>
              <span className="text-lg font-black text-amber-600">{contadores.justificadas}</span>
            </button>
          </div>

          {/* BARRA DE AÇÕES RÁPIDAS & BUSCA */}
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <input
                type="text"
                placeholder={`Buscar ${termoParticipante.toLowerCase()} por nome ou matrícula…`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:border-sky-500 w-full"
              />

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleMarcarTodos("presente")}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={() => handleMarcarTodos("falta")}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Todos Faltaram
                </button>
              </div>
            </div>

            {/* LISTA DE BENEFICIÁRIOS */}
            <div className="divide-y divide-zinc-100 mt-2">
              {beneficiariosTurma.length === 0 ? (
                <div className="py-8 text-center text-xs flex flex-col items-center gap-3 bg-amber-50/60 rounded-2xl border border-amber-200 p-6">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <div className="max-w-md">
                    <h4 className="font-bold text-sm text-amber-950">{termoGrupo} sem {termoParticipante.toLowerCase()}s matriculados</h4>
                    <p className="text-amber-800 mt-1 leading-relaxed">
                      Este(a) {termoGrupo.toLowerCase()} não possuía {termoParticipante.toLowerCase()}s matriculados nesta data. Você pode prosseguir direto para o fechamento da regularização sem necessidade de registrar chamada.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEtapa("finalizacao")}
                    className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>Prosseguir para Concluir Regularização</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : beneficiariosFiltrados.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-zinc-300" />
                  <span>Nenhum {termoParticipante.toLowerCase()} encontrado com os filtros atuais.</span>
                </div>
              ) : (
                beneficiariosFiltrados.map((b) => {
                  const presencaItem = presencas[b.id];
                  const status = presencaItem?.status || "presente";

                  const min = turma.idadeMinima ?? turma.faixaEtaria?.idadeMinima ?? turma.categoria?.idadeMinima;
                  const max = turma.idadeMaxima ?? turma.faixaEtaria?.idadeMaxima ?? turma.categoria?.idadeMaxima;
                  const idade = calcularIdade(b.dataNascimento);
                  const isAdaptado = Boolean(
                    idade !== null &&
                    min != null &&
                    max != null &&
                    (idade < min || idade > max)
                  );

                  return (
                    <div key={b.id} className="py-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{b.nomeCompleto}</h4>
                            {isAdaptado && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Adaptado - {idade} anos
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400 block">{b.matricula}</span>
                        </div>

                        {/* TOGGLE 3 ESTADOS */}
                        <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                          <button
                            type="button"
                            onClick={() => handleTogglePresenca(b.id, "presente")}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              status === "presente"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-800"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              <span className="hidden sm:inline">{termoParticipante} Presente</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePresenca(b.id, "falta")}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              status === "falta"
                                ? "bg-rose-500 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-800"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <UserX className="h-3 w-3" />
                              <span className="hidden sm:inline">Falta</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePresenca(b.id, "falta_justificada")}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              status === "falta_justificada"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-800"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <HelpCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">Justificada</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* CAMPO DE JUSTIFICATIVA INDIVIDUAL SE SELECIONADO */}
                      {status === "falta_justificada" && (
                        <div className="pl-2 border-l-2 border-amber-400 mt-1">
                          <input
                            type="text"
                            placeholder="Motivo da falta justificada (ex: Atestado médico, viagem)..."
                            value={presencaItem?.observacao || ""}
                            onChange={(e) => handleObservacaoBeneficiario(b.id, e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-amber-50/50 border border-amber-200 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* BOTÕES DE AÇÃO INFERIORES */}
            <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleSalvarRascunhoPresencas}
                disabled={salvandoPresencas}
                className="w-full sm:w-auto text-xs"
              >
                {salvandoPresencas ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1 text-emerald-600" />
                )}
                Salvar Rascunho
              </Button>

              <button
                type="button"
                onClick={async () => {
                  await handleSalvarRascunhoPresencas();
                  setEtapa("em_andamento");
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black px-6 py-3 rounded-xl text-xs shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Salvar Presenças e Iniciar Execução da Aula</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3: AULA EM ANDAMENTO (CRONÔMETRO GIGANTE & EXECUÇÃO DO TREINO) */}
      {/* ========================================================================= */}
      {etapa === "em_andamento" && (
        <div className="flex flex-col gap-5">
          {/* HERO CARD COM O RELÓGIO GIGANTE, NÍTIDO E EM DESTAQUE */}
          <div className="rounded-3xl bg-gradient-to-br from-[#091e3a] via-[#0d2f59] to-[#151933] p-6 sm:p-8 text-white shadow-2xl border border-sky-800/50 flex flex-col items-center text-center gap-6 relative overflow-hidden">
            {/* Ambient glows decorativos */}
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Badge de Status Ativo Pulsante */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 border border-emerald-400/40 text-emerald-300 text-xs font-black tracking-wider uppercase shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span>{termoSessao} em Andamento Oficial</span>
            </div>

            {/* Relógio Grande e Nítido */}
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-sky-200/80">
                Tempo Decorrido de Treino
              </span>
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-wider text-sky-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.45)] my-2">
                {formatTimer(segundosDecorridos)}
              </div>
            </div>

            {/* Metadados da Aula */}
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs text-sky-100">
              <div className="bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 font-medium">
                Início Real: <strong className="text-white font-bold">{parseHora(execucao?.horaInicioReal, horaInicioPrevista)}</strong>
              </div>
              <div className="bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 font-medium">
                Término Previsto: <strong className="text-white font-bold">{horaFimPrevista}</strong>
              </div>
              <div className="bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 font-medium">
                Duração: <strong className="text-white font-bold">{duracaoBlocoFormatada}</strong>
              </div>
            </div>

            {/* Resumo da Chamada Realizada */}
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200/70">
                    Presentes
                  </span>
                  <span className="text-lg font-black text-emerald-400">
                    {contadores.presentes} <span className="text-xs text-emerald-200 font-medium">{termoParticipante}s</span>
                  </span>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200/70">
                    Faltas
                  </span>
                  <span className="text-lg font-black text-rose-400">
                    {contadores.faltas} <span className="text-xs text-rose-200 font-medium">{termoParticipante}s</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEtapa("chamada")}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
              >
                Revisar Chamada
              </button>
            </div>

            {/* Botão de Destaque: Encerrar e Avançar para Foto (Stop) */}
            <div className="w-full max-w-md mt-2">
              <button
                type="button"
                onClick={() => setEtapa("finalizacao")}
                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2.5 cursor-pointer transition-all border border-rose-400/30"
              >
                <Camera className="h-5 w-5" />
                <span>Encerrar Treino e Tirar Foto (Stop)</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Card Complementar: Informações do Treino */}
          <Card className="p-5 flex flex-col gap-2 bg-white border border-zinc-200">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Atividade Programada
            </div>
            <div className="text-sm font-bold text-zinc-900">
              {turma.atividade?.nome || "Treino Regular da Turma"}
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {turma.atividade?.descricao || "Sessão de treinamento esportivo conforme plano pedagógico do polo."}
            </p>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 4: FINALIZAR AULA (FOTO COMPROBATÓRIA & STOP) */}
      {/* ========================================================================= */}
      {etapa === "finalizacao" && (
        <Card className="p-5 sm:p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Camera className="h-5 w-5 text-sky-600" />
                <span>Etapa 4: Foto Comprobatória & Fechamento</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Evidência fotográfica obrigatória do(a) {termoGrupo.toLowerCase()} reunido(a) para validar a execução e a presença.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEtapa("em_andamento")}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar ao Treino em Andamento
            </button>
          </div>

          {/* RESUMO RÁPIDO DO FECHAMENTO */}
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tempo Total</span>
              <span className="font-mono font-bold text-zinc-900">{formatTimer(segundosDecorridos)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Presentes</span>
              <span className="font-bold text-emerald-600">{contadores.presentes} {termoParticipante}s</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Faltas</span>
              <span className="font-bold text-rose-600">{contadores.faltas + contadores.justificadas}</span>
            </div>
          </div>

          {/* UPLOAD / CÂMERA DE FOTO COMPROBATÓRIA OU DISPENSA */}
          {dispensaFoto ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm text-amber-950">Foto Comprobatória Dispensada</strong>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Este(a) {termoSessao.toLowerCase()} está sendo regularizado(a) e o(a) {termoGrupo.toLowerCase()} não possuía {termoParticipante.toLowerCase()}s matriculados nesta data. A foto com o(a) {termoGrupo.toLowerCase()} não é necessária para concluir a regularização.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-900 flex items-center justify-between">
              <span>Foto com o(a) {termoGrupo} {dispensarFotoComprovante ? "(Opcional)" : "(Obrigatório) *"}</span>
              {fotoPreview ? (
                <span className="text-[10px] text-emerald-600 font-bold">✓ Foto Anexada</span>
              ) : dispensarFotoComprovante ? (
                <span className="text-[10px] text-amber-700 font-bold">Dispensada com declaração</span>
              ) : null}
            </label>

            {/* INPUTS ESCONDIDOS */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {fotoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-zinc-900 group">
                <img
                  src={fotoPreview}
                  alt="Comprovação da aula"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-2 bg-white text-zinc-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Camera className="h-4 w-4" /> Tirar Outra
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoFile(null);
                      setFotoPreview(null);
                    }}
                    className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-50 text-sky-800 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold">Abrir Câmera do Celular</span>
                  <span className="text-[10px] text-sky-600">Tirar foto na quadra/sala</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold">Galeria / Arquivo</span>
                  <span className="text-[10px] text-zinc-400">Selecionar foto existente</span>
                </button>
              </div>
            )}

            {/* TERMO DE CIÊNCIA DE AUSÊNCIA DE FOTO COMPROBATÓRIA */}
            <div className={`mt-1 rounded-2xl border p-3.5 transition-all ${
              dispensarFotoComprovante
                ? "border-amber-300 bg-amber-50/70"
                : "border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100/60"
            }`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dispensarFotoComprovante}
                  onChange={(e) => setDispensarFotoComprovante(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-900">
                    Não foi possível registrar a foto comprobatória desta aula
                  </span>
                  <span className="text-[11px] text-zinc-600 leading-relaxed">
                    Reconheço e estou ciente de que a ausência de foto comprobatória poderá impactar o processo de supervisão e homologação desta aula.
                  </span>
                </div>
              </label>

              {dispensarFotoComprovante && (
                <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-amber-100/80 border border-amber-300/80 p-2 text-[11px] text-amber-900 font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Atenção: A ausência de foto será devidamente registrada nas observações para a equipe de supervisão.</span>
                </div>
              )}
            </div>
          </div>
          )}

          {/* OBSERVAÇÕES PEDAGÓGICAS / DIÁRIO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-900 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              <span>Diário de Atividades / Observações do(a) {termoSessao}:</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder={`Ex: ${termoSessao} prático de fundamentos e dinâmicas. ${termoGrupo} bastante participativa.`}
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* BOTÃO PRINCIPAL STOP / CONCLUIR REGULARIZAÇÃO */}
          <button
            type="button"
            onClick={handleEncerrarAula}
            disabled={salvando || uploadingFoto || (!dispensaFoto && !dispensarFotoComprovante && !fotoFile && !fotoPreview)}
            className={`w-full font-extrabold py-5 rounded-2xl text-lg shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 ${
              isModoRegularizacao
                ? "bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-amber-600/20 active:scale-[0.99]"
                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.99] text-white shadow-rose-600/25"
            }`}
          >
            {salvando || uploadingFoto ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>{uploadingFoto ? "Enviando Foto..." : isModoRegularizacao ? "Salvando Regularização..." : "Registrando Saída..."}</span>
              </>
            ) : isModoRegularizacao ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-white" />
                <span>{dispensaFoto ? `CONCLUIR REGULARIZAÇÃO (SEM ${termoParticipante.toUpperCase()}S)` : `CONCLUIR E REGULARIZAR ${termoSessao.toUpperCase()}`}</span>
              </>
            ) : (
              <>
                <Square className="h-6 w-6 fill-white" />
                <span>ENCERRAR {termoSessao.toUpperCase()} (STOP)</span>
              </>
            )}
          </button>
        </Card>
      )}

      {/* MODAL: ENCERRAMENTO ANTECIPADO */}
      {showEncerrarAntecipadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Encerramento Antecipado</h3>
                <p className="text-xs text-zinc-500">
                  Faltam <strong className="text-amber-600">{minutosRestantes} minutos</strong> para o fim previsto ({horaFimPrevista}).
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <strong>Atenção:</strong> Você está encerrando o(a) {termoSessao.toLowerCase()} antes do horário previsto. É obrigatório informar o motivo.
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-700">Motivo do encerramento antecipado *</label>
              <textarea
                value={justificativaEncerramento}
                onChange={(e) => setJustificativaEncerramento(e.target.value)}
                placeholder={`Ex: Chuva forte impossibilitou continuidade do(a) ${termoSessao.toLowerCase()} ao ar livre...`}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowEncerrarAntecipadoModal(false);
                  setJustificativaEncerramento("");
                }}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEncerrarAula}
                disabled={!justificativaEncerramento.trim() || salvando}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {salvando ? "Encerrando..." : "Confirmar Encerramento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA CONCLUÍDA: SUCESSO & RESUMO CONSOLIDADO */}
      {/* ========================================================================= */}
      {etapa === "concluida" && (
        <Card className="p-6 flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-300">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <h2 className="text-2xl font-black text-zinc-900">{termoSessao} Concluído(a) com Sucesso!</h2>
            <p className="text-xs text-zinc-500 max-w-md">
              A verdade comprovada (Horário Real Efetivo, Chamada de {termoParticipante}s e Evidência Fotográfica) foi
              registrada de forma atômica no sistema.
            </p>
          </div>

          {/* STATUS DE APROVAÇÃO SE RETROATIVA */}
          {execucao?.statusAprovacao === "pendente_aprovacao" ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-amber-900">Pendente de Validação do Coordenador</span>
                <span className="text-amber-800">
                  Por ter sido lançado(a) fora da janela regular de horários, este(a) {termoSessao.toLowerCase()} e seus registros de presença serão
                  auditados pelo Coordenador do Núcleo.
                </span>
                {execucao.justificativaRetroativa && (
                  <p className="mt-2 text-[11px] font-mono bg-amber-100/70 p-2 rounded border border-amber-300">
                    Justificativa: {execucao.justificativaRetroativa}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 flex items-center justify-center gap-2 font-bold">
              <Award className="h-5 w-5 text-emerald-600" />
              <span>Registro Aprovado e Homologado para Folha de Ponto</span>
            </div>
          )}

          {/* RESUMO GERAL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horário Entrada Real</span>
              <span className="text-sm font-bold text-zinc-900">{parseHora(execucao?.horaInicioReal, "08:00")}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horário Saída Real</span>
              <span className="text-sm font-bold text-zinc-900">{parseHora(execucao?.horaFimReal, "10:00")}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Presentes</span>
              <span className="text-sm font-bold text-emerald-600">{contadores.presentes} {termoParticipante}s</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Faltas</span>
              <span className="text-sm font-bold text-rose-600">{contadores.faltas + contadores.justificadas}</span>
            </div>
          </div>

          {/* FOTO ANEXADA */}
          {(fotoPreview || execucao?.fotoComprovanteUrl) && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Comprovação Registrada</span>
              <div className="w-full max-w-sm rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                <img
                  src={fotoPreview || formatStorageUrl(execucao?.fotoComprovanteUrl)}
                  alt="Comprovante"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}

          {/* AÇÕES DE SAÍDA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-100">
            <Link
              href="/professor"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors"
            >
              Voltar ao Painel do(a) {termoResponsavel}
            </Link>

            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Ver Informações da Aula</span>
            </button>
          </div>
        </Card>
      )}

      {/* MODAL DE JUSTIFICATIVA RETROATIVA */}
      {showJustificativaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
              <AlertTriangle className="h-5 w-5" />
              <span>Justificativa Obrigatória</span>
            </div>

            <p className="text-xs text-zinc-600">
              Este(a) {termoSessao.toLowerCase()} está fora do horário regular ou em data anterior. Por favor, detalhe o motivo para análise do
              Coordenador:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {JUSTIFICATIVAS_PREDEFINIDAS.map((motivo) => {
                const isSelected = justificativaRetroativa === motivo;
                return (
                  <button
                    key={motivo}
                    type="button"
                    onClick={() => setJustificativaRetroativa(isSelected ? "" : motivo)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all text-left font-medium cursor-pointer ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-zinc-50 hover:bg-amber-50 text-zinc-700 hover:text-amber-800 border-zinc-200 hover:border-amber-300"
                    }`}
                  >
                    {motivo}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                  Horário Real de Início:
                </label>
                <input
                  type="time"
                  value={horaInicioEfetiva}
                  onChange={(e) => setHoraInicioEfetiva(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                  Horário Real de Término:
                </label>
                <input
                  type="time"
                  value={horaFimEfetiva}
                  onChange={(e) => setHoraFimEfetiva(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <textarea
              value={justificativaRetroativa}
              onChange={(e) => setJustificativaRetroativa(e.target.value)}
              placeholder="Ex: Treino realizado sem internet no local / Reposição de aula aprovada."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowJustificativaModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleIniciarAula}
                disabled={!justificativaRetroativa.trim() || salvando}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white"
              >
                {salvando ? "Iniciando..." : "Confirmar e Iniciar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INFORMAÇÕES DA AULA EXECUTADA */}
      {showInfoModal && (
        <ModalInformacoesAula
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          turma={turma}
          dataAula={dataAula}
          execucaoInicial={execucao}
        />
      )}
    </div>
  );
}

export const ExecucaoAulaClient = ExecucaoSessaoClient;
