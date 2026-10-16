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
  CalendarCheck,
  Plus,
  CalendarPlus,
  Building2
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { GradeSemanal, ModalBloco, type BlocoHorarioAula } from "@/components/turmas/GradeSemanal";
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
  const [modalNovoBlocoAberto, setModalNovoBlocoAberto] = useState(false);

  // Filtros de visão de grade
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
      return idsProfComBlocos.has(f.id) || f.funcao?.toLowerCase().includes("prof") || f.funcao?.toLowerCase().includes("instrut") || f.professorResponsavel;
    });
  }, [funcionarios, blocos]);

  // Contagem de blocos por professor
  const contagemPorProfessor = useMemo(() => {
    const map = new Map<string, number>();
    blocos.forEach((b) => {
      if (b.responsavelId) {
        map.set(b.responsavelId, (map.get(b.responsavelId) || 0) + 1);
      }
    });
    return map;
  }, [blocos]);

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
    let proximaGrade: BlocoHorarioAula[];
    if (filtroInstrutor || filtroStatus !== "todos") {
      const outrosBlocos = blocos.filter((b) => !blocosExibidos.includes(b));
      proximaGrade = [...outrosBlocos, ...novosSlots];
    } else {
      proximaGrade = novosSlots;
    }
    setBlocos(proximaGrade);
    setModificado(true);
  }

  // Adicionar novos blocos vindos do botão principal "+ Adicionar Horário"
  async function handleAdicionarNovosBlocos(novosBlocos: BlocoHorarioAula[]) {
    let atualizada = [...blocos];
    for (const nb of novosBlocos) {
      atualizada = atualizada.filter(
        (s) => s.dia !== nb.dia || s.fim <= nb.inicio || s.inicio >= nb.fim
      );
      atualizada.push(nb);
    }
    setBlocos(atualizada);
    setModificado(true);

    try {
      setSalvando(true);
      await grupoHorariosApi.setHorariosDoNucleo(nucleo.id, atualizada);
      toast.success(`${novosBlocos.length} horário(s) adicionado(s) à grade do ${termoLocal.toLowerCase()} com sucesso!`);
      setModificado(false);
      await carregarDados();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar horários na grade do núcleo.");
    } finally {
      setSalvando(false);
    }
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

  const profSelecionadoNome = useMemo(() => {
    if (!filtroInstrutor) return null;
    return funcionarios.find((f) => f.id === filtroInstrutor)?.nomeCompleto;
  }, [filtroInstrutor, funcionarios]);

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho de Destaque da Grade do Núcleo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Grade de Horários da Quadra / Espaço
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Núcleo: <strong>{nucleo.identificacao}</strong> • Capacidade física e escala dos professores
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            size="md"
            onClick={() => setModalNovoBlocoAberto(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Horário na Grade
          </Button>

          <Button
            size="md"
            variant="outline"
            onClick={handleSalvarGrade}
            loading={salvando}
            disabled={!modificado && !loading}
            className="flex items-center gap-1.5 font-bold"
          >
            <Save className="w-4 h-4 text-emerald-600" />
            {modificado ? "Salvar Alterações" : "Salvo"}
          </Button>

          <button
            type="button"
            onClick={carregarDados}
            title="Recarregar grade do servidor"
            className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Barra de Indicadores Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-semibold text-zinc-500 block mb-0.5">Carga Horária da Quadra</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">{totalHorasSemanais}h</span>
            <span className="text-xs text-zinc-500 font-medium">({blocos.length} blocos)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-semibold text-zinc-500 block mb-0.5">Horários Ocupados</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{blocosOcupados.length}</span>
            <span className="text-xs text-zinc-500 font-medium">({taxaOcupacaoBlocos}% da grade)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-semibold text-zinc-500 block mb-0.5">Horários Vagos (Livres)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{blocosVagos.length}</span>
            <span className="text-xs text-zinc-500 font-medium">disponíveis</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-semibold text-zinc-500 block mb-0.5">{termoProfessores} na Grade</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{contagemPorProfessor.size}</span>
            <span className="text-xs text-zinc-500 font-medium">escalados</span>
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

      {/* Seletor de Grades por Professor ou Geral da Instalação */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2 shrink-0">
              Grades:
            </span>

            {/* Aba Grade Geral */}
            <button
              type="button"
              onClick={() => setFiltroInstrutor("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                filtroInstrutor === ""
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <span>🌐 Grade Geral da Quadra</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filtroInstrutor === "" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
              }`}>
                {blocos.length}
              </span>
            </button>

            {/* Pílulas de Grade por Professor */}
            {professoresDoNucleo.map((p) => {
              const totalBlocosProf = contagemPorProfessor.get(p.id) || 0;
              const isSelected = filtroInstrutor === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFiltroInstrutor(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>👤 {p.nomeCompleto}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {totalBlocosProf}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtro por Ocupação */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-200/80 p-1 text-xs shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroStatus("todos")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroStatus === "todos"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("ocupados")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroStatus === "vagos"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Vagos ({blocosVagos.length})
            </button>
          </div>
        </div>

        {profSelecionadoNome && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">
              Exibindo horários específicos da grade do professor <strong>{profSelecionadoNome}</strong> neste núcleo.
            </span>
            <button
              type="button"
              onClick={() => setFiltroInstrutor("")}
              className="text-sky-600 hover:underline font-bold"
            >
              Ver todos os horários da quadra
            </button>
          </div>
        )}
      </div>

      {/* Empty State se o Núcleo não tiver horários ainda */}
      {blocos.length === 0 && !loading && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div className="max-w-md">
            <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Esta instalação ainda não possui horários cadastrados
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              A grade pertence a este núcleo. Comece definindo os horários da quadra (ex: Terça e Quinta 08:00 às 10:00). Depois, basta alocar turmas existentes ou criar novas turmas diretamente nos horários.
            </p>
          </div>
          <Button
            size="md"
            onClick={() => setModalNovoBlocoAberto(true)}
            className="mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Horário na Grade
          </Button>
        </div>
      )}

      {/* Grade Semanal Interativa em Modo Núcleo */}
      {blocos.length > 0 && (
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
      )}

      {/* Modal Principal de Adicionar Bloco de Horário */}
      {modalNovoBlocoAberto && (
        <ModalBloco
          modo="nucleo"
          atividadeNome="Horário do Núcleo"
          atividadesLocais={atividades}
          funcionarios={funcionarios}
          nucleos={[nucleo]}
          nucleoPadraoId={nucleo.id}
          nucleoPadraoNome={nucleo.identificacao}
          turmasDisponiveis={listaTurmas}
          diasVisiveis={["Seg", "Ter", "Qua", "Qui", "Sex"]}
          initialResponsavelId={filtroInstrutor || undefined}
          onConfirm={handleAdicionarNovosBlocos}
          onClose={() => setModalNovoBlocoAberto(false)}
          onCriarTurmaRapida={handleCriarTurmaRapida}
        />
      )}
    </div>
  );
}
