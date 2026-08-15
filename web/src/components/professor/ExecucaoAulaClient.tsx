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
  execucoesAulaApi,
  professoresApi,
  type TurmaApi,
  type FuncionarioApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import type { ExecucaoAulaApi, BeneficiarioPresencaApi } from "@/lib/types/execucaoAula";

interface ExecucaoAulaClientProps {
  turma: TurmaApi;
  beneficiarios: BeneficiarioApi[];
  funcionarios?: FuncionarioApi[];
  dataQuery: string;
  execucaoInicial: ExecucaoAulaApi | null;
  presencasIniciais: BeneficiarioPresencaApi[];
  autoStart?: boolean;
}

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

const DIAS_SEMANA_MAP: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

function formatStorageUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("blob:")
  ) {
    return pathOrUrl;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/comprovacoes/${pathOrUrl}`;
}

export function ExecucaoAulaClient({
  turma,
  beneficiarios,
  funcionarios = [],
  dataQuery,
  execucaoInicial,
  presencasIniciais,
  autoStart,
}: ExecucaoAulaClientProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const autoStartRef = useRef(autoStart);

  const [execucao, setExecucao] = useState<ExecucaoAulaApi | null>(execucaoInicial);
  const [dataAula, setDataAula] = useState<string>(
    execucaoInicial?.data || dataQuery || getDataHojeBrasil()
  );

  // Etapas: "inicio" (Step 1) | "chamada" (Step 2) | "finalizacao" (Step 3) | "concluida"
  const [etapa, setEtapa] = useState<"inicio" | "chamada" | "finalizacao" | "concluida">(() => {
    if (execucaoInicial?.status === "concluida") return "concluida";
    if (execucaoInicial) return "chamada";
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

  // Estados de Filtro e Busca na Chamada
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "presente" | "falta" | "falta_justificada">("todos");

  // Estados de Finalização (Foto e Diário)
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    execucaoInicial?.fotoComprovanteUrl ? formatStorageUrl(execucaoInicial.fotoComprovanteUrl) : null
  );
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

  // Cronômetro ao Vivo
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);

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
          (user.refId && f.id === user.refId) ||
          (user.nome && f.nomeCompleto.toLowerCase() === user.nome.toLowerCase())
      );
      if (match) return match;
    }
    if (turma.responsaveis && turma.responsaveis.length > 0) {
      const respId = turma.responsaveis[0];
      const matchResp = funcionarios.find((f) => f.id === respId);
      if (matchResp) return matchResp;
    }
    return funcionarios[0] || null;
  }, [user, funcionarios, turma]);

  // Horários Previstos da Turma para a data da aula
  const slotHoje = useMemo(() => {
    if (!turma.slots || turma.slots.length === 0) return null;
    const [ano, mes, dia] = dataAula.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay(); // 0 = Domingo, 1 = Segunda...
    return (
      turma.slots.find((s: any) => s.dia_semana === diaSemana || s.dia === DIAS_SEMANA_MAP[diaSemana]?.slice(0, 3)) ||
      turma.slots[0]
    );
  }, [turma.slots, dataAula]);

  const horaInicioPrevista = useMemo(() => {
    if (!slotHoje) return "08:00";
    const ini = String(slotHoje.inicio);
    return ini.includes(":") ? ini.slice(0, 5) : `${ini.padStart(2, "0")}:00`;
  }, [slotHoje]);

  const horaFimPrevista = useMemo(() => {
    if (!slotHoje) return "10:00";
    const fim = String(slotHoje.fim);
    return fim.includes(":") ? fim.slice(0, 5) : `${fim.padStart(2, "0")}:00`;
  }, [slotHoje]);

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
  }, [dataAula, isDataRetroativa, isDataFutura, horaFimPrevista, turma.nucleo]);

  const isForaDoHorarioRegular = isDataRetroativa || isForaDaJanelaHorario;

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

    for (const b of beneficiarios) {
      const item = presencas[b.id];
      const st = item?.status || "presente";
      if (st === "presente") presentes++;
      else if (st === "falta") faltas++;
      else if (st === "falta_justificada") justificadas++;
    }

    return {
      total: beneficiarios.length,
      presentes,
      faltas,
      justificadas,
      taxaPresenca: beneficiarios.length > 0 ? Math.round((presentes / beneficiarios.length) * 100) : 0,
    };
  }, [beneficiarios, presencas]);

  // Beneficiários filtrados para a listagem
  const beneficiariosFiltrados = useMemo(() => {
    return beneficiarios.filter((b) => {
      const matchBusca =
        !busca ||
        b.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
        b.matricula.toLowerCase().includes(busca.toLowerCase());

      const statusAtual = presencas[b.id]?.status || "presente";
      const matchStatus = filtroStatus === "todos" || statusAtual === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [beneficiarios, busca, filtroStatus, presencas]);

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
    for (const b of beneficiarios) {
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

  // STEP 1: Iniciar Aula (Play)
  const handleIniciarAula = async () => {
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

      const novaExecucao = await execucoesAulaApi.iniciarAula({
        turmaId: turma.id,
        professorId,
        data: dataAula,
        horaInicioPrevista,
        horaFimPrevista,
        justificativaRetroativa: isForaDoHorarioRegular ? justificativaRetroativa.trim() : undefined,
      });

      setExecucao(novaExecucao);

      // Salva a lista de presenças inicial no banco
      const listaPresencasParaSalvar = beneficiarios.map((b) => ({
        beneficiarioId: b.id,
        status: presencas[b.id]?.status || ("presente" as const),
        observacao: presencas[b.id]?.observacao,
      }));

      if (listaPresencasParaSalvar.length > 0) {
        await execucoesAulaApi.salvarPresencas(novaExecucao.id, listaPresencasParaSalvar);
      }

      setShowJustificativaModal(false);
      setEtapa("chamada");
      toast.success("▶ Aula iniciada com sucesso! Ponto de entrada registrado.");
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
        setEtapa((prev) => (prev === "inicio" ? "chamada" : prev));
      }
      if (execucaoInicial.fotoComprovanteUrl) {
        setFotoPreview(formatStorageUrl(execucaoInicial.fotoComprovanteUrl));
      }
      if (execucaoInicial.observacoes) {
        setObservacoes(execucaoInicial.observacoes);
      }
    }
  }, [execucaoInicial]);

  // Salvar rascunho de presenças
  const handleSalvarRascunhoPresencas = async () => {
    if (!execucao) return;
    setSalvandoPresencas(true);
    try {
      const lista = beneficiarios.map((b) => ({
        beneficiarioId: b.id,
        status: presencas[b.id]?.status || ("presente" as const),
        observacao: presencas[b.id]?.observacao,
      }));

      await execucoesAulaApi.salvarPresencas(execucao.id, lista);
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
    if (!horaFimPrevista) return false;
    const now = new Date();
    const [fH, fM] = horaFimPrevista.split(":").map(Number);
    const fimPrevisto = new Date();
    fimPrevisto.setHours(fH, fM, 0, 0);
    return now < fimPrevisto;
  }, [horaFimPrevista, segundosDecorridos]);

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

    if (!fotoFile && !fotoPreview) {
      toast.error("A foto comprobatória da turma reunida é obrigatória para encerrar a aula.");
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
      const lista = beneficiarios.map((b) => ({
        beneficiarioId: b.id,
        status: presencas[b.id]?.status || ("presente" as const),
        observacao: presencas[b.id]?.observacao,
      }));
      await execucoesAulaApi.salvarPresencas(execucao.id, lista);

      // Montar observações com justificativa de encerramento antecipado
      let obsFinais = observacoes.trim();
      if (justificativaEncerramento.trim()) {
        const prefixo = `[ENCERRAMENTO ANTECIPADO - ${minutosRestantes}min antes] ${justificativaEncerramento.trim()}`;
        obsFinais = obsFinais ? `${prefixo}\n\n${obsFinais}` : prefixo;
      }

      // Finaliza a aula e registra ponto de saída
      const aulaConcluida = await execucoesAulaApi.finalizarAula(execucao.id, {
        fotoComprovanteUrl: finalFotoUrl,
        observacoes: obsFinais || undefined,
      });

      setExecucao(aulaConcluida);
      setEtapa("concluida");
      setShowEncerrarAntecipadoModal(false);
      toast.success("⏹ Aula finalizada com sucesso! Ponto de saída e relatório registrados.");
    } catch (err: any) {
      toast.error(`Erro ao finalizar aula: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvando(false);
      setUploadingFoto(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto py-2 px-3 sm:px-4">
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
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Professor</span>
            <span className="font-semibold text-white truncate block mt-0.5">
              {professor?.nomeCompleto || turma.responsaveisNomes?.[0] || "Instrutor"}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Inscritos</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              {beneficiarios.length} Beneficiários
            </span>
          </div>
        </div>
      </div>

      {/* STEPPER PROGRESS BAR (3 ETAPAS ATÔMICAS) */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
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
              etapa === "finalizacao" || etapa === "concluida"
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
            3
          </span>
          <span className="truncate">Foto & Stop</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ETAPA 1: INICIAR AULA (PLAY) */}
      {/* ========================================================================= */}
      {etapa === "inicio" && (
        <Card className="p-5 sm:p-6 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
              <Play className="h-8 w-8 fill-emerald-600 ml-1" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Etapa 1: Iniciar Execução da Aula</h2>
            <p className="text-xs text-zinc-500 max-w-md">
              Ao clicar no botão abaixo, o sistema baterá o seu <strong>ponto de entrada</strong> e liberará a chamada
              dos beneficiários em tempo real.
            </p>
          </div>

          {/* ALERTA DE TOLERÂNCIA / RETROATIVIDADE */}
          {isForaDoHorarioRegular && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>Aula Fora da Janela Regular ou Retroativa</span>
              </div>
              <p className="text-amber-800">
                Esta aula está sendo iniciada fora da tolerância regular do horário previsto ({horaInicioPrevista} às{" "}
                {horaFimPrevista}). O registro ficará <strong>Pendente de Aprovação</strong> do Coordenador do Núcleo.
              </p>
              <div className="mt-1">
                <label className="block text-[11px] font-bold uppercase text-amber-900 mb-1">
                  Justificativa Obrigatória do Atraso:
                </label>
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

          {/* BOTÃO PRINCIPAL PLAY */}
          <button
            type="button"
            onClick={handleIniciarAula}
            disabled={salvando}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-extrabold py-5 rounded-2xl text-lg shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            {salvando ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Play className="h-7 w-7 fill-white" />
                <span>INICIAR AULA (PLAY)</span>
              </>
            )}
          </button>

          {/* SELETOR ALTERNATIVO DE DATA */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-xs text-zinc-500">
            <span>Data selecionada:</span>
            <input
              type="date"
              value={dataAula}
              onChange={(e) => setDataAula(e.target.value)}
              className="font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2: CHAMADA VIVA (PRESENÇA DINÂMICA) */}
      {/* ========================================================================= */}
      {etapa === "chamada" && (
        <div className="flex flex-col gap-4">
          {/* BANNER STICKY COM CRONÔMETRO AO VIVO */}
          <div className="sticky top-2 z-20 rounded-2xl bg-zinc-900/95 backdrop-blur-md text-white p-3.5 shadow-xl border border-zinc-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-3 w-3 items-center justify-center relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-none">
                  Aula em Andamento
                </span>
                <span className="text-xs text-zinc-300 font-medium">Início: {parseHora(execucao?.horaInicioReal, "08:00")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-none">Tempo de Aula</span>
                <span className="text-base font-black font-mono tracking-wider text-emerald-400">
                  {formatTimer(segundosDecorridos)}
                </span>
              </div>
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
                placeholder="Buscar beneficiário por nome ou matrícula…"
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
              {beneficiariosFiltrados.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-zinc-300" />
                  <span>Nenhum beneficiário encontrado com os filtros atuais.</span>
                </div>
              ) : (
                beneficiariosFiltrados.map((b) => {
                  const presencaItem = presencas[b.id];
                  const status = presencaItem?.status || "presente";

                  return (
                    <div key={b.id} className="py-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{b.nomeCompleto}</h4>
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
                              <span className="hidden sm:inline">Presente</span>
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
                onClick={() => {
                  handleSalvarRascunhoPresencas();
                  setEtapa("finalizacao");
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para Encerramento (Foto)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3: FINALIZAR AULA (FOTO COMPROBATÓRIA & STOP) */}
      {/* ========================================================================= */}
      {etapa === "finalizacao" && (
        <Card className="p-5 sm:p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Camera className="h-5 w-5 text-sky-600" />
                <span>Etapa 3: Foto Comprobatória & Fechamento</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Evidência fotográfica obrigatória da turma reunida para validar o ponto e a chamada.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEtapa("chamada")}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Ajustar Chamada
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
              <span className="font-bold text-emerald-600">{contadores.presentes} Beneficiários</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Faltas</span>
              <span className="font-bold text-rose-600">{contadores.faltas + contadores.justificadas}</span>
            </div>
          </div>

          {/* UPLOAD / CÂMERA DE FOTO COMPROBATÓRIA */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-900 flex items-center justify-between">
              <span>Foto com a Turma (Obrigatório) *</span>
              {fotoPreview && <span className="text-[10px] text-emerald-600 font-bold">✓ Foto Anexada</span>}
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
          </div>

          {/* OBSERVAÇÕES PEDAGÓGICAS / DIÁRIO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-900 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              <span>Diário de Atividades / Observações da Aula:</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Treino tático de fundamentos, passes e coletivo. Turma bastante participativa."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* BOTÃO PRINCIPAL STOP */}
          <button
            type="button"
            onClick={handleEncerrarAula}
            disabled={salvando || uploadingFoto || (!fotoFile && !fotoPreview)}
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.99] text-white font-extrabold py-5 rounded-2xl text-lg shadow-xl shadow-rose-600/25 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            {salvando || uploadingFoto ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>{uploadingFoto ? "Enviando Foto..." : "Registrando Saída..."}</span>
              </>
            ) : (
              <>
                <Square className="h-6 w-6 fill-white" />
                <span>ENCERRAR AULA (STOP)</span>
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
              <strong>Atenção:</strong> Você está encerrando a aula antes do horário previsto. É obrigatório informar o motivo.
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-700">Motivo do encerramento antecipado *</label>
              <textarea
                value={justificativaEncerramento}
                onChange={(e) => setJustificativaEncerramento(e.target.value)}
                placeholder="Ex: Chuva forte impossibilitou continuidade da aula ao ar livre..."
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

            <h2 className="text-2xl font-black text-zinc-900">Aula Concluída com Sucesso!</h2>
            <p className="text-xs text-zinc-500 max-w-md">
              A tríplice vinculação (Ponto de Entrada/Saída, Chamada dos Beneficiários e Comprovação Fotográfica) foi
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
                  Por ter sido lançada fora da janela regular de horários, esta aula e seus registros de ponto serão
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
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Ponto Entrada</span>
              <span className="text-sm font-bold text-zinc-900">{parseHora(execucao?.horaInicioReal, "08:00")}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Ponto Saída</span>
              <span className="text-sm font-bold text-zinc-900">{parseHora(execucao?.horaFimReal, "10:00")}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Presentes</span>
              <span className="text-sm font-bold text-emerald-600">{contadores.presentes} Beneficiários</span>
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
              Voltar ao Painel do Professor
            </Link>

            <Link
              href={`/turmas/${turma.id}/presenca`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 text-zinc-800 font-bold text-xs hover:bg-zinc-200 transition-colors"
            >
              Ver Espelho de Presenças da Turma
            </Link>
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
              Esta aula está fora do horário regular ou em data anterior. Por favor, detalhe o motivo para análise do
              Coordenador:
            </p>

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
    </div>
  );
}
