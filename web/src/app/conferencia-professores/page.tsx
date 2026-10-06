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

interface AulaItem {
  id: string;
  inicio: string;
  fim: string;
  idadeMin: string | number;
  idadeMax: string | number;
}

export default function ConferenciaProfessoresPage() {
  const [loadingDados, setLoadingDados] = useState(true);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  // Passos: 1 (Quem é você), 2 (Dias da semana), 3 (Aulas de cada dia), 4 (Sucesso)
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
        return prev.filter((d) => d !== diaId);
      } else {
        // Se ainda não existia, já inicializa com 1 aula padrão para agilizar
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
                  idadeMax: 12,
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

  // Adicionar aula a um dia específico
  const adicionarAulaNoDia = (diaId: string) => {
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

      const novaAula: AulaItem = {
        id: Math.random().toString(36).substring(2, 9),
        inicio: proximoInicio,
        fim: novoFim,
        idadeMin: ultimaAula?.idadeMax ? Number(ultimaAula.idadeMax) + 1 : 12,
        idadeMax: ultimaAula?.idadeMax ? Number(ultimaAula.idadeMax) + 4 : 15,
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
      [diaId]: (prev[diaId] || []).map((a) =>
        a.id === aulaId ? { ...a, [campo]: valor } : a
      ),
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

  // Validação do envio no Passo 3
  const podeEnviarPasso3 = useMemo(() => {
    if (diasSelecionados.length === 0) return false;
    for (const diaId of diasSelecionados) {
      const aulas = aulasPorDia[diaId] || [];
      if (aulas.length === 0) return false;
      for (const aula of aulas) {
        if (!aula.inicio || !aula.fim) return false;
      }
    }
    return true;
  }, [diasSelecionados, aulasPorDia]);

  // Total geral de aulas na semana
  const totalAulasSemana = useMemo(() => {
    return diasSelecionados.reduce((acc, diaId) => acc + (aulasPorDia[diaId]?.length || 0), 0);
  }, [diasSelecionados, aulasPorDia]);

  // Enviar formulário
  const handleSubmit = async () => {
    try {
      setEnviando(true);
      setErroEnvio(null);

      // Prepara estrutura por dia
      const aulasFormatadasPorDia: Record<string, any[]> = {};
      diasSelecionados.forEach((diaId) => {
        const diaNome = DIAS_SEMANA_LISTA.find((d) => d.id === diaId)?.nome || diaId;
        const aulas = aulasPorDia[diaId] || [];
        aulasFormatadasPorDia[diaNome] = aulas.map((a, index) => ({
          aula_numero: index + 1,
          horario_inicio: a.inicio,
          horario_fim: a.fim,
          idade_minima: Number(a.idadeMin) || null,
          idade_maxima: Number(a.idadeMax) || null,
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
                    onClick={() => setPasso(3)}
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
                    Para cada dia selecionado, informe os horários e a idade dos alunos. Se der mais de uma aula no dia, toque em <strong>+ Adicionar aula</strong>.
                  </p>
                </div>

                {/* Blocos por dia da semana */}
                <div className="space-y-6">
                  {diasSelecionados.map((diaId) => {
                    const diaObj = DIAS_SEMANA_LISTA.find((d) => d.id === diaId);
                    const aulas = aulasPorDia[diaId] || [];

                    return (
                      <div
                        key={diaId}
                        className="rounded-3xl border-2 border-sky-100 bg-sky-50/20 p-5 space-y-4"
                      >
                        {/* Cabeçalho do Dia */}
                        <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {diaObj?.curto}
                            </span>
                            <div>
                              <span className="font-extrabold text-base text-zinc-900 block leading-tight">
                                {diaObj?.nome}
                              </span>
                              <span className="text-xs text-zinc-500 font-medium">
                                {aulas.length} {aulas.length === 1 ? "aula cadastrada" : "aulas cadastradas"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => adicionarAulaNoDia(diaId)}
                            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Adicionar aula</span>
                          </button>
                        </div>

                        {/* Lista de Aulas do Dia */}
                        <div className="space-y-3.5">
                          {aulas.map((aula, index) => (
                            <div
                              key={aula.id}
                              className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-2xs space-y-3 relative"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-sky-900 flex items-center gap-1.5">
                                  <span>⚽</span> {index + 1}ª Aula ({diaObj?.curto})
                                </span>

                                {aulas.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removerAulaDoDia(diaId, aula.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                                    title="Remover esta aula"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Excluir</span>
                                  </button>
                                )}
                              </div>

                              {/* Horários */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-2xs font-bold text-zinc-600 block mb-1">
                                    Início da aula:
                                  </label>
                                  <input
                                    type="time"
                                    value={aula.inicio}
                                    onChange={(e) =>
                                      updateAulaCampo(diaId, aula.id, "inicio", e.target.value)
                                    }
                                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-2xs font-bold text-zinc-600 block mb-1">
                                    Término da aula:
                                  </label>
                                  <input
                                    type="time"
                                    value={aula.fim}
                                    onChange={(e) =>
                                      updateAulaCampo(diaId, aula.id, "fim", e.target.value)
                                    }
                                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                                  />
                                </div>
                              </div>

                              {/* Idades */}
                              <div>
                                <label className="text-2xs font-bold text-zinc-600 block mb-1">
                                  Idade aproximada dos alunos:
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="4"
                                        max="25"
                                        placeholder="Mais novo (ex: 8)"
                                        value={aula.idadeMin}
                                        onChange={(e) =>
                                          updateAulaCampo(diaId, aula.id, "idadeMin", e.target.value)
                                        }
                                        className="w-full h-11 px-3 pr-12 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                                      />
                                      <span className="absolute right-3 top-3 text-xs text-zinc-400 font-semibold pointer-events-none">
                                        anos
                                      </span>
                                    </div>
                                    <span className="text-3xs text-zinc-400 block mt-0.5">Aluno mais novo</span>
                                  </div>

                                  <div>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="4"
                                        max="25"
                                        placeholder="Mais velho (ex: 11)"
                                        value={aula.idadeMax}
                                        onChange={(e) =>
                                          updateAulaCampo(diaId, aula.id, "idadeMax", e.target.value)
                                        }
                                        className="w-full h-11 px-3 pr-12 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                                      />
                                      <span className="absolute right-3 top-3 text-xs text-zinc-400 font-semibold pointer-events-none">
                                        anos
                                      </span>
                                    </div>
                                    <span className="text-3xs text-zinc-400 block mt-0.5">Aluno mais velho</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Observações / Recado adicional */}
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">
                    Algum recado ou observação sobre suas turmas? <span className="text-zinc-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: No sábado fazemos treinamento de fundamentos com horário especial..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Alerta de Erro */}
                {erroEnvio && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{erroEnvio}</span>
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
