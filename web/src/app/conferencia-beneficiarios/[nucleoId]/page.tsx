"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import {
  School,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Send,
  Plus,
  Trash2,
  UserPlus,
  Sparkles,
  Check,
  X,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";

interface HorarioItem {
  id: string;
  diaSemanaNumero: number;
  diaSemanaNome: string;
  horaInicio: string;
  horaFim: string;
}

interface TurmaItem {
  id: string;
  nome: string;
  identificador: string;
  idadeMinima: number;
  idadeMaxima: number;
  vagasTotais: number;
  horarios: HorarioItem[];
  diasResumo: string;
  horarioResumo: string;
}

interface BeneficiarioItem {
  id: string;
  matricula: string;
  nomeCompleto: string;
  dataNascimento: string;
  idade: number | null;
  sexo: string;
  status: string;
  pcd: boolean;
  cpf?: string;
}

interface AlunoNovo {
  idTemp: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  sexo: "M" | "F";
  turmaSugeridaId?: string;
}

export default function ConferenciaBeneficiariosPage({
  params,
}: {
  params: Promise<{ nucleoId: string }>;
}) {
  const resolvedParams = use(params);
  const nucleoId = resolvedParams.nucleoId;

  // Estados principais de carregamento e dados
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nucleo, setNucleo] = useState<any>(null);
  const [professorNome, setProfessorNome] = useState<string>("");
  const [modalidadeNome, setModalidadeNome] = useState<string>("Futebol de Campo");
  const [temAlunos, setTemAlunos] = useState<boolean>(false);
  const [totalAlunosSistema, setTotalAlunosSistema] = useState<number>(0);
  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioItem[]>([]);
  const [respostaExistente, setRespostaExistente] = useState<any>(null);

  // Controle de passos: 1 (Conferir/Informar Total), 2 (Distribuir na Grade), 3 (Alocação / Cadastro), 4 (Sucesso)
  const [passo, setPasso] = useState<number>(1);

  // Passo 1: Quantidade de alunos
  const [totalInformado, setTotalInformado] = useState<number>(0);
  const [totalConfirmado, setTotalConfirmado] = useState<boolean>(false);

  // Passo 2: Distribuição de vagas por turma (turmaId -> quantidade única de alunos)
  const [vagasPorTurma, setVagasPorTurma] = useState<Record<string, number>>({});

  // Passo 3 (Cenário A): Alocações de alunos oficiais (alunoId -> turmaId)
  const [alocacoes, setAlocacoes] = useState<Record<string, string>>({});
  const [turmaAtivaModalId, setTurmaAtivaModalId] = useState<string | null>(null);
  const [buscaAlunoModal, setBuscaAlunoModal] = useState<string>("");
  const [abaModal, setAbaModal] = useState<"sugeridos" | "alocados" | "todos">("sugeridos");
  const [mostrarListaGeral, setMostrarListaGeral] = useState<boolean>(false);
  const [buscaListaGeral, setBuscaListaGeral] = useState<string>("");
  const [filtroListaGeral, setFiltroListaGeral] = useState<"todos" | "pendentes" | "alocados">("todos");

  // Helper para sugerir turma adequada por idade
  const getTurmaSugerida = (idade: number | null): TurmaItem | null => {
    if (idade === null) return null;
    return turmas.find((t) => idade >= t.idadeMinima && idade <= t.idadeMaxima) || null;
  };

  // Passo 3 (Cenário B): Novos alunos cadastrados
  const [novosAlunos, setNovosAlunos] = useState<AlunoNovo[]>([]);
  const [novoNome, setNovoNome] = useState<string>("");
  const [novoCpf, setNovoCpf] = useState<string>("");
  const [novaDataNasc, setNovaDataNasc] = useState<string>("");
  const [novoSexo, setNovoSexo] = useState<"M" | "F">("M");
  const [novaTurmaId, setNovaTurmaId] = useState<string>("");
  const [erroFormNovo, setErroFormNovo] = useState<string | null>(null);

  // Helper para calcular idade a partir da data de nascimento
  const calcularIdadeData = (dataStr: string): number | null => {
    if (!dataStr) return null;
    const nasc = new Date(dataStr + "T00:00:00");
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade >= 0 ? idade : null;
  };

  const idadeCalculadaForm = useMemo(() => {
    return calcularIdadeData(novaDataNasc);
  }, [novaDataNasc]);

  const turmaSugeridaForm = useMemo(() => {
    return getTurmaSugerida(idadeCalculadaForm);
  }, [idadeCalculadaForm, turmas]);

  const handleAdicionarAlunoNovo = () => {
    if (!novoNome.trim()) {
      setErroFormNovo("Informe o nome completo do aluno.");
      return;
    }
    if (!novaDataNasc) {
      setErroFormNovo("Informe a data de nascimento.");
      return;
    }
    const idade = calcularIdadeData(novaDataNasc);
    const turmaEscolhida = novaTurmaId || (turmaSugeridaForm?.id || (turmas[0]?.id || ""));

    const novo: AlunoNovo = {
      idTemp: "temp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      nomeCompleto: novoNome.trim().toUpperCase(),
      cpf: novoCpf.trim(),
      dataNascimento: novaDataNasc,
      sexo: novoSexo,
      turmaSugeridaId: turmaEscolhida,
    };

    setNovosAlunos((prev) => [novo, ...prev]);
    setNovoNome("");
    setNovoCpf("");
    setNovaDataNasc("");
    setNovaTurmaId("");
    setErroFormNovo(null);
  };

  // Observações gerais e envio
  const [observacoes, setObservacoes] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);

  // Carregar dados da API
  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const res = await fetch(`/api/conferencia-beneficiarios/${nucleoId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar os dados deste núcleo.");
      }

      setNucleo(data.nucleo);
      setProfessorNome(data.professor?.nome || "");
      setModalidadeNome(data.modalidade || "Futebol de Campo");
      setTemAlunos(Boolean(data.temAlunos));
      setTotalAlunosSistema(data.totalAlunosSistema || 0);
      setTurmas(data.turmas || []);
      setBeneficiarios(data.beneficiarios || []);
      setRespostaExistente(data.respostaExistente || null);

      // Inicializar total informado
      const inicialTotal = data.temAlunos ? data.totalAlunosSistema : 0;
      setTotalInformado(inicialTotal);

      // Inicializar vagas com sugestão equilibrada
      const turmasLista: TurmaItem[] = data.turmas || [];
      const vagasIniciais: Record<string, number> = {};
      turmasLista.forEach((t) => {
        // Cenário A: vagas padrão da turma. Cenário B: inicia em 0 para o professor definir
        vagasIniciais[t.id] = data.temAlunos ? t.vagasTotais || 40 : 0;
      });
      setVagasPorTurma(vagasIniciais);

      // Se já houver resposta enviada anteriormente, restaurar dados
      if (data.respostaExistente) {
        const resp = data.respostaExistente;
        if (resp.total_alunos_informado !== undefined && resp.total_alunos_informado !== null) {
          setTotalInformado(Number(resp.total_alunos_informado));
          setTotalConfirmado(true);
        }
        if (resp.distribuicao_turmas && typeof resp.distribuicao_turmas === "object") {
          const { _mesmosAlunosRespostas, _totalAlunosUnicos, ...turmasVagas } = resp.distribuicao_turmas;
          setVagasPorTurma(turmasVagas);
          if (_mesmosAlunosRespostas && typeof _mesmosAlunosRespostas === "object") {
            setMesmosAlunosRespostas(_mesmosAlunosRespostas);
          }
        }
        if (resp.alocacoes_alunos && typeof resp.alocacoes_alunos === "object") {
          setAlocacoes(resp.alocacoes_alunos);
        }
        if (Array.isArray(resp.novos_alunos_cadastrados)) {
          setNovosAlunos(resp.novos_alunos_cadastrados);
        }
        if (resp.observacoes) {
          setObservacoes(resp.observacoes);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Erro desconhecido ao carregar o núcleo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [nucleoId]);

  // Soma de vagas distribuídas em todas as turmas
  const totalVagasDistribuidas = useMemo(() => {
    return Object.values(vagasPorTurma).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [vagasPorTurma]);

  // Total de alunos alocados até o momento (Cenário A)
  const totalAlunosAlocados = useMemo(() => {
    return Object.keys(alocacoes).length;
  }, [alocacoes]);

  // Cenário B: Detecção de turmas com mesma faixa etária (ou sobreposição)
  const [mesmosAlunosRespostas, setMesmosAlunosRespostas] = useState<Record<string, "mesmos" | "diferentes">>({});

  const paresSobrepostos = useMemo(() => {
    const lista: Array<{ t1: TurmaItem; t2: TurmaItem; key: string }> = [];
    for (let i = 0; i < turmas.length; i++) {
      for (let j = i + 1; j < turmas.length; j++) {
        const t1 = turmas[i];
        const t2 = turmas[j];
        const maxMin = Math.max(t1.idadeMinima, t2.idadeMinima);
        const minMax = Math.min(t1.idadeMaxima, t2.idadeMaxima);
        if (maxMin <= minMax) {
          lista.push({
            t1,
            t2,
            key: `${t1.id}_${t2.id}`,
          });
        }
      }
    }
    return lista;
  }, [turmas]);

  // Pares ativos onde o professor já definiu vagas (> 0) em ambas as turmas
  const paresAtivos = useMemo(() => {
    return paresSobrepostos.filter(
      (p) => (vagasPorTurma[p.t1.id] || 0) > 0 && (vagasPorTurma[p.t2.id] || 0) > 0
    );
  }, [paresSobrepostos, vagasPorTurma]);

  // Dedução e cálculo de alunos únicos para o Cenário B
  const { totalAlunosUnicosCenarioB, totalDescontoMesmosAlunos } = useMemo(() => {
    let deducao = 0;
    paresAtivos.forEach((p) => {
      if (mesmosAlunosRespostas[p.key] === "mesmos") {
        const v1 = vagasPorTurma[p.t1.id] || 0;
        const v2 = vagasPorTurma[p.t2.id] || 0;
        deducao += Math.min(v1, v2);
      }
    });
    return {
      totalAlunosUnicosCenarioB: Math.max(0, totalVagasDistribuidas - deducao),
      totalDescontoMesmosAlunos: deducao,
    };
  }, [totalVagasDistribuidas, paresAtivos, mesmosAlunosRespostas, vagasPorTurma]);

  // Cenário B: Confirmação do somatório final pelo professor
  const [confirmouTotalFinal, setConfirmouTotalFinal] = useState<boolean>(false);

  // Função de envio unificada para o Cenário B
  const handleSalvarCenarioB = async () => {
    if (totalAlunosUnicosCenarioB <= 0) {
      setErroEnvio("Por favor, selecione a quantidade de alunos em pelo menos uma turma da grade.");
      return;
    }

    if (!confirmouTotalFinal) {
      setErroEnvio("Por favor, confirme o somatório total de alunos no final da página antes de enviar.");
      return;
    }

    try {
      setEnviando(true);
      setErroEnvio(null);

      // Montar resumo de faixas semelhantes nas observações
      let obsFinal = observacoes.trim();
      const sobreposicoesTexto: string[] = [];
      paresSobrepostos.forEach((p) => {
        const v1 = vagasPorTurma[p.t1.id] || 0;
        const v2 = vagasPorTurma[p.t2.id] || 0;
        if (v1 > 0 && v2 > 0 && mesmosAlunosRespostas[p.key]) {
          const resp = mesmosAlunosRespostas[p.key];
          const desc =
            resp === "mesmos"
              ? "Mesmos alunos (participam nos dois horários)"
              : "Alunos diferentes (turmas com alunos distintos)";
          sobreposicoesTexto.push(
            `• Turma ${p.t1.identificador} (${v1} alunos) e Turma ${p.t2.identificador} (${v2} alunos): ${desc}`
          );
        }
      });

      if (sobreposicoesTexto.length > 0) {
        const bloco = `[Auditoria - Faixas Etárias Semelhantes]:\n${sobreposicoesTexto.join("\n")}`;
        obsFinal = obsFinal ? `${obsFinal}\n\n${bloco}` : bloco;
      }

      const res = await fetch("/api/conferencia-beneficiarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nucleoId: nucleo.id,
          nucleoNome: nucleo.identificacao,
          professorNome: professorNome || null,
          temAlunosPreExistentes: false,
          totalAlunosSistema: 0,
          totalAlunosInformado: totalAlunosUnicosCenarioB,
          distribuicaoTurmas: {
            ...vagasPorTurma,
            _mesmosAlunosRespostas: mesmosAlunosRespostas,
            _totalAlunosUnicos: totalAlunosUnicosCenarioB,
          },
          alocacoesAlunos: {},
          novosAlunosCadastrados: [],
          observacoes: obsFinal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar conferência.");

      setSucesso(true);
      setPasso(4);
    } catch (err: any) {
      setErroEnvio(err.message || "Erro ao enviar conferência.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-zinc-50 to-white text-zinc-900 pb-20">
      {/* Top Banner */}
      <header className="bg-sky-700 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <School className="w-7 h-7 text-sky-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-sky-200">
                Escolinhas de Inclusão e Cidadania
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                Conferência e Distribuição de Alunos
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-sky-100 mt-2">
            Etapa oficial de validação e alocação dos alunos nas turmas do seu núcleo.
          </p>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-zinc-200">
            <Loader2 className="w-10 h-10 text-sky-600 animate-spin mx-auto mb-3" />
            <p className="text-zinc-600 font-bold text-sm">Carregando dados do núcleo...</p>
          </div>
        ) : erro ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-rose-200 space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-black text-zinc-900">Núcleo Não Localizado</h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">{erro}</p>
            <button
              onClick={carregarDados}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* Card de Identificação do Núcleo e Professor */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-zinc-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-3xs uppercase tracking-wider font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                    Núcleo Oficial
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 mt-1">
                    {nucleo?.identificacao}
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Professor: <strong>{professorNome || "Responsável pelo Núcleo"}</strong> • Modalidade: <strong>{modalidadeNome}</strong>
                  </p>
                </div>

                {/* Badge de Cenário */}
                <div className="self-start sm:self-center">
                  {temAlunos ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>{totalAlunosSistema} alunos no sistema</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                      <UserPlus className="w-4 h-4 text-amber-600" />
                      <span>Fase de Cadastro de Alunos</span>
                    </div>
                  )}
                </div>
              </div>

              {respostaExistente && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-2 text-xs text-sky-800 font-medium">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Conferência já enviada anteriormente em {new Date(respostaExistente.created_at).toLocaleDateString("pt-BR")}. Você pode revisar ou reenviar novas informações.
                  </span>
                </div>
              )}
            </div>

            {/* Barra de Progresso dos Passos (Apenas Cenário A) */}
            {!sucesso && temAlunos && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
                  <span>Passo {passo} de 3</span>
                  <span>
                    {passo === 1 && "Conferir Total de Alunos"}
                    {passo === 2 && "Distribuir Vagas na Grade"}
                    {passo === 3 && "Alocação Inteligente nas Turmas"}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(passo / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* CENÁRIO B: PÁGINA ÚNICA UNIFICADA (NÚCLEOS SEM ALUNOS CADASTRADOS) */}
            {!temAlunos && !sucesso && (
              <div className="space-y-6 animate-fadeIn">
                {/* 1. DISTRIBUIÇÃO DE ALUNOS NAS TURMAS (IMAGE 2 NO TOPO) */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 space-y-6">
                  <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-black">
                        1
                      </span>
                      Quantidade de Alunos por Turma
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Informe quantos alunos participam em cada horário da grade semanal do seu núcleo:
                    </p>
                  </div>

                  {/* Grade Semanal das Turmas */}
                  <div className="space-y-3">
                    {turmas.map((t) => {
                      const vagas = vagasPorTurma[t.id] || 0;
                      return (
                        <div
                          key={t.id}
                          className={`rounded-2xl p-4 sm:p-5 border-2 transition-all space-y-3 ${
                            vagas > 0
                              ? "bg-white border-sky-400 shadow-xs"
                              : "bg-zinc-50/70 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-black rounded-lg">
                                  Turma {t.identificador}
                                </span>
                                <h4 className="font-black text-sm sm:text-base text-zinc-900">
                                  {t.nome}
                                </h4>
                              </div>
                              <p className="text-xs text-zinc-500">
                                Faixa Etária: <strong>{t.idadeMinima} a {t.idadeMaxima} anos</strong>
                              </p>
                            </div>

                            {/* Dropdown de Alunos da Turma */}
                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                              <label className="text-xs font-bold text-zinc-600">Alunos:</label>
                              <select
                                value={vagas}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setVagasPorTurma((prev) => ({ ...prev, [t.id]: val }));
                                  setConfirmouTotalFinal(false); // Exigir reconfirmação se alterar
                                }}
                                className={`h-11 px-3.5 rounded-xl border-2 text-sm font-black focus:outline-none transition-all cursor-pointer ${
                                  vagas > 0
                                    ? "border-sky-500 bg-white text-sky-950 focus:ring-4 focus:ring-sky-200"
                                    : "border-zinc-300 bg-white text-zinc-500 focus:ring-4 focus:ring-zinc-200"
                                }`}
                              >
                                <option value={0}>Definir alunos...</option>
                                {Array.from({ length: 150 }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>
                                    {n} {n === 1 ? "aluno" : "alunos"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Dias e Horários da Turma */}
                          <div className="bg-zinc-100/70 rounded-xl p-2.5 text-xs text-zinc-600 flex flex-wrap items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>
                              <strong>Dias e Horários:</strong> {t.diasResumo || "Dias a definir"} ({t.horarioResumo})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. VERIFICAÇÃO DE MESMA FAIXA ETÁRIA (SE HOUVER TURMAS COM ALUNOS DEFINIDOS E MESMA IDADE) */}
                {paresAtivos.length > 0 && (
                  <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 space-y-4 animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-zinc-900">
                          Atenção: Turmas com Mesma Faixa Etária Detectadas
                        </h4>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Identificamos turmas com faixas de idade compatíveis onde você já informou a quantidade. Responda abaixo para ajustar o somatório real:
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      {paresAtivos.map((p) => {
                        const resp = mesmosAlunosRespostas[p.key];
                        const v1 = vagasPorTurma[p.t1.id] || 0;
                        const v2 = vagasPorTurma[p.t2.id] || 0;

                        return (
                          <div
                            key={p.key}
                            className="bg-white border-2 border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                              <div>
                                <p className="font-black text-sm text-zinc-900">
                                  Turma {p.t1.identificador} ({p.t1.idadeMinima} a {p.t1.idadeMaxima} anos) e Turma {p.t2.identificador} ({p.t2.idadeMinima} a {p.t2.idadeMaxima} anos)
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {p.t1.diasResumo} ({p.t1.horarioResumo}) • {p.t2.diasResumo} ({p.t2.horarioResumo})
                                </p>
                              </div>
                              <div className="text-xs font-bold text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded-lg">
                                {v1} alunos e {v2} alunos
                              </div>
                            </div>

                            <p className="text-xs font-bold text-zinc-800">
                              Esses mesmos alunos participam das duas turmas?
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setMesmosAlunosRespostas((prev) => ({ ...prev, [p.key]: "mesmos" }));
                                  setConfirmouTotalFinal(false);
                                }}
                                className={`p-3.5 rounded-xl border-2 text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                                  resp === "mesmos"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200"
                                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                <div>
                                  <p className="font-black text-sm">Sim, são os mesmos alunos</p>
                                  <p className="text-3xs font-medium text-emerald-700 mt-0.5">
                                    Participam em ambos os horários (não duplica na soma do núcleo)
                                  </p>
                                </div>
                                {resp === "mesmos" && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMesmosAlunosRespostas((prev) => ({ ...prev, [p.key]: "diferentes" }));
                                  setConfirmouTotalFinal(false);
                                }}
                                className={`p-3.5 rounded-xl border-2 text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                                  resp === "diferentes"
                                    ? "border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-200"
                                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                <div>
                                  <p className="font-black text-sm">Não, são alunos diferentes</p>
                                  <p className="text-3xs font-medium text-sky-700 mt-0.5">
                                    Turmas com pessoas distintas (cada turma soma seus alunos)
                                  </p>
                                </div>
                                {resp === "diferentes" && <Check className="w-5 h-5 text-sky-600 shrink-0" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. SOMATÓRIO E CONFIRMAÇÃO DO TOTAL DE ALUNOS (RODAPÉ) */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 space-y-6">
                  <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      Somatório e Confirmação do Total de Alunos
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Confira a soma de alunos das turmas e confirme se o número total coincide com a realidade do núcleo:
                    </p>
                  </div>

                  {/* Caixas de Resumo do Somatório */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 shadow-2xs">
                      <span className="text-3xs font-bold text-zinc-500 uppercase tracking-wider block">
                        Alunos Somados nas Turmas
                      </span>
                      <strong className="text-2xl font-black text-sky-700 mt-0.5 block">
                        {totalVagasDistribuidas}
                      </strong>
                    </div>

                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 shadow-2xs">
                      <span className="text-3xs font-bold text-zinc-500 uppercase tracking-wider block">
                        Dedução de Mesmos Alunos
                      </span>
                      <strong className="text-2xl font-black text-amber-600 mt-0.5 block">
                        {totalDescontoMesmosAlunos > 0 ? `-${totalDescontoMesmosAlunos}` : "0"}
                      </strong>
                    </div>

                    <div className="bg-emerald-50/70 p-4 rounded-2xl border-2 border-emerald-300 shadow-2xs">
                      <span className="text-3xs font-bold text-emerald-800 uppercase tracking-wider block">
                        Total Geral do Núcleo
                      </span>
                      <strong className="text-2xl font-black text-emerald-800 mt-0.5 block">
                        {totalAlunosUnicosCenarioB} alunos
                      </strong>
                    </div>
                  </div>

                  {/* Botão de Confirmação do Professor */}
                  <button
                    type="button"
                    disabled={totalAlunosUnicosCenarioB <= 0}
                    onClick={() => setConfirmouTotalFinal(!confirmouTotalFinal)}
                    className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                      confirmouTotalFinal
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200 shadow-xs"
                        : totalAlunosUnicosCenarioB > 0
                        ? "bg-amber-50/60 border-amber-300 hover:border-amber-400 text-amber-950"
                        : "bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all ${
                          confirmouTotalFinal
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-amber-400 bg-white text-transparent"
                        }`}
                      >
                        {confirmouTotalFinal && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="font-black text-sm sm:text-base">
                          {totalAlunosUnicosCenarioB > 0
                            ? `Confirmo que o total de alunos atendidos no núcleo é ${totalAlunosUnicosCenarioB} ${totalAlunosUnicosCenarioB === 1 ? "aluno" : "alunos"}.`
                            : "Preencha a quantidade nas turmas acima para habilitar a confirmação."}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {confirmouTotalFinal
                            ? "Total confirmado pelo professor para envio oficial."
                            : "Clique aqui para confirmar que o somatório confere com o núcleo."}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Observações e Botão de Enviar */}
                  <div className="pt-4 border-t border-zinc-100 space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Observações adicionais (opcional):
                      </label>
                      <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Alguma turma com lista de espera, detalhe específico de horário ou observação sobre o núcleo?"
                        rows={3}
                        className="w-full p-3.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {erroEnvio && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{erroEnvio}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={enviando || totalAlunosUnicosCenarioB <= 0 || !confirmouTotalFinal}
                        onClick={handleSalvarCenarioB}
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        {enviando ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Enviando Conferência...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Finalizar e Enviar Conferência</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CENÁRIO A: PASSOS PROGRESSIVOS (NÚCLEOS COM ALUNOS CADASTRADOS) */}
            {temAlunos && !sucesso && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 space-y-6">
                {/* PASSO 1: TOTAL DE ALUNOS */}
                {passo === 1 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-zinc-100 pb-4">
                      <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">
                          1
                        </span>
                        Conferência do Total de Alunos
                      </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {temAlunos
                        ? "Confirme se o total de alunos cadastrados corresponde ao número real que treina com você."
                        : "Informe a quantidade média de alunos que você atende durante a semana neste núcleo."}
                    </p>
                  </div>

                  {temAlunos ? (
                    /* Cenário A: Conferir quantidade existente */
                    <div className="bg-sky-50/70 border-2 border-sky-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs uppercase tracking-wider font-bold text-sky-700">
                            Cadastrados no Sistema
                          </span>
                          <div className="text-3xl font-black text-zinc-900 mt-0.5">
                            {totalAlunosSistema} alunos
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-sky-200/60 flex items-center justify-center text-sky-800">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-sky-100">
                        <label className="block text-xs font-bold text-zinc-700">
                          Essa quantidade confere com a realidade do núcleo?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setTotalInformado(totalAlunosSistema);
                              setTotalConfirmado(true);
                            }}
                            className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                              totalConfirmado && totalInformado === totalAlunosSistema
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>SIM, CONFERE</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTotalConfirmado(false);
                            }}
                            className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                              !totalConfirmado
                                ? "bg-amber-500 text-white shadow-xs"
                                : "bg-white border-2 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            <span>DIFERENTE / EDITAR</span>
                          </button>
                        </div>

                        {!totalConfirmado && (
                          <div className="pt-3 animate-fadeIn space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-amber-900">
                              Informe a quantidade real atendida:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={500}
                              value={totalInformado || ""}
                              onChange={(e) => setTotalInformado(Number(e.target.value))}
                              placeholder="Ex: 95"
                              className="w-full h-12 px-4 rounded-xl border-2 border-amber-500 bg-white font-extrabold text-lg text-zinc-900 focus:outline-none focus:ring-4 focus:ring-amber-200"
                            />
                            <p className="text-3xs text-zinc-500">
                              *Seus alunos cadastrados continuam disponíveis para distribuição nas turmas.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Cenário B: Digitar total */
                    <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-zinc-900 mb-1">
                          Quantos alunos no total participam das aulas na semana? <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-xs text-zinc-500 mb-3">
                          Informe a soma estimada de alunos que frequentam seu núcleo.
                        </p>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={totalInformado || ""}
                          onChange={(e) => setTotalInformado(Number(e.target.value))}
                          placeholder="Ex: 80"
                          className="w-full h-13 px-4 rounded-xl border-2 border-amber-400 bg-white font-black text-xl text-zinc-900 focus:outline-none focus:ring-4 focus:ring-amber-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Botão de Avanço do Passo 1 */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={totalInformado <= 0}
                      onClick={() => setPasso(2)}
                      className="px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-all"
                    >
                      <span>Avançar para Distribuição na Grade</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2: DISTRIBUIÇÃO NA GRADE SEMANAL */}
              {passo === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      Distribuição de Vagas na Grade Semanal
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Defina a quantidade de vagas para cada turma. Turmas que se encontram em mais de um dia contam apenas alunos únicos.
                    </p>
                  </div>

                  {/* Resumo de Metas */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 font-medium">Alunos Totais a Distribuir:</span>
                      <strong className="text-sm font-black text-zinc-900 ml-1.5">{totalInformado}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-medium">Vagas Alocadas nas Turmas:</span>
                      <strong className="text-sm font-black text-sky-700 ml-1.5">{totalVagasDistribuidas}</strong>
                    </div>
                  </div>

                  {/* Lista de Turmas com Select de Vagas */}
                  <div className="space-y-3">
                    {turmas.map((t) => {
                      const vagas = vagasPorTurma[t.id] || 0;
                      return (
                        <div
                          key={t.id}
                          className="bg-white border-2 border-zinc-200 hover:border-sky-300 rounded-2xl p-4 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-3xs font-black rounded-md">
                                  Turma {t.identificador}
                                </span>
                                <h4 className="font-black text-sm text-zinc-900">{t.nome}</h4>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1">
                                Faixa Etária: <strong>{t.idadeMinima} a {t.idadeMaxima} anos</strong>
                              </p>
                            </div>

                            {/* Select de Quantidade até 150 */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <label className="text-xs font-bold text-zinc-600 whitespace-nowrap">
                                Vagas:
                              </label>
                              <select
                                value={vagas}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setVagasPorTurma((prev) => ({ ...prev, [t.id]: val }));
                                }}
                                className="h-10 px-3 rounded-xl border-2 border-sky-400 bg-white text-sm font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
                              >
                                {Array.from({ length: 151 }, (_, i) => (
                                  <option key={i} value={i}>
                                    {i} {i === 1 ? "aluno" : "alunos"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Horários desta Turma */}
                          <div className="bg-zinc-50 rounded-xl p-2.5 text-xs text-zinc-600 flex flex-wrap items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>
                              <strong>Dias e Horários:</strong> {t.diasResumo || "Dias a definir"} ({t.horarioResumo})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botões de Navegação do Passo 2 */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPasso(1)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Voltar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPasso(3)}
                      className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-all"
                    >
                      <span>Avançar para Alocação dos Alunos</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 3: ALOCAÇÃO DE ALUNOS (CENÁRIO A OU B) */}
              {passo === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      {temAlunos ? "Alocação Inteligente dos Alunos" : "Cadastro dos Alunos"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {temAlunos
                        ? "Clique em um horário da grade para ver os alunos sugeridos por faixa etária e alocar na turma."
                        : "Cadastre os alunos atendidos no seu núcleo para registrar a lista oficial da turma."}
                    </p>
                  </div>

                  {/* Informação contextual de status */}
                  <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 flex items-center justify-between">
                    <span>
                      {temAlunos
                        ? `Alunos alocados: ${totalAlunosAlocados} de ${beneficiarios.length}`
                        : `Alunos cadastrados: ${novosAlunos.length} de ${totalInformado}`}
                    </span>
                    <span className="font-bold">
                      {temAlunos && beneficiarios.length - totalAlunosAlocados > 0
                        ? `${beneficiarios.length - totalAlunosAlocados} pendentes de turma`
                        : "Turmas estruturadas"}
                    </span>
                  </div>

                  {/* Estrutura visual das Turmas do Passo 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {turmas.map((t) => {
                      const vagasMax = vagasPorTurma[t.id] || t.vagasTotais || 40;
                      const alocadosNesta = temAlunos
                        ? Object.values(alocacoes).filter((tId) => tId === t.id).length
                        : novosAlunos.filter((a) => a.turmaSugeridaId === t.id).length;
                      const pct = Math.min(100, Math.round((alocadosNesta / (vagasMax || 1)) * 100));

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setTurmaAtivaModalId(t.id);
                            setBuscaAlunoModal("");
                            setAbaModal("sugeridos");
                            if (!temAlunos) {
                              setNovaTurmaId(t.id);
                            }
                          }}
                          className="bg-white border-2 border-zinc-200 hover:border-sky-500 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md space-y-3 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-black rounded-lg">
                              Turma {t.identificador}
                            </span>
                            <span className={`text-xs font-black ${alocadosNesta >= vagasMax ? "text-emerald-700" : "text-zinc-600"}`}>
                              {alocadosNesta} / {vagasMax} vagas
                            </span>
                          </div>

                          {/* Barra de progresso de ocupação */}
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-sky-600" : "bg-zinc-200"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div>
                            <h4 className="font-black text-sm text-zinc-900 group-hover:text-sky-700 transition-colors">
                              {t.nome}
                            </h4>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              Faixa Etária: <strong>{t.idadeMinima} a {t.idadeMaxima} anos</strong>
                            </p>
                          </div>

                          <div className="text-3xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span><strong>Horário:</strong> {t.diasResumo} ({t.horarioResumo})</span>
                          </div>

                          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-sky-600">
                            <span>Toque para gerenciar alunos</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Seção Expansível: Lista Geral de Alunos do Núcleo (Cenário A) */}
                  {temAlunos && beneficiarios.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setMostrarListaGeral(!mostrarListaGeral)}
                        className="w-full p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left font-bold text-xs sm:text-sm text-zinc-800 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-sky-600" />
                          <span>Ver Lista Completa de Todos os Alunos ({beneficiarios.length})</span>
                        </div>
                        <span className="text-xs text-sky-600 font-extrabold">
                          {mostrarListaGeral ? "Ocultar lista ▲" : "Expandir lista ▼"}
                        </span>
                      </button>

                      {mostrarListaGeral && (
                        <div className="mt-3 p-4 bg-white border border-zinc-200 rounded-2xl space-y-4 animate-fadeIn">
                          {/* Filtros da lista geral */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Buscar aluno por nome..."
                                value={buscaListaGeral}
                                onChange={(e) => setBuscaListaGeral(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-sky-500 bg-zinc-50"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {(["todos", "pendentes", "alocados"] as const).map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setFiltroListaGeral(f)}
                                  className={`px-3 py-2 rounded-xl text-3xs font-bold transition-all ${
                                    filtroListaGeral === f
                                      ? "bg-sky-600 text-white"
                                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                  }`}
                                >
                                  {f === "todos" && "Todos"}
                                  {f === "pendentes" && "Sem Turma"}
                                  {f === "alocados" && "Alocados"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Lista dos alunos */}
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-100">
                            {beneficiarios
                              .filter((b) => {
                                const matchNome = (b.nomeCompleto || "")
                                  .toLowerCase()
                                  .includes(buscaListaGeral.toLowerCase());
                                const isAlocado = Boolean(alocacoes[b.id]);
                                if (filtroListaGeral === "pendentes") return matchNome && !isAlocado;
                                if (filtroListaGeral === "alocados") return matchNome && isAlocado;
                                return matchNome;
                              })
                              .map((b) => {
                                const turmaIdAtual = alocacoes[b.id];
                                const turmaAtual = turmas.find((t) => t.id === turmaIdAtual);
                                const turmaSugerida = getTurmaSugerida(b.idade);

                                return (
                                  <div
                                    key={b.id}
                                    className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-zinc-900 flex items-center gap-2">
                                        <span>{b.nomeCompleto}</span>
                                        <span className="text-3xs text-zinc-500 font-medium">
                                          ({b.idade !== null ? `${b.idade} anos` : "Sem idade"})
                                        </span>
                                      </div>
                                      <p className="text-3xs text-zinc-500">
                                        {turmaSugerida
                                          ? `Sugestão: ${turmaSugerida.nome}`
                                          : "Faixa etária não corresponde diretamente"}
                                      </p>
                                    </div>

                                    {/* Seletor direto de turma */}
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={turmaIdAtual || ""}
                                        onChange={(e) => {
                                          const novoId = e.target.value;
                                          setAlocacoes((prev) => {
                                            if (!novoId) {
                                              const copy = { ...prev };
                                              delete copy[b.id];
                                              return copy;
                                            }
                                            return { ...prev, [b.id]: novoId };
                                          });
                                        }}
                                        className={`h-9 px-2 rounded-xl text-xs font-bold border ${
                                          turmaIdAtual
                                            ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                            : "border-zinc-300 bg-white text-zinc-700"
                                        }`}
                                      >
                                        <option value="">-- Sem Turma (Pendente) --</option>
                                        {turmas.map((t) => (
                                          <option key={t.id} value={t.id}>
                                            Turma {t.identificador} ({t.idadeMinima} a {t.idadeMaxima}a)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seção Cenário B: Formulário de Cadastro Rápido e Lista de Alunos */}
                  {!temAlunos && (
                    <div className="space-y-6 pt-2">
                      {/* Card do Formulário de Cadastro Rápido */}
                      <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                              <UserPlus className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-zinc-900">
                                Cadastro Rápido de Aluno
                              </h4>
                              <p className="text-3xs text-zinc-500">
                                Preencha os dados básicos para registrar os alunos atendidos no núcleo
                              </p>
                            </div>
                          </div>
                          <span className="text-3xs font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 w-fit">
                            {novosAlunos.length} de {totalInformado} cadastrados
                          </span>
                        </div>

                        {erroFormNovo && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{erroFormNovo}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Nome Completo */}
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                              Nome Completo do Aluno *
                            </label>
                            <input
                              type="text"
                              value={novoNome}
                              onChange={(e) => setNovoNome(e.target.value)}
                              placeholder="Ex: JOÃO PEDRO SILVA"
                              className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>

                          {/* Data de Nascimento */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                                Data de Nascimento *
                              </label>
                              {idadeCalculadaForm !== null && (
                                <span className="text-3xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                  {idadeCalculadaForm} anos
                                </span>
                              )}
                            </div>
                            <input
                              type="date"
                              value={novaDataNasc}
                              onChange={(e) => setNovaDataNasc(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>

                          {/* Sexo */}
                          <div className="space-y-1">
                            <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                              Sexo *
                            </label>
                            <div className="grid grid-cols-2 gap-2 h-10">
                              <button
                                type="button"
                                onClick={() => setNovoSexo("M")}
                                className={`rounded-xl text-xs font-bold border transition-all ${
                                  novoSexo === "M"
                                    ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                Masculino (M)
                              </button>
                              <button
                                type="button"
                                onClick={() => setNovoSexo("F")}
                                className={`rounded-xl text-xs font-bold border transition-all ${
                                  novoSexo === "F"
                                    ? "bg-pink-600 text-white border-pink-600 shadow-2xs"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                Feminino (F)
                              </button>
                            </div>
                          </div>

                          {/* CPF (Opcional) */}
                          <div className="space-y-1">
                            <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                              CPF (opcional)
                            </label>
                            <input
                              type="text"
                              value={novoCpf}
                              onChange={(e) => setNovoCpf(e.target.value)}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>

                          {/* Turma Destino */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                                Turma de Destino *
                              </label>
                              {turmaSugeridaForm && (
                                <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  Sugerida por idade
                                </span>
                              )}
                            </div>
                            <select
                              value={novaTurmaId || (turmaSugeridaForm?.id || "")}
                              onChange={(e) => setNovaTurmaId(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-800 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            >
                              {turmas.map((t) => (
                                <option key={t.id} value={t.id}>
                                  Turma {t.identificador} ({t.idadeMinima} a {t.idadeMaxima}a) - {t.diasResumo}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Botão de Adicionar */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleAdicionarAlunoNovo}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Adicionar Aluno à Lista</span>
                          </button>
                        </div>
                      </div>

                      {/* Lista de Alunos Cadastrados */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-sky-600" />
                            <h4 className="font-black text-sm text-zinc-900">
                              Alunos Cadastrados no Núcleo ({novosAlunos.length})
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-zinc-500">
                            Meta informada: {totalInformado}
                          </span>
                        </div>

                        {novosAlunos.length === 0 ? (
                          <div className="py-8 text-center text-zinc-400 space-y-1 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <UserPlus className="w-8 h-8 mx-auto text-zinc-300" />
                            <p className="text-xs font-bold text-zinc-600">
                              Nenhum aluno cadastrado ainda.
                            </p>
                            <p className="text-3xs text-zinc-400">
                              Utilize o formulário acima para adicionar os alunos participantes.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                            {novosAlunos.map((aluno, idx) => {
                              const turmaAlocada = turmas.find((t) => t.id === aluno.turmaSugeridaId);
                              const idade = calcularIdadeData(aluno.dataNascimento);

                              return (
                                <div
                                  key={aluno.idTemp}
                                  className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-3xs font-black flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="font-black text-xs sm:text-sm text-zinc-900">
                                        {aluno.nomeCompleto}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-3xs font-extrabold ${
                                          aluno.sexo === "M"
                                            ? "bg-sky-100 text-sky-800"
                                            : "bg-pink-100 text-pink-800"
                                        }`}
                                      >
                                        {aluno.sexo}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-3xs text-zinc-500">
                                      <span>
                                        Nasc: {aluno.dataNascimento} ({idade !== null ? `${idade} anos` : "Idade N/D"})
                                      </span>
                                      {aluno.cpf && <span>• CPF: {aluno.cpf}</span>}
                                      {turmaAlocada && (
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                          Turma {turmaAlocada.identificador} ({turmaAlocada.diasResumo})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    <select
                                      value={aluno.turmaSugeridaId || ""}
                                      onChange={(e) => {
                                        const novaId = e.target.value;
                                        setNovosAlunos((prev) =>
                                          prev.map((item) =>
                                            item.idTemp === aluno.idTemp
                                              ? { ...item, turmaSugeridaId: novaId }
                                              : item
                                          )
                                        );
                                      }}
                                      className="h-8 px-2 rounded-xl text-3xs font-bold border border-zinc-300 bg-white text-zinc-700"
                                    >
                                      {turmas.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          Turma {t.identificador}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNovosAlunos((prev) =>
                                          prev.filter((item) => item.idTemp !== aluno.idTemp)
                                        );
                                      }}
                                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                      title="Remover aluno"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODAL INTELIGENTE DE ALOCAÇÃO POR TURMA */}
                  {turmaAtivaModalId && (() => {
                    const turmaAtiva = turmas.find((t) => t.id === turmaAtivaModalId);
                    if (!turmaAtiva) return null;

                    const vagasMax = vagasPorTurma[turmaAtiva.id] || turmaAtiva.vagasTotais || 40;

                    if (!temAlunos) {
                      const alunosNestaTurma = novosAlunos.filter(
                        (a) => a.turmaSugeridaId === turmaAtiva.id
                      );
                      const termo = buscaAlunoModal.toLowerCase();
                      const alunosFiltrados = alunosNestaTurma.filter((a) =>
                        a.nomeCompleto.toLowerCase().includes(termo)
                      );

                      return (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
                          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
                            <div className="p-5 border-b border-zinc-100 flex items-start justify-between gap-3 bg-gradient-to-r from-amber-50 to-white">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white text-3xs font-black uppercase">
                                    Turma {turmaAtiva.identificador}
                                  </span>
                                  <span className="text-xs font-bold text-zinc-500">
                                    {alunosNestaTurma.length} de {vagasMax} vagas preenchidas
                                  </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-zinc-900 mt-1">
                                  {turmaAtiva.nome}
                                </h3>
                                <p className="text-xs text-zinc-600 mt-0.5">
                                  Faixa etária: <strong>{turmaAtiva.idadeMinima} a {turmaAtiva.idadeMaxima} anos</strong> • Horário: <strong>{turmaAtiva.diasResumo} ({turmaAtiva.horarioResumo})</strong>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTurmaAtivaModalId(null)}
                                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 space-y-3">
                              <div className="relative">
                                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder="Buscar aluno nesta turma..."
                                  value={buscaAlunoModal}
                                  onChange={(e) => setBuscaAlunoModal(e.target.value)}
                                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>

                            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
                              {alunosFiltrados.length === 0 ? (
                                <div className="py-8 text-center text-zinc-400 space-y-1">
                                  <Users className="w-8 h-8 mx-auto text-zinc-300" />
                                  <p className="text-xs font-bold text-zinc-600">
                                    Nenhum aluno cadastrado para esta turma.
                                  </p>
                                  <p className="text-3xs text-zinc-400">
                                    Cadastre alunos no formulário da página principal atribuindo à Turma {turmaAtiva.identificador}.
                                  </p>
                                </div>
                              ) : (
                                alunosFiltrados.map((aluno) => {
                                  const idade = calcularIdadeData(aluno.dataNascimento);
                                  return (
                                    <div
                                      key={aluno.idTemp}
                                      className="p-3.5 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                                    >
                                      <div>
                                        <div className="font-black text-sm text-zinc-900 flex items-center gap-2">
                                          <span>{aluno.nomeCompleto}</span>
                                          <span className="text-3xs px-1.5 py-0.5 rounded bg-zinc-100 font-bold text-zinc-700">
                                            {aluno.sexo}
                                          </span>
                                        </div>
                                        <p className="text-3xs text-zinc-500 mt-0.5">
                                          Nasc: {aluno.dataNascimento} ({idade !== null ? `${idade} anos` : "Idade N/D"}) {aluno.cpf ? `• CPF: ${aluno.cpf}` : ""}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNovosAlunos((prev) =>
                                            prev.filter((a) => a.idTemp !== aluno.idTemp)
                                          );
                                        }}
                                        className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                        title="Remover da turma"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                              <span className="text-xs text-zinc-500">
                                {alunosNestaTurma.length} alunos nesta turma
                              </span>
                              <button
                                type="button"
                                onClick={() => setTurmaAtivaModalId(null)}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                Fechar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const alunosNestaTurma = beneficiarios.filter(
                      (b) => alocacoes[b.id] === turmaAtiva.id
                    );
                    const alunosSugeridos = beneficiarios.filter(
                      (b) =>
                        !alocacoes[b.id] &&
                        b.idade !== null &&
                        b.idade >= turmaAtiva.idadeMinima &&
                        b.idade <= turmaAtiva.idadeMaxima
                    );
                    const outrosSemTurma = beneficiarios.filter(
                      (b) =>
                        !alocacoes[b.id] &&
                        (b.idade === null ||
                          b.idade < turmaAtiva.idadeMinima ||
                          b.idade > turmaAtiva.idadeMaxima)
                    );

                    // Filtragem por busca
                    const termo = buscaAlunoModal.toLowerCase();
                    const alunosSugeridosFiltrados = alunosSugeridos.filter((b) =>
                      b.nomeCompleto.toLowerCase().includes(termo)
                    );
                    const alunosNestaFiltrados = alunosNestaTurma.filter((b) =>
                      b.nomeCompleto.toLowerCase().includes(termo)
                    );
                    const outrosSemTurmaFiltrados = outrosSemTurma.filter((b) =>
                      b.nomeCompleto.toLowerCase().includes(termo)
                    );

                    return (
                      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
                          {/* Cabeçalho do Modal */}
                          <div className="p-5 border-b border-zinc-100 flex items-start justify-between gap-3 bg-gradient-to-r from-sky-50 to-white">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-sky-600 text-white text-3xs font-black uppercase">
                                  Turma {turmaAtiva.identificador}
                                </span>
                                <span className="text-xs font-bold text-zinc-500">
                                  {alunosNestaTurma.length} de {vagasMax} vagas preenchidas
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-black text-zinc-900 mt-1">
                                {turmaAtiva.nome}
                              </h3>
                              <p className="text-xs text-zinc-600 mt-0.5">
                                Faixa etária: <strong>{turmaAtiva.idadeMinima} a {turmaAtiva.idadeMaxima} anos</strong> • Horário: <strong>{turmaAtiva.diasResumo} ({turmaAtiva.horarioResumo})</strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setTurmaAtivaModalId(null)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Abas e Busca do Modal */}
                          <div className="p-4 border-b border-zinc-100 space-y-3 bg-zinc-50/50">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              <button
                                type="button"
                                onClick={() => setAbaModal("sugeridos")}
                                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                  abaModal === "sugeridos"
                                    ? "bg-sky-600 text-white shadow-2xs"
                                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Sugeridos por Idade ({alunosSugeridos.length})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setAbaModal("alocados")}
                                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                  abaModal === "alocados"
                                    ? "bg-sky-600 text-white shadow-2xs"
                                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Já na Turma ({alunosNestaTurma.length})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setAbaModal("todos")}
                                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                  abaModal === "todos"
                                    ? "bg-sky-600 text-white shadow-2xs"
                                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                }`}
                              >
                                <span>Outros sem Turma ({outrosSemTurma.length})</span>
                              </button>
                            </div>

                            {/* Campo de Busca Rápida */}
                            <div className="relative">
                              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Buscar aluno por nome..."
                                value={buscaAlunoModal}
                                onChange={(e) => setBuscaAlunoModal(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            </div>

                            {/* Botão de Alocação Rápida em Lote (1-clique) */}
                            {abaModal === "sugeridos" && alunosSugeridosFiltrados.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAlocacoes((prev) => {
                                    const copy = { ...prev };
                                    alunosSugeridosFiltrados.forEach((aluno) => {
                                      copy[aluno.id] = turmaAtiva.id;
                                    });
                                    return copy;
                                  });
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Alocar todos os {alunosSugeridosFiltrados.length} alunos compatíveis nesta turma</span>
                              </button>
                            )}
                          </div>

                          {/* Lista com Rolagem dos Alunos */}
                          <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
                            {/* ABA: SUGERIDOS POR IDADE */}
                            {abaModal === "sugeridos" && (
                              alunosSugeridosFiltrados.length === 0 ? (
                                <div className="py-10 text-center text-zinc-400 space-y-2">
                                  <Users className="w-8 h-8 mx-auto text-zinc-300" />
                                  <p className="text-xs font-bold text-zinc-600">
                                    Nenhum aluno pendente na faixa de {turmaAtiva.idadeMinima} a {turmaAtiva.idadeMaxima} anos.
                                  </p>
                                  <p className="text-3xs text-zinc-400">
                                    Consulte a aba "Outros sem Turma" para matricular alunos de outras faixas.
                                  </p>
                                </div>
                              ) : (
                                alunosSugeridosFiltrados.map((aluno) => (
                                  <div
                                    key={aluno.id}
                                    className="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-sm text-zinc-900">
                                          {aluno.nomeCompleto}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800">
                                          {aluno.idade !== null ? `${aluno.idade} anos` : "Idade N/D"}
                                        </span>
                                        {aluno.pcd && (
                                          <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-3xs font-bold">
                                            PcD
                                          </span>
                                        )}
                                      </div>
                                      {/* Mensagem de proposta inteligente solicitada */}
                                      <p className="text-xs text-emerald-900 font-medium flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>
                                          Pela idade ({aluno.idade} anos), esse aluno poderia participar da <strong>Turma {turmaAtiva.identificador}</strong> ({turmaAtiva.diasResumo} das {turmaAtiva.horarioResumo}).
                                        </span>
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAlocacoes((prev) => ({ ...prev, [aluno.id]: turmaAtiva.id }));
                                      }}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs shrink-0 transition-all cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>Alocar nesta Turma</span>
                                    </button>
                                  </div>
                                ))
                              )
                            )}

                            {/* ABA: ALUNOS JÁ NA TURMA */}
                            {abaModal === "alocados" && (
                              alunosNestaFiltrados.length === 0 ? (
                                <div className="py-10 text-center text-zinc-400 space-y-2">
                                  <Users className="w-8 h-8 mx-auto text-zinc-300" />
                                  <p className="text-xs font-bold text-zinc-600">
                                    Nenhum aluno alocado nesta turma ainda.
                                  </p>
                                </div>
                              ) : (
                                alunosNestaFiltrados.map((aluno) => (
                                  <div
                                    key={aluno.id}
                                    className="p-3.5 rounded-2xl border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                  >
                                    <div>
                                      <div className="font-black text-sm text-zinc-900 flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                                        <span>{aluno.nomeCompleto}</span>
                                        <span className="text-3xs text-zinc-500 font-medium">
                                          ({aluno.idade !== null ? `${aluno.idade} anos` : "Idade N/D"})
                                        </span>
                                      </div>
                                      <p className="text-3xs text-zinc-400 mt-0.5">
                                        Matrícula: {aluno.matricula || "N/D"}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAlocacoes((prev) => {
                                          const copy = { ...prev };
                                          delete copy[aluno.id];
                                          return copy;
                                        });
                                      }}
                                      className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shrink-0 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remover da Turma</span>
                                    </button>
                                  </div>
                                ))
                              )
                            )}

                            {/* ABA: OUTROS ALUNOS SEM TURMA */}
                            {abaModal === "todos" && (
                              outrosSemTurmaFiltrados.length === 0 ? (
                                <div className="py-10 text-center text-zinc-400 space-y-2">
                                  <Check className="w-8 h-8 mx-auto text-emerald-400" />
                                  <p className="text-xs font-bold text-zinc-600">
                                    Não há outros alunos sem turma no núcleo.
                                  </p>
                                </div>
                              ) : (
                                outrosSemTurmaFiltrados.map((aluno) => {
                                  const outraTurma = getTurmaSugerida(aluno.idade);
                                  return (
                                    <div
                                      key={aluno.id}
                                      className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                                          <span>{aluno.nomeCompleto}</span>
                                          <span className="text-3xs font-extrabold bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full">
                                            {aluno.idade !== null ? `${aluno.idade} anos` : "Sem idade"}
                                          </span>
                                        </div>
                                        <p className="text-3xs text-zinc-500">
                                          {outraTurma
                                            ? `Idade fora da faixa principal (${turmaAtiva.idadeMinima}-${turmaAtiva.idadeMaxima}a). Recomendado: ${outraTurma.nome}`
                                            : "Idade fora das faixas cadastradas no núcleo"}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAlocacoes((prev) => ({ ...prev, [aluno.id]: turmaAtiva.id }));
                                        }}
                                        className="px-3.5 py-1.5 border border-zinc-300 hover:border-sky-500 bg-white hover:bg-sky-50 text-zinc-700 hover:text-sky-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shrink-0 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Alocar nesta Turma (Exceção)</span>
                                      </button>
                                    </div>
                                  );
                                })
                              )
                            )}
                          </div>

                          {/* Rodapé do Modal */}
                          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                            <span className="text-xs text-zinc-500">
                              {alunosNestaTurma.length} alunos alocados
                            </span>
                            <button
                              type="button"
                              onClick={() => setTurmaAtivaModalId(null)}
                              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              Concluir Turma {turmaAtiva.identificador}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Observações finais */}
                  <div className="space-y-1.5 pt-4">
                    <label className="block text-xs font-bold text-zinc-700">
                      Observações adicionais (opcional):
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Alguma turma com lista de espera, detalhe específico de horário ou observação sobre os alunos?"
                      rows={3}
                      className="w-full p-3 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {erroEnvio && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{erroEnvio}</span>
                    </div>
                  )}

                  {/* Botões de Envio do Passo 3 */}
                  <div className="pt-4 flex items-center justify-between border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setPasso(2)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Voltar para Grade</span>
                    </button>

                    <button
                      type="button"
                      disabled={enviando}
                      onClick={async () => {
                        try {
                          setEnviando(true);
                          setErroEnvio(null);

                          const res = await fetch("/api/conferencia-beneficiarios", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              nucleoId: nucleo.id,
                              nucleoNome: nucleo.identificacao,
                              professorNome: professorNome || null,
                              temAlunosPreExistentes: temAlunos,
                              totalAlunosSistema,
                              totalAlunosInformado: totalInformado,
                              distribuicaoTurmas: vagasPorTurma,
                              alocacoesAlunos: alocacoes,
                              novosAlunosCadastrados: novosAlunos,
                              observacoes,
                            }),
                          });

                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Erro ao salvar resposta.");

                          setSucesso(true);
                          setPasso(4);
                        } catch (err: any) {
                          setErroEnvio(err.message || "Erro ao enviar respostas.");
                        } finally {
                          setEnviando(false);
                        }
                      }}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-sm transition-all"
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Finalizar e Enviar Conferência</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              </div>
            )}

            {/* CONFIRMAÇÃO DE SUCESSO (CENÁRIOS A E B) */}
            {(sucesso || passo === 4) && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200">
                <div className="text-center py-8 space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">
                    Conferência Registrada com Sucesso!
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
                    Muito obrigado! Os dados de alunos e turmas do núcleo <strong>{nucleo?.identificacao}</strong> foram gravados com segurança para auditoria e conferência oficial.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPasso(1);
                        setSucesso(false);
                        carregarDados();
                      }}
                      className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-xs font-bold text-zinc-700 cursor-pointer"
                    >
                      Revisar Respostas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
