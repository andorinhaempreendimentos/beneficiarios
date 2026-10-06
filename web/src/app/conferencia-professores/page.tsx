"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  School,
  AlertCircle,
  Loader2,
  Check,
  Send,
  Plus,
  Trash2,
  Lock,
  Pencil,
} from "lucide-react";

interface Nucleo {
  id: string;
  identificacao: string;
  nome_local?: string;
}

interface Professor {
  id: string;
  nome_completo: string;
  nucleo_id?: string;
}

interface Atividade {
  id: string;
  nome: string;
}

const DIAS_SEMANA_LISTA = [
  { id: "Seg", nome: "Segunda-feira", curto: "Seg" },
  { id: "Ter", nome: "Terça-feira", curto: "Ter" },
  { id: "Qua", nome: "Quarta-feira", curto: "Qua" },
  { id: "Qui", nome: "Quinta-feira", curto: "Qui" },
  { id: "Sex", nome: "Sexta-feira", curto: "Sex" },
  { id: "Sab", nome: "Sábado", curto: "Sáb" },
  { id: "Dom", nome: "Domingo", curto: "Dom" },
];

const IDADES_OPCOES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

interface AulaItem {
  id: string;
  inicio: string;
  fim: string;
  idadeMin: number;
  idadeMax: number;
}

function timeToMinutes(t: string): number {
  if (!t || !t.includes(":")) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getErrosAula(diaId: string, aulaIndex: number, aulas: AulaItem[]): string[] {
  const aula = aulas[aulaIndex];
  if (!aula) return [];
  const erros: string[] = [];

  const tInicio = timeToMinutes(aula.inicio);
  const tFim = timeToMinutes(aula.fim);

  if (!aula.inicio || !aula.fim) {
    erros.push("Horário de início e término são obrigatórios.");
  } else if (tFim <= tInicio) {
    erros.push("Horário de término deve ser mais tarde que o início.");
  }

  if (aulaIndex > 0) {
    const anterior = aulas[aulaIndex - 1];
    const tFimAnterior = timeToMinutes(anterior.fim);
    if (tInicio < tFimAnterior) {
      erros.push(`Horário de início sobrepõe a aula anterior (que termina às ${anterior.fim}).`);
    }
  }

  if (Number(aula.idadeMin) > Number(aula.idadeMax)) {
    erros.push("Idade mínima não pode ser maior que a idade máxima.");
  }

  return erros;
}

export default function ConferenciaProfessoresPage() {
  const [loadingDados, setLoadingDados] = useState(true);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  // Passos: 1 (Identificação), 2 (Dias da semana), 3 (Aulas de cada dia), 4 (Sucesso)
  const [passo, setPasso] = useState<number>(1);

  // Passo 1: Identificação
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("");
  const [professorSelecionadoId, setProfessorSelecionadoId] = useState<string>("");
  const [professorNomeManual, setProfessorNomeManual] = useState<string>("");
  const [modalidade, setModalidade] = useState<string>("Futebol de Campo");
  const [modalidadeManual, setModalidadeManual] = useState<string>("");

  // Passo 2: Dias da semana selecionados
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(["Seg", "Qua", "Sex"]);

  // Passo 3: Mapa de aulas por dia (diaId -> lista de aulas)
  const [aulasPorDia, setAulasPorDia] = useState<Record<string, AulaItem[]>>({
    Seg: [{ id: "1", inicio: "08:00", fim: "09:30", idadeMin: 8, idadeMax: 11 }],
    Qua: [{ id: "1", inicio: "08:00", fim: "09:30", idadeMin: 8, idadeMax: 11 }],
    Sex: [{ id: "1", inicio: "08:00", fim: "09:30", idadeMin: 8, idadeMax: 11 }],
  });

  // Passo 3: Controle sequencial de dias (apenas 1 dia aberto por vez)
  const [diaAtivoIndex, setDiaAtivoIndex] = useState<number>(0);
  const [diasConfirmados, setDiasConfirmados] = useState<string[]>([]);

  // Observações gerais e status de envio
  const [observacoes, setObservacoes] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);

  // Carregar dados de núcleos e professores
  useEffect(() => {
    async function carregar() {
      try {
        setLoadingDados(true);
        const res = await fetch("/api/conferencia-professores");
        const data = await res.json();
        if (data.nucleos) setNucleos(data.nucleos);
        if (data.professores) setProfessores(data.professores);
        if (data.atividades) setAtividades(data.atividades);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoadingDados(false);
      }
    }
    carregar();
  }, []);

  // Professores disponíveis para o núcleo selecionado
  const professoresDoNucleo = useMemo(() => {
    if (!nucleoSelecionadoId) return professores;
    const filtrados = professores.filter((p) => p.nucleo_id === nucleoSelecionadoId);
    return filtrados.length > 0 ? filtrados : professores;
  }, [nucleoSelecionadoId, professores]);

  // Toggle de seleção do dia da semana
  const toggleDia = (diaId: string) => {
    setDiasSelecionados((prev) => {
      const existe = prev.includes(diaId);
      if (existe) {
        setDiasConfirmados((conf) => conf.filter((d) => d !== diaId));
        return prev.filter((d) => d !== diaId);
      } else {
        setAulasPorDia((aulas) => {
          if (!aulas[diaId] || aulas[diaId].length === 0) {
            return {
              ...aulas,
              [diaId]: [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  inicio: "08:00",
                  fim: "09:30",
                  idadeMin: 8,
                  idadeMax: 11,
                },
              ],
            };
          }
          return aulas;
        });
        return [...prev, diaId];
      }
    });
  };

  // Validação de todas as aulas de um dia
  const validarDia = (diaId: string): boolean => {
    const aulas = aulasPorDia[diaId] || [];
    if (aulas.length === 0) return false;
    for (let i = 0; i < aulas.length; i++) {
      const erros = getErrosAula(diaId, i, aulas);
      if (erros.length > 0) return false;
    }
    return true;
  };

  // Confirmar aulas do dia e avançar para o próximo dia
  const confirmarDiaEAvancar = (diaId: string, idxAtual: number) => {
    if (!validarDia(diaId)) return;

    setDiasConfirmados((prev) => (prev.includes(diaId) ? prev : [...prev, diaId]));

    // Procura o próximo dia ainda não confirmado a partir do atual
    const proximoNaoConfirmado = diasSelecionados.findIndex(
      (d, i) => i > idxAtual && !diasConfirmados.includes(d)
    );

    if (proximoNaoConfirmado !== -1) {
      setDiaAtivoIndex(proximoNaoConfirmado);
    } else if (idxAtual + 1 < diasSelecionados.length && !diasConfirmados.includes(diasSelecionados[idxAtual + 1])) {
      setDiaAtivoIndex(idxAtual + 1);
    } else {
      // Se todos os outros já foram confirmados ou é o último dia
      setDiaAtivoIndex(-1);
    }
  };

  // Reabrir dia confirmado para edição
  const editarDia = (diaId: string, idx: number) => {
    setDiasConfirmados((prev) => prev.filter((d) => d !== diaId));
    setDiaAtivoIndex(idx);
  };

  // Conferir se a última aula do dia está válida para permitir adicionar outra aula
  const podeAdicionarNovaAula = (diaId: string): boolean => {
    const aulas = aulasPorDia[diaId] || [];
    if (aulas.length === 0) return true;
    const indexUltima = aulas.length - 1;
    const erros = getErrosAula(diaId, indexUltima, aulas);
    return erros.length === 0;
  };

  // Adicionar aula a um dia específico
  const adicionarAulaNoDia = (diaId: string) => {
    if (!podeAdicionarNovaAula(diaId)) return;

    setAulasPorDia((prev) => {
      const listaAtual = prev[diaId] || [];
      const ultimaAula = listaAtual[listaAtual.length - 1];
      const proximoInicio = ultimaAula?.fim || "09:30";

      // Calcula fim estimado + 1h30
      const partes = proximoInicio.split(":");
      let novoFim = "11:00";
      if (partes.length === 2) {
        const hora = parseInt(partes[0], 10);
        const min = parseInt(partes[1], 10);
        const totalMin = hora * 60 + min + 90;
        const horaFim = Math.floor(totalMin / 60) % 24;
        const minFim = totalMin % 60;
        novoFim = `${String(horaFim).padStart(2, "0")}:${String(minFim).padStart(2, "0")}`;
      }

      const idadeMinSugerida = ultimaAula?.idadeMax ? Math.min(21, Number(ultimaAula.idadeMax)) : 12;
      const idadeMaxSugerida = Math.min(21, idadeMinSugerida + 3);

      const novaAula: AulaItem = {
        id: Math.random().toString(36).substring(2, 9),
        inicio: proximoInicio,
        fim: novoFim,
        idadeMin: idadeMinSugerida,
        idadeMax: idadeMaxSugerida,
      };

      return {
        ...prev,
        [diaId]: [...listaAtual, novaAula],
      };
    });
  };

  // Remover aula de um dia específico
  const removerAulaDoDia = (diaId: string, aulaId: string) => {
    setAulasPorDia((prev) => {
      const listaAtual = prev[diaId] || [];
      if (listaAtual.length <= 1) return prev; // Mantém pelo menos 1 aula
      return {
        ...prev,
        [diaId]: listaAtual.filter((a) => a.id !== aulaId),
      };
    });
  };

  // Atualizar campo de uma aula em um dia
  const updateAulaCampo = (
    diaId: string,
    aulaId: string,
    campo: keyof AulaItem,
    valor: any
  ) => {
    setAulasPorDia((prev) => ({
      ...prev,
      [diaId]: (prev[diaId] || []).map((a) => {
        if (a.id !== aulaId) return a;
        if (campo === "idadeMin") {
          const novaMin = Number(valor);
          const maxAtual = Number(a.idadeMax);
          return {
            ...a,
            idadeMin: novaMin,
            idadeMax: maxAtual < novaMin ? novaMin : a.idadeMax,
          };
        }
        if (campo === "idadeMax") {
          const novaMax = Number(valor);
          const minAtual = Number(a.idadeMin);
          return {
            ...a,
            idadeMax: novaMax,
            idadeMin: minAtual > novaMax ? novaMax : a.idadeMin,
          };
        }
        return { ...a, [campo]: valor };
      }),
    }));
  };

  // Identificação e nomes finais
  const nucleoNomeFinal = useMemo(() => {
    if (!nucleoSelecionadoId) return "";
    const n = nucleos.find((item) => item.id === nucleoSelecionadoId);
    return n ? n.identificacao : "";
  }, [nucleoSelecionadoId, nucleos]);

  const professorNomeFinal = useMemo(() => {
    if (professorSelecionadoId === "outro") return professorNomeManual.trim();
    if (!professorSelecionadoId) return "";
    const p = professores.find((item) => item.id === professorSelecionadoId);
    return p ? p.nome_completo : "";
  }, [professorSelecionadoId, professorNomeManual, professores]);

  const modalidadeFinal = useMemo(() => {
    if (modalidade === "Outra") return modalidadeManual.trim();
    return modalidade;
  }, [modalidade, modalidadeManual]);

  // Validações dos passos
  const podeAvancarPasso1 = Boolean(
    nucleoNomeFinal && professorNomeFinal && modalidadeFinal
  );

  const podeAvancarPasso2 = diasSelecionados.length > 0;

  // Validação geral do Passo 3 para envio (todos os dias devem estar confirmados e válidos)
  const podeEnviarPasso3 = useMemo(() => {
    if (diasSelecionados.length === 0) return false;
    const todosConfirmados = diasSelecionados.every((d) => diasConfirmados.includes(d));
    if (!todosConfirmados) return false;
    for (const diaId of diasSelecionados) {
      if (!validarDia(diaId)) return false;
    }
    return true;
  }, [diasSelecionados, diasConfirmados, aulasPorDia]);

  // Total geral de aulas na semana
  const totalAulasSemana = useMemo(() => {
    return diasSelecionados.reduce((acc, diaId) => acc + (aulasPorDia[diaId]?.length || 0), 0);
  }, [diasSelecionados, aulasPorDia]);

  // Enviar formulário
  const handleSubmit = async () => {
    try {
      setEnviando(true);
      setErroEnvio(null);

      const aulasFormatadasPorDia: Record<string, any[]> = {};
      diasSelecionados.forEach((diaId) => {
        const diaNome = DIAS_SEMANA_LISTA.find((d) => d.id === diaId)?.nome || diaId;
        const aulas = aulasPorDia[diaId] || [];
        aulasFormatadasPorDia[diaNome] = aulas.map((a, index) => ({
          aula_numero: index + 1,
          horario_inicio: a.inicio,
          horario_fim: a.fim,
          idade_minima: Number(a.idadeMin),
          idade_maxima: Number(a.idadeMax),
        }));
      });

      const payloadDados = {
        dias_semana: diasSelecionados.map(
          (d) => DIAS_SEMANA_LISTA.find((item) => item.id === d)?.nome || d
        ),
        total_aulas_semana: totalAulasSemana,
        aulas_por_dia: aulasFormatadasPorDia,
      };

      const res = await fetch("/api/conferencia-professores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nucleoId: nucleoSelecionadoId,
          nucleoNome: nucleoNomeFinal,
          professorId: professorSelecionadoId !== "outro" ? professorSelecionadoId : null,
          professorNome: professorNomeFinal,
          modalidadeId: null,
          modalidadeNome: modalidadeFinal,
          qtdTurmas: totalAulasSemana,
          dadosTurmas: payloadDados,
          observacoes: observacoes.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar resposta no servidor.");
      }

      setSucesso(true);
      setPasso(4);
    } catch (err: any) {
      console.error(err);
      setErroEnvio(err.message || "Ocorreu um erro ao enviar suas respostas. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-zinc-50 to-white text-zinc-900 pb-20">
      {/* Top Banner */}
      <header className="bg-sky-700 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <School className="w-7 h-7 text-sky-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-sky-200">
                Escolinhas de Inclusão e Cidadania
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                Conferência de Aulas dos Professores
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-sky-100 mt-2">
            Confira diretamente os dias, horários e faixas etárias de cada aula que você aplica no seu núcleo.
          </p>
        </div>
      </header>

      {/* Barra de Progresso */}
      {!sucesso && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200/80 mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Passo {passo} de 3</span>
              <span>
                {passo === 1 && "Quem é você"}
                {passo === 2 && "Dias de aula"}
                {passo === 3 && "Horários e idades das aulas"}
              </span>
            </div>
            <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(passo / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-2xl mx-auto px-4">
        {loadingDados ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-zinc-200/80">
            <Loader2 className="w-10 h-10 text-sky-600 animate-spin mx-auto mb-3" />
            <p className="text-zinc-600 font-medium">Carregando formulário...</p>
          </div>
        ) : sucesso ? (
          /* TELA FINAL: SUCESSO */
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-200 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">
              Respostas Registradas!
            </h2>
            <p className="text-zinc-600 text-sm max-w-md mx-auto mb-6">
              Muito obrigado, Professor(a) <strong>{professorNomeFinal}</strong>! As informações das aulas do seu núcleo (
              <strong>{nucleoNomeFinal}</strong>) foram salvas com sucesso.
            </p>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-left text-xs sm:text-sm text-zinc-700 space-y-2 mb-6">
              <p>
                <strong>Esporte:</strong> {modalidadeFinal}
              </p>
              <p>
                <strong>Dias de aula:</strong>{" "}
                {diasSelecionados
                  .map((d) => DIAS_SEMANA_LISTA.find((item) => item.id === d)?.nome)
                  .join(", ")}
              </p>
              <p>
                <strong>Total de aulas na semana:</strong> {totalAulasSemana} aulas
              </p>
            </div>

            <button
              onClick={() => {
                setSucesso(false);
                setPasso(1);
              }}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              Preencher Novamente / Outro Professor
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200/80">
            {/* ========================================================= */}
            {/* PASSO 1: IDENTIFICAÇÃO                                   */}
            {/* ========================================================= */}
            {passo === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
                      1
                    </span>
                    Quem é você e onde você dá aulas?
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Selecione seu núcleo, confirme seu nome e qual modalidade esportiva você leciona.
                  </p>
                </div>

                {/* Núcleo */}
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">
                    Qual é o núcleo onde você dá aulas? <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={nucleoSelecionadoId}
                    onChange={(e) => {
                      setNucleoSelecionadoId(e.target.value);
                      setProfessorSelecionadoId("");
                    }}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  >
                    <option value="">-- Toque para selecionar seu núcleo --</option>
                    {nucleos.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.identificacao} {n.nome_local ? `(${n.nome_local})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Professor */}
                {nucleoSelecionadoId && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-bold text-zinc-800 mb-1.5">
                      Esse é o seu nome? <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={professorSelecionadoId}
                      onChange={(e) => setProfessorSelecionadoId(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm mb-2"
                    >
                      <option value="">-- Selecione seu nome na lista --</option>
                      {professoresDoNucleo.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome_completo}
                        </option>
                      ))}
                      <option value="outro">Meu nome não está na lista (digitar)</option>
                    </select>

                    {professorSelecionadoId === "outro" && (
                      <input
                        type="text"
                        placeholder="Digite seu nome completo..."
                        value={professorNomeManual}
                        onChange={(e) => setProfessorNomeManual(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                      />
                    )}
                  </div>
                )}

                {/* Modalidade */}
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">
                    Qual esporte você ensina nesse núcleo? <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModalidade("Futebol de Campo")}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                        modalidade === "Futebol de Campo"
                          ? "border-sky-600 bg-sky-50 text-sky-800 shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-2xl">⚽</span>
                      <span>Futebol de Campo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalidade("Futsal")}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                        modalidade === "Futsal"
                          ? "border-sky-600 bg-sky-50 text-sky-800 shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-2xl">🥅</span>
                      <span>Futsal</span>
                    </button>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setModalidade(modalidade === "Outra" ? "Futebol de Campo" : "Outra")}
                      className="text-xs text-zinc-500 hover:text-sky-700 underline font-medium"
                    >
                      {modalidade === "Outra" ? "Voltar para Futebol/Futsal" : "É outro esporte? Clique aqui"}
                    </button>
                    {modalidade === "Outra" && (
                      <input
                        type="text"
                        placeholder="Ex: Treinamento de Goleiros, Futevôlei..."
                        value={modalidadeManual}
                        onChange={(e) => setModalidadeManual(e.target.value)}
                        className="mt-2 w-full h-11 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-sky-500"
                      />
                    )}
                  </div>
                </div>

                {/* Botão Avançar */}
                <div className="pt-4 border-t border-zinc-100 flex justify-end">
                  <button
                    type="button"
                    disabled={!podeAvancarPasso1}
                    onClick={() => setPasso(2)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>Continuar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PASSO 2: DIAS DE TRABALHO                                */}
            {/* ========================================================= */}
            {passo === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
                      2
                    </span>
                    Quais são os dias da semana que você dá aula?
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Toque nos botões para marcar os dias em que você tem aulas no núcleo.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DIAS_SEMANA_LISTA.map((dia) => {
                    const ativo = diasSelecionados.includes(dia.id);
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => toggleDia(dia.id)}
                        className={`h-16 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all select-none ${
                          ativo
                            ? "border-sky-600 bg-sky-600 text-white shadow-md scale-[1.02]"
                            : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100/80"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                            ativo ? "bg-white text-sky-600" : "border border-zinc-300 bg-white"
                          }`}
                        >
                          {ativo && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span>{dia.curto}</span>
                      </button>
                    );
                  })}
                </div>

                {diasSelecionados.length > 0 ? (
                  <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5 text-xs text-sky-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      <strong>{diasSelecionados.length} dias selecionados:</strong>{" "}
                      {diasSelecionados
                        .map((d) => DIAS_SEMANA_LISTA.find((item) => item.id === d)?.nome)
                        .join(", ")}
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Selecione pelo menos 1 dia para continuar.</span>
                  </div>
                )}

                {/* Botões Voltar / Avançar */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPasso(1)}
                    className="px-5 py-3 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    disabled={!podeAvancarPasso2}
                    onClick={() => {
                      setDiasConfirmados((prev) => prev.filter((d) => diasSelecionados.includes(d)));
                      setDiaAtivoIndex(0);
                      setPasso(3);
                    }}
                    className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
                  >
                    <span>Continuar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PASSO 3: HORÁRIOS E AULAS DE CADA DIA                     */}
            {/* ========================================================= */}
            {passo === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
                      3
                    </span>
                    Aulas e horários de cada dia
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Para cada dia selecionado, informe os horários e a idade dos alunos. Toque em <strong>+ Adicionar aula</strong> para incluir mais turmas no dia.
                  </p>
                </div>

                {/* Blocos por dia da semana com desbloqueio sequencial */}
                <div className="space-y-4">
                  {diasSelecionados.map((diaId, idx) => {
                    const diaObj = DIAS_SEMANA_LISTA.find((d) => d.id === diaId);
                    const aulas = aulasPorDia[diaId] || [];
                    const podeAdd = podeAdicionarNovaAula(diaId);
                    const diaValido = validarDia(diaId);

                    const isAtivo = idx === diaAtivoIndex;
                    const isConfirmado = diasConfirmados.includes(diaId);
                    const isBloqueado = !isAtivo && !isConfirmado;

                    // 1. DIA CONFIRMADO (Card verde compacto com botão Editar)
                    if (isConfirmado && !isAtivo) {
                      return (
                        <div
                          key={diaId}
                          className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-4 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {diaObj?.nome}
                              </span>
                              <span className="text-2xs text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>
                                  Confirmado ({aulas.length} {aulas.length === 1 ? "aula" : "aulas"})
                                </span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => editarDia(diaId, idx)}
                              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          </div>

                          {/* Resumo compacto das aulas */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {aulas.map((aula, aIdx) => (
                              <div
                                key={aula.id}
                                className="text-xs bg-white border border-emerald-200 text-zinc-800 px-3 py-1.5 rounded-xl font-medium shadow-2xs flex items-center gap-2"
                              >
                                <span className="font-extrabold text-emerald-700">
                                  {aIdx + 1}ª Aula:
                                </span>
                                <span className="font-bold text-zinc-900">
                                  {aula.inicio} às {aula.fim}
                                </span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-zinc-600 font-semibold">
                                  {aula.idadeMin} a {aula.idadeMax} anos
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // 2. DIA BLOQUEADO (Aguardando confirmação do anterior)
                    if (isBloqueado) {
                      const diaAnteriorObj =
                        idx > 0
                          ? DIAS_SEMANA_LISTA.find((d) => d.id === diasSelecionados[idx - 1])
                          : null;

                      return (
                        <div
                          key={diaId}
                          className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 select-none opacity-80"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-3 py-1 rounded-xl bg-zinc-200 text-zinc-600 font-black text-xs sm:text-sm">
                              {diaObj?.nome}
                            </span>
                            <span className="text-2xs text-zinc-500 font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-zinc-400" />
                              <span>Bloqueado</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium py-1">
                            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span>
                              Bloqueado até você confirmar as aulas de{" "}
                              <strong className="text-zinc-700 font-bold">
                                {diaAnteriorObj?.nome || "dias anteriores"}
                              </strong>
                              .
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // 3. DIA ATIVO (Em edição)
                    const proximoDiaNaoConfirmado = diasSelecionados.find(
                      (d, i) => i > idx && !diasConfirmados.includes(d)
                    );
                    const proximoDiaObj = proximoDiaNaoConfirmado
                      ? DIAS_SEMANA_LISTA.find((d) => d.id === proximoDiaNaoConfirmado)
                      : idx + 1 < diasSelecionados.length
                      ? DIAS_SEMANA_LISTA.find((d) => d.id === diasSelecionados[idx + 1])
                      : null;

                    const textoBotaoAvanco = proximoDiaObj
                      ? `Confirmar ${diaObj?.nome} e ir para ${proximoDiaObj.nome}`
                      : `Confirmar ${diaObj?.nome}`;

                    return (
                      <div
                        key={diaId}
                        className="rounded-2xl border-2 border-sky-400 bg-sky-50/30 p-4 space-y-3.5 shadow-sm ring-2 ring-sky-100"
                      >
                        {/* Cabeçalho do Dia */}
                        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs">
                              {diaObj?.nome}
                            </span>
                            <span className="text-2xs text-zinc-600 bg-white px-2.5 py-0.5 rounded-full border border-zinc-200 font-bold">
                              {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                            </span>
                          </div>
                          <span className="text-3xs uppercase font-extrabold tracking-wider text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
                            Editando agora
                          </span>
                        </div>

                        {/* Lista de Aulas do Dia (Condensada) */}
                        <div className="space-y-2.5">
                          {aulas.map((aula, index) => {
                            const errosAula = getErrosAula(diaId, index, aulas);
                            const horarioTexto =
                              aula.inicio && aula.fim ? ` - das ${aula.inicio} às ${aula.fim}` : "";

                            const fundosAulas = [
                              "bg-white border-zinc-300",
                              "bg-slate-50 border-slate-300",
                              "bg-sky-50/50 border-sky-300",
                              "bg-amber-50/50 border-amber-300",
                              "bg-emerald-50/50 border-emerald-300",
                            ];
                            const estiloFundo = fundosAulas[index % fundosAulas.length];

                            return (
                              <div
                                key={aula.id}
                                className={`rounded-xl border-2 p-3 shadow-2xs transition-colors space-y-2 ${
                                  errosAula.length > 0
                                    ? "border-rose-400 bg-rose-50/40 ring-1 ring-rose-200"
                                    : estiloFundo
                                }`}
                              >
                                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5">
                                  <span className="text-xs font-black text-zinc-900">
                                    {index + 1}ª Aula ({diaObj?.nome}
                                    {horarioTexto})
                                  </span>

                                  {aulas.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removerAulaDoDia(diaId, aula.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold"
                                      title="Remover esta aula"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Excluir</span>
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {/* Horário */}
                                  <div className="bg-zinc-50/80 rounded-lg p-2 border border-zinc-200/60">
                                    <span className="text-3xs uppercase font-extrabold tracking-wider text-zinc-500 block mb-1">
                                      Horário
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="time"
                                        value={aula.inicio}
                                        onChange={(e) =>
                                          updateAulaCampo(diaId, aula.id, "inicio", e.target.value)
                                        }
                                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-zinc-900 font-bold text-xs focus:ring-1 focus:ring-sky-500"
                                      />
                                      <span className="text-zinc-400 font-semibold text-xs shrink-0">
                                        às
                                      </span>
                                      <input
                                        type="time"
                                        value={aula.fim}
                                        onChange={(e) =>
                                          updateAulaCampo(diaId, aula.id, "fim", e.target.value)
                                        }
                                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-zinc-900 font-bold text-xs focus:ring-1 focus:ring-sky-500"
                                      />
                                    </div>
                                  </div>

                                  {/* Idades com Selects travados para Min <= Max */}
                                  <div className="bg-zinc-50/80 rounded-lg p-2 border border-zinc-200/60">
                                    <span className="text-3xs uppercase font-extrabold tracking-wider text-zinc-500 block mb-1">
                                      Idade dos alunos
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-500 text-xs shrink-0 font-medium">
                                        de
                                      </span>
                                      <select
                                        value={aula.idadeMin}
                                        onChange={(e) =>
                                          updateAulaCampo(diaId, aula.id, "idadeMin", Number(e.target.value))
                                        }
                                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-zinc-900 font-bold text-xs focus:ring-1 focus:ring-sky-500"
                                      >
                                        {IDADES_OPCOES.filter((idade) => idade <= Number(aula.idadeMax)).map(
                                          (idade) => (
                                            <option key={idade} value={idade}>
                                              {idade} anos
                                            </option>
                                          )
                                        )}
                                      </select>
                                      <span className="text-zinc-500 text-xs shrink-0 font-medium">
                                        até
                                      </span>
                                      <select
                                        value={aula.idadeMax}
                                        onChange={(e) =>
                                          updateAulaCampo(diaId, aula.id, "idadeMax", Number(e.target.value))
                                        }
                                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-zinc-900 font-bold text-xs focus:ring-1 focus:ring-sky-500"
                                      >
                                        {IDADES_OPCOES.filter((idade) => idade >= Number(aula.idadeMin)).map(
                                          (idade) => (
                                            <option key={idade} value={idade}>
                                              {idade} anos
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* Mensagens de erro de validação (se houver) */}
                                {errosAula.length > 0 && (
                                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-rose-700 text-2xs space-y-0.5 animate-fadeIn">
                                    {errosAula.map((err, i) => (
                                      <div key={i} className="flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                        <span>{err}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Botão Adicionar Aula logo abaixo dos cards */}
                        <div className="pt-1 flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={!podeAdd}
                            onClick={() => adicionarAulaNoDia(diaId)}
                            className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Adicionar outra aula na {diaObj?.nome}</span>
                          </button>
                          {!podeAdd && (
                            <span className="text-3xs text-amber-700 font-medium">
                              * Preencha e confira o horário da aula anterior para liberar nova aula.
                            </span>
                          )}
                        </div>

                        {/* Botão de confirmação e avanço do dia */}
                        <div className="pt-3 border-t border-sky-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          {!diaValido ? (
                            <span className="text-2xs text-amber-700 font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              Corrija os erros acima para confirmar este dia.
                            </span>
                          ) : (
                            <span className="text-2xs text-emerald-700 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              Aulas deste dia preenchidas corretamente.
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={!diaValido}
                            onClick={() => confirmarDiaEAvancar(diaId, idx)}
                            className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{textoBotaoAvanco}</span>
                            {proximoDiaObj && <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Banner quando todos os dias estão confirmados */}
                {diasSelecionados.length > 0 &&
                  diasSelecionados.every((d) => diasConfirmados.includes(d)) && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-950 flex items-center gap-3 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <div className="text-xs">
                        <strong className="block font-black text-sm text-emerald-900">
                          Todos os dias conferidos com sucesso!
                        </strong>
                        <span className="text-emerald-800">
                          Total de <strong>{totalAulasSemana} {totalAulasSemana === 1 ? "aula" : "aulas"}</strong> configuradas para a semana. Você já pode enviar suas respostas abaixo.
                        </span>
                      </div>
                    </div>
                  )}

                {/* Observações / Recado adicional */}
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">
                    Algum recado ou observação sobre suas turmas?{" "}
                    <span className="text-zinc-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: No sábado fazemos treinamento de fundamentos com horário especial..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Alerta de Erro de Envio */}
                {erroEnvio && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{erroEnvio}</span>
                  </div>
                )}

                {/* Alerta quando ainda faltam dias para confirmar */}
                {!podeEnviarPasso3 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Confirme as aulas de cada dia acima para liberar o envio das respostas (
                      {diasConfirmados.filter((d) => diasSelecionados.includes(d)).length} de{" "}
                      {diasSelecionados.length} confirmados).
                    </span>
                  </div>
                )}

                {/* Botões Voltar / Enviar */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => setPasso(2)}
                    className="px-5 py-3 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    disabled={!podeEnviarPasso3 || enviando}
                    onClick={handleSubmit}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-extrabold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Respostas</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
