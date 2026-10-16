"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Clock, 
  Users, 
  UserCheck, 
  Filter, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  CalendarCheck
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { GradeSemanal, type BlocoHorarioAula } from "@/components/turmas/GradeSemanal";
import { 
  grupoHorariosApi, 
  gruposApi, 
  atividadesApi, 
  type NucleoApi, 
  type TurmaApi, 
  type FuncionarioApi, 
  type AtividadeApi 
} from "@/lib/api/services";
import { 
  validarChoques, 
  type RegraBlocoHorario, 
  type ConflitoAgendamento 
} from "@/lib/agendamento";
import { useToast } from "@/components/providers/ToastProvider";
import { useDicionario } from "@/components/providers/DictionaryProvider";

export interface GradeNucleoManagerProps {
  nucleo: NucleoApi;
  turmas: TurmaApi[];
  funcionarios: FuncionarioApi[];
  categorias?: any[];
}

export function GradeNucleoManager({
  nucleo,
  turmas,
  funcionarios,
}: GradeNucleoManagerProps) {
  const { toast } = useToast();
  const { t } = useDicionario();

  const termoLocal = t("local", "Núcleo");
  const termoTurma = t("turma", "Turma");
  const termoTurmas = t("turma", "Turmas", true);
  const termoProfessor = t("instrutor", "Professor");
  const termoProfessores = t("instrutor", "Professores", true);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [blocos, setBlocos] = useState<BlocoHorarioAula[]>([]);
  const [modificado, setModificado] = useState(false);
  const [atividades, setAtividades] = useState<AtividadeApi[]>([]);
  const [listaTurmas, setListaTurmas] = useState<TurmaApi[]>(turmas);

  // Filtros
  const [filtroInstrutor, setFiltroInstrutor] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ocupados" | "vagos">("todos");

  // Carregar dados iniciais de blocos e atividades
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [horariosRes, atvRes] = await Promise.all([
        grupoHorariosApi.list({ nucleoId: nucleo.id }),
        atividadesApi.list({ limit: 200 }).catch(() => ({ data: [] })),
      ]);

      setBlocos(horariosRes as BlocoHorarioAula[]);
      setAtividades(atvRes.data);
      setModificado(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar a grade de horários do núcleo.");
    } finally {
      setLoading(false);
    }
  }, [nucleo.id, toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Professores vinculados ao núcleo ou com blocos no núcleo
  const professoresDoNucleo = useMemo(() => {
    const idsProfComBlocos = new Set(blocos.map((b) => b.responsavelId).filter(Boolean));
    return funcionarios.filter((f) => {
      return idsProfComBlocos.has(f.id) || f.funcao?.toLowerCase().includes("prof") || f.funcao?.toLowerCase().includes("instrut");
    });
  }, [funcionarios, blocos]);

  // Análise preventiva de choques
  const conflitosDetectados: ConflitoAgendamento[] = useMemo(() => {
    const regras: RegraBlocoHorario[] = blocos.map((b) => {
      const KEY_TO_NUM: Record<string, number> = {
        Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6,
      };
      return {
        id: b.id,
        grupoId: b.grupoId || undefined,
        grupoNome: b.grupoNome || (b.grupoId ? "Turma" : "Vago"),
        nucleoId: b.nucleoId || nucleo.id,
        nucleoNome: b.nucleoNome || nucleo.identificacao,
        responsavelId: b.responsavelId,
        responsavelNome: b.responsavelNome,
        horaInicio: b.horaInicio || `${String(b.inicio).padStart(2, "0")}:00:00`,
        horaFim: b.horaFim || `${String(b.fim).padStart(2, "0")}:00:00`,
        tipoRecorrencia: b.tipoRecorrencia || "semanal",
        diaSemana: b.dia ? KEY_TO_NUM[b.dia] ?? 1 : 1,
        diaMes: b.diaMes,
        ordemSemanaMes: b.ordemSemanaMes,
        ajusteFimDeSemana: b.ajusteFimDeSemana,
        dataEspecifica: b.dataEspecifica,
        gruposAdicionaisIds: b.gruposAdicionaisIds,
      };
    });

    return validarChoques(regras);
  }, [blocos, nucleo]);

  // Estatísticas de Ocupação
  const totalHorasSemanais = useMemo(() => {
    return blocos.reduce((acc, b) => acc + (b.duracaoHoras || (b.fim - b.inicio)), 0);
  }, [blocos]);

  const blocosOcupados = useMemo(() => {
    return blocos.filter((b) => Boolean(b.grupoId || b.turmaId));
  }, [blocos]);

  const blocosVagos = useMemo(() => {
    return blocos.filter((b) => !b.grupoId && !b.turmaId);
  }, [blocos]);

  const taxaOcupacaoBlocos = blocos.length > 0 ? Math.round((blocosOcupados.length / blocos.length) * 100) : 0;

  // Filtragem dos slots para a visão da grade
  const blocosExibidos = useMemo(() => {
    let result = blocos;

    if (filtroInstrutor) {
      result = result.filter((b) => b.responsavelId === filtroInstrutor);
    }

    if (filtroStatus === "ocupados") {
      result = result.filter((b) => Boolean(b.grupoId || b.turmaId));
    } else if (filtroStatus === "vagos") {
      result = result.filter((b) => !b.grupoId && !b.turmaId);
    }

    return result;
  }, [blocos, filtroInstrutor, filtroStatus]);

  // Ações de gerenciamento dos blocos
  function handleSlotsChange(novosSlots: BlocoHorarioAula[]) {
    // Se o filtro de instrutor ou status estiver ativo, mescla com os blocos não visíveis
    if (filtroInstrutor || filtroStatus !== "todos") {
      const outrosBlocos = blocos.filter((b) => !blocosExibidos.includes(b));
      setBlocos([...outrosBlocos, ...novosSlots]);
    } else {
      setBlocos(novosSlots);
    }
    setModificado(true);
  }

  // Alocação direta de turma em um bloco
  async function handleAlocarTurma(blocoId: string, turmaId: string | null) {
    try {
      await grupoHorariosApi.alocarTurma(blocoId, turmaId);
      const tObj = listaTurmas.find((t) => t.id === turmaId);
      
      setBlocos((prev) =>
        prev.map((b) =>
          b.id === blocoId
            ? {
                ...b,
                grupoId: turmaId,
                grupoNome: tObj?.nome,
                turmaId: turmaId,
                turmaNome: tObj?.nome,
              }
            : b
        )
      );

      toast.success(
        turmaId
          ? `${termoTurma} alocada com sucesso no bloco!`
          : `Bloco desalocado com sucesso (agora disponível/vago).`
      );
    } catch (err: any) {
      toast.error(err.message || "Erro ao alocar turma no bloco.");
    }
  }

  // Criação rápida de turma a partir do bloco
  async function handleCriarTurmaRapida(nomeTurma: string, atividadeId?: string): Promise<{ id: string; nome: string }> {
    try {
      const nova = await gruposApi.create({
        nome: nomeTurma,
        nucleoId: nucleo.id,
        atividadeId: atividadeId || null,
        tipo: "regular",
        vagasTotais: 30,
        permitirFilaEspera: true,
      });

      const turmaFormatada: TurmaApi = nova as unknown as TurmaApi;
      setListaTurmas((prev) => [...prev, turmaFormatada]);
      toast.success(`Nova ${termoTurma.toLowerCase()} "${nova.nome}" criada com sucesso!`);
      return { id: nova.id, nome: nova.nome };
    } catch (err: any) {
      const msg = err.message || `Erro ao criar nova ${termoTurma.toLowerCase()}.`;
      toast.error(msg);
      throw new Error(msg);
    }
  }

  // Salvar a grade inteira no Supabase
  async function handleSalvarGrade() {
    try {
      setSalvando(true);
      await grupoHorariosApi.setHorariosDoNucleo(nucleo.id, blocos);
      toast.success(`Grade de horários do ${termoLocal.toLowerCase()} salva com sucesso!`);
      setModificado(false);
      await carregarDados();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar grade de horários.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Barra Superior de Indicadores e Ações do Núcleo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Total de Blocos Físicos */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-500">Capacidade da Grade</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {blocos.length}
            </span>
            <span className="text-xs text-zinc-500 font-medium">blocos ({totalHorasSemanais}h/sem)</span>
          </div>
        </div>

        {/* KPI 2: Blocos Ocupados */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-500">Horários Ocupados</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {blocosOcupados.length}
            </span>
            <span className="text-xs text-zinc-500 font-medium">({taxaOcupacaoBlocos}% ocupação)</span>
          </div>
        </div>

        {/* KPI 3: Horários Vagos / Disponíveis */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-500">Horários Vagos</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {blocosVagos.length}
            </span>
            <span className="text-xs text-zinc-500 font-medium">disponíveis</span>
          </div>
        </div>

        {/* KPI 4: Status de Sincronização */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Sincronização</span>
            {modificado ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" /> Não salvo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Atualizado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              onClick={handleSalvarGrade}
              loading={salvando}
              disabled={!modificado && !loading}
              className="w-full text-xs font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Salvar Grade
            </Button>
            <button
              type="button"
              onClick={carregarDados}
              title="Recarregar grade do servidor"
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alertas Preventivos de Conflito */}
      {conflitosDetectados.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-sm text-red-950">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Atenção: {conflitosDetectados.length} choque(s) de agendamento detectado(s) neste núcleo</span>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            {conflitosDetectados.map((c, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-red-200">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 shrink-0">
                  {c.tipo === "choque_instrutor" ? "Instrutor" : "Espaço Físico"}
                </span>
                <p className="text-zinc-800 leading-relaxed font-medium">
                  {c.mensagem}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtros Operacionais */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Instrutor */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filtroInstrutor}
              onChange={(e) => setFiltroInstrutor(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Todos os {termoProfessores}</option>
              {professoresDoNucleo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomeCompleto} {p.funcao ? `(${p.funcao})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Ocupação */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-200/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setFiltroStatus("todos")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filtroStatus === "todos"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Todos ({blocos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("ocupados")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filtroStatus === "ocupados"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Ocupados ({blocosOcupados.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("vagos")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filtroStatus === "vagos"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Vagos ({blocosVagos.length})
            </button>
          </div>
        </div>

        {/* Legenda rápida */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            Turma Regular
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Horário Vago
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Aulão Conjunto
          </span>
        </div>
      </div>

      {/* Grade Semanal Interativa em Modo Núcleo */}
      <GradeSemanal
        modo="nucleo"
        atividadeNome="Horário do Núcleo"
        atividadesLocais={atividades}
        funcionarios={funcionarios}
        nucleos={[nucleo]}
        nucleoPadraoId={nucleo.id}
        nucleoPadraoNome={nucleo.identificacao}
        turmasDisponiveis={listaTurmas}
        slots={blocosExibidos}
        onChange={handleSlotsChange}
        onAlocarTurma={handleAlocarTurma}
        onCriarTurmaRapida={handleCriarTurmaRapida}
      />
    </div>
  );
}
