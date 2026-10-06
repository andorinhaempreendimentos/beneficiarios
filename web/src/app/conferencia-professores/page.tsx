"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  School,
  Trophy,
  AlertCircle,
  Loader2,
  Check,
  Send,
  HelpCircle,
  Info,
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

interface AulaInfo {
  numero: number;
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
  const [nucleoAtividades, setNucleoAtividades] = useState<{ nucleo_id: string; atividade_id: string }[]>([]);

  // Passo atual: 1 a 4, ou 5 (concluído)
  const [passo, setPasso] = useState<number>(1);

  // Passo 1: Identificação
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("");
  const [professorSelecionadoId, setProfessorSelecionadoId] = useState<string>("");
  const [professorNomeManual, setProfessorNomeManual] = useState<string>("");
  const [modalidade, setModalidade] = useState<string>("Futebol de Campo");
  const [modalidadeManual, setModalidadeManual] = useState<string>("");

  // Passo 2: Dias da semana
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(["Seg", "Qua", "Sex"]);

  // Passo 3: Quantidade de aulas por dia (map: diaId -> quantidade)
  const [aulasPorDia, setAulasPorDia] = useState<Record<string, number>>({
    Seg: 2,
    Qua: 2,
    Sex: 2,
  });

  // Passo 4: Horários e idades
  const [mesmoHorarioTodosDias, setMesmoHorarioTodosDias] = useState<boolean>(true);

  // Se mesmoHorarioTodosDias = true: lista de aulas padrão (tamanho = maior número de aulas entre os dias)
  const [aulasPadrao, setAulasPadrao] = useState<AulaInfo[]>([
    { numero: 1, inicio: "08:00", fim: "09:30", idadeMin: 8, idadeMax: 11 },
    { numero: 2, inicio: "09:30", fim: "11:00", idadeMin: 12, idadeMax: 15 },
  ]);

  // Se mesmoHorarioTodosDias = false: horários personalizados por dia (diaId -> lista de aulas)
  const [aulasPorDiaEspecifico, setAulasPorDiaEspecifico] = useState<Record<string, AulaInfo[]>>({});

  // Observações e envio
  const [observacoes, setObservacoes] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);

  // Carregar lista do backend
  useEffect(() => {
    async function carregar() {
      try {
        setLoadingDados(true);
        const res = await fetch("/api/conferencia-professores");
        const data = await res.json();
        if (data.nucleos) setNucleos(data.nucleos);
        if (data.professores) setProfessores(data.professores);
        if (data.atividades) setAtividades(data.atividades);
        if (data.nucleoAtividades) setNucleoAtividades(data.nucleoAtividades);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoadingDados(false);
      }
    }
    carregar();
  }, []);

  // Professores do núcleo selecionado
  const professoresDoNucleo = useMemo(() => {
    if (!nucleoSelecionadoId) return professores;
    const filtrados = professores.filter((p) => p.nucleo_id === nucleoSelecionadoId);
    return filtrados.length > 0 ? filtrados : professores;
  }, [nucleoSelecionadoId, professores]);

  // Toggle dia da semana
  const toggleDia = (diaId: string) => {
    setDiasSelecionados((prev) => {
      const existe = prev.includes(diaId);
      const novos = existe ? prev.filter((d) => d !== diaId) : [...prev, diaId];
      // Ajusta aulasPorDia para manter sincronizado
      if (!existe) {
        setAulasPorDia((a) => ({ ...a, [diaId]: a[diaId] || 2 }));
      }
      return novos;
    });
  };

  // Alterar quantidade de aulas em um dia
  const setQtdAulasDia = (diaId: string, qtd: number) => {
    setAulasPorDia((prev) => ({ ...prev, [diaId]: qtd }));
  };

  // Aplicar mesma quantidade a todos os dias selecionados
  const aplicarQtdParaTodos = (qtd: number) => {
    const atualizado: Record<string, number> = {};
    diasSelecionados.forEach((d) => {
      atualizado[d] = qtd;
    });
    setAulasPorDia(atualizado);
  };

  // Maior quantidade de aulas em qualquer dia
  const maxAulas = useMemo(() => {
    if (diasSelecionados.length === 0) return 1;
    let max = 1;
    diasSelecionados.forEach((dia) => {
      const qtd = aulasPorDia[dia] || 1;
      if (qtd > max) max = qtd;
    });
    return max;
  }, [diasSelecionados, aulasPorDia]);

  // Sincronizar tamanho de aulasPadrao com maxAulas
  useEffect(() => {
    setAulasPadrao((prev) => {
      const novas: AulaInfo[] = [];
      for (let i = 1; i <= maxAulas; i++) {
        const existente = prev.find((a) => a.numero === i);
        if (existente) {
          novas.push(existente);
        } else {
          novas.push({
            numero: i,
            inicio: i === 1 ? "08:00" : i === 2 ? "09:30" : i === 3 ? "14:00" : "15:30",
            fim: i === 1 ? "09:30" : i === 2 ? "11:00" : i === 3 ? "15:30" : "17:00",
            idadeMin: 8,
            idadeMax: 14,
          });
        }
      }
      return novas;
    });
  }, [maxAulas]);

  // Sincronizar aulas por dia específico caso o usuário use horários diferentes
  useEffect(() => {
    setAulasPorDiaEspecifico((prev) => {
      const novoMapa: Record<string, AulaInfo[]> = { ...prev };
      diasSelecionados.forEach((dia) => {
        const qtd = aulasPorDia[dia] || 1;
        const listaAtual = novoMapa[dia] || [];
        const novaLista: AulaInfo[] = [];
        for (let i = 1; i <= qtd; i++) {
          const existente = listaAtual.find((a) => a.numero === i);
          if (existente) {
            novaLista.push(existente);
          } else {
            novaLista.push({
              numero: i,
              inicio: i === 1 ? "08:00" : i === 2 ? "09:30" : "14:00",
              fim: i === 1 ? "09:30" : i === 2 ? "11:00" : "15:30",
              idadeMin: 8,
              idadeMax: 14,
            });
          }
        }
        novoMapa[dia] = novaLista;
      });
      return novoMapa;
    });
  }, [diasSelecionados, aulasPorDia]);

  // Atualizar campo em aula padrão
  const updateAulaPadrao = (numero: number, campo: keyof AulaInfo, valor: any) => {
    setAulasPadrao((prev) =>
      prev.map((a) => (a.numero === numero ? { ...a, [campo]: valor } : a))
    );
  };

  // Atualizar campo em aula específica de um dia
  const updateAulaEspecifica = (diaId: string, numero: number, campo: keyof AulaInfo, valor: any) => {
    setAulasPorDiaEspecifico((prev) => ({
      ...prev,
      [diaId]: (prev[diaId] || []).map((a) =>
        a.numero === numero ? { ...a, [campo]: valor } : a
      ),
    }));
  };

  // Nomes finais
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

  // Validação de passos
  const podeAvancarPasso1 = Boolean(
    nucleoNomeFinal && professorNomeFinal && modalidadeFinal
  );

  const podeAvancarPasso2 = diasSelecionados.length > 0;

  const podeAvancarPasso3 = diasSelecionados.every((d) => (aulasPorDia[d] || 0) >= 1);

  // Submissão final
  const handleSubmit = async () => {
    try {
      setEnviando(true);
      setErroEnvio(null);

      // Monta estrutura final simplificada
      const payloadDados = {
        dias_semana: diasSelecionados.map(
          (d) => DIAS_SEMANA_LISTA.find((item) => item.id === d)?.nome || d
        ),
        aulas_por_dia: diasSelecionados.reduce((acc, d) => {
          const nomeDia = DIAS_SEMANA_LISTA.find((item) => item.id === d)?.nome || d;
          acc[nomeDia] = aulasPorDia[d] || 1;
          return acc;
        }, {} as Record<string, number>),
        mesmo_horario_todos_dias: mesmoHorarioTodosDias,
        grade_aulas: mesmoHorarioTodosDias
          ? aulasPadrao.map((a) => ({
              aula_numero: a.numero,
              horario_inicio: a.inicio,
              horario_fim: a.fim,
              idade_minima: Number(a.idadeMin) || null,
              idade_maxima: Number(a.idadeMax) || null,
            }))
          : diasSelecionados.map((d) => ({
              dia: DIAS_SEMANA_LISTA.find((item) => item.id === d)?.nome || d,
              aulas: (aulasPorDiaEspecifico[d] || []).map((a) => ({
                aula_numero: a.numero,
                horario_inicio: a.inicio,
                horario_fim: a.fim,
                idade_minima: Number(a.idadeMin) || null,
                idade_maxima: Number(a.idadeMax) || null,
              })),
            })),
      };

      const totalAulasSemana = diasSelecionados.reduce((acc, d) => acc + (aulasPorDia[d] || 1), 0);

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
      setPasso(5);
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
            Preencha seus dias de aula, horários e idades das crianças de forma rápida e simples.
          </p>
        </div>
      </header>

      {/* Progress Bar (se não estiver na tela final de sucesso) */}
      {!sucesso && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200/80 mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Passo {passo} de 4</span>
              <span>
                {passo === 1 && "Quem é você"}
                {passo === 2 && "Dias de aula"}
                {passo === 3 && "Aulas por dia"}
                {passo === 4 && "Horários e idades"}
              </span>
            </div>
            <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(passo / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
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
              Muito obrigado, Professor(a) <strong>{professorNomeFinal}</strong>. As informações do seu núcleo (
              <strong>{nucleoNomeFinal}</strong>) foram salvas com sucesso no banco de dados.
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
                <strong>Rotina informada:</strong>{" "}
                {mesmoHorarioTodosDias ? "Mesmo horário nos dias de aula" : "Horários individuais por dia"}
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
                    Selecione seu núcleo, seu nome e a modalidade esportiva que você aplica.
                  </p>
                </div>

                {/* 1. Núcleo */}
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

                {/* 2. Professor */}
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

                {/* 3. Modalidade */}
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
            {/* PASSO 3: QUANTIDADE DE AULAS POR DIA                      */}
            {/* ========================================================= */}
            {passo === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
                      3
                    </span>
                    Quantas aulas você dá em cada dia?
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Exemplo: se você dá aula para uma turma de manhã e outra turma depois, são 2 aulas no dia.
                  </p>
                </div>

                {/* Atalho rápido: botões para aplicar a todos */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-xs">
                  <span className="font-bold text-zinc-700 block mb-2">
                    Atalho rápido (se todos os dias forem iguais):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => aplicarQtdParaTodos(q)}
                        className="px-3 py-1.5 bg-white hover:bg-sky-50 border border-zinc-300 hover:border-sky-400 rounded-lg font-bold text-zinc-700 text-xs transition-colors"
                      >
                        {q} {q === 1 ? "aula" : "aulas"} em todos os dias
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista por dia selecionado */}
                <div className="space-y-3.5">
                  {diasSelecionados.map((diaId) => {
                    const diaObj = DIAS_SEMANA_LISTA.find((d) => d.id === diaId);
                    const qtdAtual = aulasPorDia[diaId] || 1;
                    return (
                      <div
                        key={diaId}
                        className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {diaObj?.curto}
                          </span>
                          <div>
                            <span className="font-extrabold text-sm text-zinc-900 block">
                              {diaObj?.nome}
                            </span>
                            <span className="text-xs text-zinc-500">
                              Quantas aulas você aplica neste dia?
                            </span>
                          </div>
                        </div>

                        {/* Botões de quantidade */}
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setQtdAulasDia(diaId, num)}
                              className={`h-11 px-3.5 rounded-xl font-bold text-xs transition-all ${
                                qtdAtual === num
                                  ? "bg-sky-600 text-white shadow-sm"
                                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                              }`}
                            >
                              {num} {num === 1 ? "aula" : "aulas"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botões Voltar / Avançar */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPasso(2)}
                    className="px-5 py-3 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    disabled={!podeAvancarPasso3}
                    onClick={() => setPasso(4)}
                    className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
                  >
                    <span>Continuar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PASSO 4: HORÁRIOS E IDADES                                */}
            {/* ========================================================= */}
            {passo === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
                      4
                    </span>
                    Horários e idades das crianças em cada aula
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Informe que horas começa e termina cada aula, e a idade aproximada dos alunos.
                  </p>
                </div>

                {/* Opção se o horário é o mesmo em todos os dias */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-sm text-zinc-900 block">
                      O horário das aulas é o mesmo em todos os dias?
                    </span>
                    <span className="text-xs text-zinc-500">
                      (Ex: Segunda, Quarta e Sexta começam na mesma hora)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMesmoHorarioTodosDias(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        mesmoHorarioTodosDias
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      Sim, é igual
                    </button>
                    <button
                      type="button"
                      onClick={() => setMesmoHorarioTodosDias(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        !mesmoHorarioTodosDias
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      Não, varia por dia
                    </button>
                  </div>
                </div>

                {/* MODO 1: Mesmo horário em todos os dias (mais comum e rápido) */}
                {mesmoHorarioTodosDias ? (
                  <div className="space-y-4">
                    {aulasPadrao.map((aula) => (
                      <div
                        key={aula.numero}
                        className="p-5 rounded-2xl border-2 border-sky-100 bg-sky-50/30 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                          <span className="font-extrabold text-sm text-sky-900 flex items-center gap-2">
                            <span>⚽</span> {aula.numero}ª AULA DO DIA
                          </span>
                          <span className="text-xs text-sky-700 font-semibold bg-sky-100 px-2.5 py-0.5 rounded-full">
                            Todos os dias marcados
                          </span>
                        </div>

                        {/* Horários */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Horário da {aula.numero}ª aula:
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-2xs text-zinc-500 block mb-0.5">Que horas começa?</span>
                              <input
                                type="time"
                                value={aula.inicio}
                                onChange={(e) => updateAulaPadrao(aula.numero, "inicio", e.target.value)}
                                className="w-full h-11 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                            <div>
                              <span className="text-2xs text-zinc-500 block mb-0.5">Que horas termina?</span>
                              <input
                                type="time"
                                value={aula.fim}
                                onChange={(e) => updateAulaPadrao(aula.numero, "fim", e.target.value)}
                                className="w-full h-11 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Idades */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Idade aproximada dos alunos nesta aula:
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-2xs text-zinc-500 block mb-0.5">Aluno mais novo:</span>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="4"
                                  max="25"
                                  placeholder="Ex: 8"
                                  value={aula.idadeMin}
                                  onChange={(e) => updateAulaPadrao(aula.numero, "idadeMin", e.target.value)}
                                  className="w-full h-11 px-3 pr-12 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                                />
                                <span className="absolute right-3 top-3 text-xs text-zinc-400 font-semibold">
                                  anos
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-2xs text-zinc-500 block mb-0.5">Aluno mais velho:</span>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="4"
                                  max="25"
                                  placeholder="Ex: 11"
                                  value={aula.idadeMax}
                                  onChange={(e) => updateAulaPadrao(aula.numero, "idadeMax", e.target.value)}
                                  className="w-full h-11 px-3 pr-12 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold focus:ring-2 focus:ring-sky-500"
                                />
                                <span className="absolute right-3 top-3 text-xs text-zinc-400 font-semibold">
                                  anos
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* MODO 2: Horários específicos por dia */
                  <div className="space-y-6">
                    {diasSelecionados.map((diaId) => {
                      const diaObj = DIAS_SEMANA_LISTA.find((d) => d.id === diaId);
                      const listaAulas = aulasPorDiaEspecifico[diaId] || [];
                      return (
                        <div key={diaId} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                              {diaObj?.curto}
                            </span>
                            <span className="font-extrabold text-sm text-zinc-900">
                              {diaObj?.nome} ({listaAulas.length} {listaAulas.length === 1 ? "aula" : "aulas"})
                            </span>
                          </div>

                          <div className="space-y-3">
                            {listaAulas.map((aula) => (
                              <div
                                key={aula.numero}
                                className="p-3.5 bg-white rounded-xl border border-zinc-200 space-y-2.5"
                              >
                                <span className="text-xs font-bold text-sky-800 block">
                                  ⚽ {aula.numero}ª Aula de {diaObj?.curto}
                                </span>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-2xs text-zinc-500 block mb-0.5">Começa às:</span>
                                    <input
                                      type="time"
                                      value={aula.inicio}
                                      onChange={(e) =>
                                        updateAulaEspecifica(diaId, aula.numero, "inicio", e.target.value)
                                      }
                                      className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-xs font-bold"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-2xs text-zinc-500 block mb-0.5">Termina às:</span>
                                    <input
                                      type="time"
                                      value={aula.fim}
                                      onChange={(e) =>
                                        updateAulaEspecifica(diaId, aula.numero, "fim", e.target.value)
                                      }
                                      className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-xs font-bold"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-2xs text-zinc-500 block mb-0.5">Idade menor:</span>
                                    <input
                                      type="number"
                                      placeholder="Ex: 8"
                                      value={aula.idadeMin}
                                      onChange={(e) =>
                                        updateAulaEspecifica(diaId, aula.numero, "idadeMin", e.target.value)
                                      }
                                      className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-xs font-bold"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-2xs text-zinc-500 block mb-0.5">Idade maior:</span>
                                    <input
                                      type="number"
                                      placeholder="Ex: 12"
                                      value={aula.idadeMax}
                                      onChange={(e) =>
                                        updateAulaEspecifica(diaId, aula.numero, "idadeMax", e.target.value)
                                      }
                                      className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-xs font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Observações / Recado opcional */}
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">
                    Quer deixar algum recado ou observação adicional? <span className="text-zinc-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Na sexta-feira temos jogo amistoso às 16h..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Mensagem de Erro se houver */}
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
                    onClick={() => setPasso(3)}
                    className="px-5 py-3 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    disabled={enviando}
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
