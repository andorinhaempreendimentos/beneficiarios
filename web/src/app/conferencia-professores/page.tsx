"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Calendar, Clock, Users, School, Trophy, AlertCircle, Loader2 } from "lucide-react";

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

interface HorarioDia {
  dia: string;
  inicio: string;
  fim: string;
}

interface TurmaDraft {
  identificador: string;
  nome: string;
  diasSelecionados: string[];
  horarioPadraoInicio: string;
  horarioPadraoFim: string;
  horariosPorDiaPersonalizado: boolean;
  horariosEspecificos: Record<string, { inicio: string; fim: string }>;
  idadeMinima: number | string;
  idadeMaxima: number | string;
}

const DIAS_SEMANA = [
  { sigla: "Seg", label: "Segunda" },
  { sigla: "Ter", label: "Terça" },
  { sigla: "Qua", label: "Quarta" },
  { sigla: "Qui", label: "Quinta" },
  { sigla: "Sex", label: "Sexta" },
  { sigla: "Sáb", label: "Sábado" },
  { sigla: "Dom", label: "Domingo" },
];

const LETRAS_TURMAS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function ConferenciaProfessoresPage() {
  const [loadingDados, setLoadingDados] = useState(true);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [nucleoAtividades, setNucleoAtividades] = useState<{ nucleo_id: string; atividade_id: string }[]>([]);

  // Passo do formulário
  const [passo, setPasso] = useState<number>(1);

  // Passo 1: Identificação
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("");
  const [professorSelecionadoId, setProfessorSelecionadoId] = useState<string>("");
  const [professorNomeManual, setProfessorNomeManual] = useState<string>("");
  const [modalidadeSelecionadaId, setModalidadeSelecionadaId] = useState<string>("");
  const [modalidadeNomeManual, setModalidadeNomeManual] = useState<string>("");

  // Passo 2: Quantidade de turmas
  const [qtdTurmas, setQtdTurmas] = useState<number>(1);

  // Passo 3: Dados das turmas
  const [turmas, setTurmas] = useState<TurmaDraft[]>([]);

  // Observações e envio
  const [observacoes, setObservacoes] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);

  // Carregar dados iniciais
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
        console.error("Erro ao carregar dados iniciais:", err);
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

  // Modalidades disponíveis para o núcleo selecionado
  const modalidadesDoNucleo = useMemo(() => {
    if (!nucleoSelecionadoId) return atividades;
    const ids = nucleoAtividades
      .filter((na) => na.nucleo_id === nucleoSelecionadoId)
      .map((na) => na.atividade_id);
    const filtradas = atividades.filter((a) => ids.includes(a.id));
    return filtradas.length > 0 ? filtradas : atividades;
  }, [nucleoSelecionadoId, atividades, nucleoAtividades]);

  // Inicializar ou reajustar turmas quando muda qtdTurmas
  useEffect(() => {
    setTurmas((atuais) => {
      const novas: TurmaDraft[] = [];
      for (let i = 0; i < qtdTurmas; i++) {
        const letra = LETRAS_TURMAS[i] || `${i + 1}`;
        if (atuais[i]) {
          novas.push(atuais[i]);
        } else {
          novas.push({
            identificador: letra,
            nome: `Turma ${letra}`,
            diasSelecionados: ["Seg", "Qua"],
            horarioPadraoInicio: "08:00",
            horarioPadraoFim: "09:30",
            horariosPorDiaPersonalizado: false,
            horariosEspecificos: {},
            idadeMinima: 10,
            idadeMaxima: 12,
          });
        }
      }
      return novas;
    });
  }, [qtdTurmas]);

  // Atualizar turma específica
  function atualizarTurma(index: number, patch: Partial<TurmaDraft>) {
    setTurmas((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  // Alternar dia da semana para uma turma
  function toggleDiaTurma(index: number, dia: string) {
    const t = turmas[index];
    if (!t) return;
    const jaTem = t.diasSelecionados.includes(dia);
    const novosDias = jaTem
      ? t.diasSelecionados.filter((d) => d !== dia)
      : [...t.diasSelecionados, dia];

    atualizarTurma(index, { diasSelecionados: novosDias });
  }

  // Nomes resolvidos
  const nucleoNomeFinal = useMemo(() => {
    const n = nucleos.find((item) => item.id === nucleoSelecionadoId);
    return n ? n.identificacao : "";
  }, [nucleos, nucleoSelecionadoId]);

  const professorNomeFinal = useMemo(() => {
    if (professorSelecionadoId === "outro") return professorNomeManual.trim();
    const p = professores.find((item) => item.id === professorSelecionadoId);
    return p ? p.nome_completo : professorNomeManual.trim();
  }, [professores, professorSelecionadoId, professorNomeManual]);

  const modalidadeNomeFinal = useMemo(() => {
    if (modalidadeSelecionadaId === "outro") return modalidadeNomeManual.trim();
    const m = atividades.find((item) => item.id === modalidadeSelecionadaId);
    return m ? m.nome : modalidadeNomeManual.trim();
  }, [atividades, modalidadeSelecionadaId, modalidadeNomeManual]);

  // Validação do Passo 1
  const passo1Valido = Boolean(
    nucleoSelecionadoId &&
    professorNomeFinal &&
    modalidadeNomeFinal
  );

  // Validação do Passo 3
  const passo3Valido = useMemo(() => {
    if (turmas.length === 0) return false;
    for (const t of turmas) {
      if (t.diasSelecionados.length === 0) return false;
      if (!t.horarioPadraoInicio || !t.horarioPadraoFim) return false;
      if (t.idadeMinima === "" || t.idadeMaxima === "") return false;
      if (Number(t.idadeMinima) > Number(t.idadeMaxima)) return false;
    }
    return true;
  }, [turmas]);

  // Enviar formulário
  async function handleEnviar() {
    try {
      setEnviando(true);
      setErroEnvio(null);

      const dadosTurmasPayload = turmas.map((t) => {
        const horariosMontados: HorarioDia[] = t.diasSelecionados.map((dia) => {
          if (t.horariosPorDiaPersonalizado && t.horariosEspecificos[dia]) {
            return {
              dia,
              inicio: t.horariosEspecificos[dia].inicio || t.horarioPadraoInicio,
              fim: t.horariosEspecificos[dia].fim || t.horarioPadraoFim,
            };
          }
          return {
            dia,
            inicio: t.horarioPadraoInicio,
            fim: t.horarioPadraoFim,
          };
        });

        return {
          identificador: t.identificador,
          nome: t.nome,
          idadeMinima: Number(t.idadeMinima),
          idadeMaxima: Number(t.idadeMaxima),
          dias: t.diasSelecionados,
          horarios: horariosMontados,
        };
      });

      const payload = {
        nucleoId: nucleoSelecionadoId || null,
        nucleoNome: nucleoNomeFinal,
        professorId: professorSelecionadoId !== "outro" ? professorSelecionadoId : null,
        professorNome: professorNomeFinal,
        modalidadeId: modalidadeSelecionadaId !== "outro" ? modalidadeSelecionadaId : null,
        modalidadeNome: modalidadeNomeFinal,
        qtdTurmas: turmas.length,
        dadosTurmas: dadosTurmasPayload,
        observacoes: observacoes.trim(),
      };

      const res = await fetch("/api/conferencia-professores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar informações");
      }

      setSucesso(true);
    } catch (err: any) {
      setErroEnvio(err.message || "Ocorreu um erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (loadingDados) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-600">Carregando formulário...</p>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Informações Enviadas!</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Obrigado, <strong className="text-zinc-800">{professorNomeFinal}</strong>. As informações da grade de turmas do núcleo <strong className="text-zinc-800">{nucleoNomeFinal}</strong> foram salvas com sucesso no banco de dados.
          </p>
          <div className="bg-zinc-50 rounded-xl p-4 text-left border border-zinc-200 text-xs text-zinc-600 mb-6 space-y-1">
            <p><strong>Modalidade:</strong> {modalidadeNomeFinal}</p>
            <p><strong>Total de Turmas:</strong> {turmas.length}</p>
            <p><strong>Turmas:</strong> {turmas.map((t) => `${t.nome} (${t.diasSelecionados.join(", ")})`).join("; ")}</p>
          </div>
          <button
            onClick={() => {
              setSucesso(false);
              setPasso(1);
              setTurmas([]);
              setQtdTurmas(1);
            }}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition text-sm cursor-pointer shadow-sm"
          >
            Enviar Outra Resposta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 leading-tight">Validação de Turmas</h1>
              <p className="text-xs text-zinc-500">Conferência com Professores</p>
            </div>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full">
            Passo {passo} de 4
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        {/* Barra de Progresso */}
        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${(passo / 4) * 100}%` }}
          />
        </div>

        {/* PASSO 1: Identificação */}
        {passo === 1 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-600" />
                1. Identificação do Núcleo e Professor
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Selecione o núcleo onde você leciona e informe seus dados básicos.
              </p>
            </div>

            {/* Núcleo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Qual é o seu núcleo? *
              </label>
              <select
                value={nucleoSelecionadoId}
                onChange={(e) => {
                  setNucleoSelecionadoId(e.target.value);
                  setProfessorSelecionadoId("");
                }}
                className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">Selecione o núcleo...</option>
                {nucleos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.identificacao} {n.nome_local ? `(${n.nome_local})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Professor */}
            {nucleoSelecionadoId && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Qual é o seu nome? (Professor) *
                </label>
                <select
                  value={professorSelecionadoId}
                  onChange={(e) => setProfessorSelecionadoId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">Selecione seu nome na lista...</option>
                  {professoresDoNucleo.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome_completo}
                    </option>
                  ))}
                  <option value="outro">+ Meu nome não está na lista</option>
                </select>

                {professorSelecionadoId === "outro" && (
                  <input
                    type="text"
                    placeholder="Digite seu nome completo..."
                    value={professorNomeManual}
                    onChange={(e) => setProfessorNomeManual(e.target.value)}
                    className="w-full mt-2 p-3 rounded-xl border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>
            )}

            {/* Modalidade */}
            {nucleoSelecionadoId && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  Qual modalidade você leciona? *
                </label>
                <select
                  value={modalidadeSelecionadaId}
                  onChange={(e) => setModalidadeSelecionadaId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">Selecione a modalidade...</option>
                  {modalidadesDoNucleo.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                  <option value="outro">+ Outra modalidade</option>
                </select>

                {modalidadeSelecionadaId === "outro" && (
                  <input
                    type="text"
                    placeholder="Digite o nome da modalidade esportiva..."
                    value={modalidadeNomeManual}
                    onChange={(e) => setModalidadeNomeManual(e.target.value)}
                    className="w-full mt-2 p-3 rounded-xl border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>
            )}

            <button
              disabled={!passo1Valido}
              onClick={() => setPasso(2)}
              className="w-full mt-4 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
            >
              Próximo: Quantidade de Turmas <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASSO 2: Quantidade de turmas */}
        {passo === 2 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                2. Estrutura de Turmas
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Quantas turmas diferentes de <strong>{modalidadeNomeFinal}</strong> você atende no <strong>{nucleoNomeFinal}</strong>?
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQtdTurmas(num)}
                  className={`py-4 px-2 rounded-xl border text-center transition font-semibold text-base cursor-pointer ${
                    qtdTurmas === num
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {num} {num === 1 ? "Turma" : "Turmas"}
                </button>
              ))}
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600">
              💡 <em>Lembrete:</em> Uma turma é um grupo fixo de alunos que pode treinar em 1, 2 ou mais dias por semana.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPasso(1)}
                className="py-3 px-4 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium rounded-xl transition flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                type="button"
                onClick={() => setPasso(3)}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
              >
                Configurar Horários e Idades <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASSO 3: Configuração das turmas */}
        {passo === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                3. Dias, Horários e Faixa Etária
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Configure os detalhes de cada uma das {qtdTurmas} turmas que você atende.
              </p>
            </div>

            {turmas.map((turma, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {turma.identificador}
                    </span>
                    <input
                      type="text"
                      value={turma.nome}
                      onChange={(e) => atualizarTurma(idx, { nome: e.target.value })}
                      className="font-bold text-zinc-900 text-sm focus:outline-hidden border-b border-dashed border-zinc-300 focus:border-emerald-600"
                    />
                  </div>
                  <span className="text-xs text-zinc-400">Turma {idx + 1} de {turmas.length}</span>
                </div>

                {/* Dias da semana */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    Quais dias da semana essa turma treina? *
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {DIAS_SEMANA.map((d) => {
                      const ativo = turma.diasSelecionados.includes(d.sigla);
                      return (
                        <button
                          key={d.sigla}
                          type="button"
                          onClick={() => toggleDiaTurma(idx, d.sigla)}
                          className={`py-2 px-1 rounded-lg text-xs font-medium text-center border transition cursor-pointer ${
                            ativo
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
                          }`}
                        >
                          {d.sigla}
                        </button>
                      );
                    })}
                  </div>
                  {turma.diasSelecionados.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">Selecione ao menos 1 dia.</p>
                  )}
                </div>

                {/* Horários */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Horário de início e término: *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-zinc-500 block mb-1">Início:</span>
                      <input
                        type="time"
                        value={turma.horarioPadraoInicio}
                        onChange={(e) => atualizarTurma(idx, { horarioPadraoInicio: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-500 block mb-1">Término:</span>
                      <input
                        type="time"
                        value={turma.horarioPadraoFim}
                        onChange={(e) => atualizarTurma(idx, { horarioPadraoFim: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Faixa Etária */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    Faixa etária dos alunos: *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-zinc-500 block mb-1">Idade mínima:</span>
                      <input
                        type="number"
                        min="5"
                        max="25"
                        value={turma.idadeMinima}
                        onChange={(e) => atualizarTurma(idx, { idadeMinima: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        placeholder="Ex: 10"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-500 block mb-1">Idade máxima:</span>
                      <input
                        type="number"
                        min="5"
                        max="25"
                        value={turma.idadeMaxima}
                        onChange={(e) => atualizarTurma(idx, { idadeMaxima: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        placeholder="Ex: 12"
                      />
                    </div>
                  </div>
                  {Number(turma.idadeMinima) > Number(turma.idadeMaxima) && (
                    <p className="text-xs text-red-600 mt-1">Idade mínima não pode ser maior que idade máxima.</p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPasso(2)}
                className="py-3 px-4 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium rounded-xl transition flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                type="button"
                disabled={!passo3Valido}
                onClick={() => setPasso(4)}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
              >
                Revisar e Enviar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASSO 4: Revisão e Envio */}
        {passo === 4 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">4. Revisão da sua Grade</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Confira como ficou a sua grade semanal antes de confirmar o envio.
              </p>
            </div>

            {/* Cabeçalho do Resumo */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
              <p><strong>Núcleo:</strong> {nucleoNomeFinal}</p>
              <p><strong>Professor:</strong> {professorNomeFinal}</p>
              <p><strong>Modalidade:</strong> {modalidadeNomeFinal}</p>
              <p><strong>Total de Turmas:</strong> {turmas.length}</p>
            </div>

            {/* Resumo de cada turma */}
            <div className="space-y-3">
              {turmas.map((t, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-sm text-zinc-900">
                    <span>{t.nome}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-md">
                      {t.idadeMinima} a {t.idadeMaxima} anos
                    </span>
                  </div>
                  <p className="text-zinc-600">
                    <strong>Dias:</strong> {t.diasSelecionados.join(", ")}
                  </p>
                  <p className="text-zinc-600">
                    <strong>Horário:</strong> {t.horarioPadraoInicio} às {t.horarioPadraoFim}
                  </p>
                </div>
              ))}
            </div>

            {/* Observações livres */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Alguma observação ou recado adicional? (Opcional)
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: No feriado não tem aula, ou temos treino extra às vezes..."
                className="w-full p-3 rounded-xl border border-zinc-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {erroEnvio && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroEnvio}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={enviando}
                onClick={() => setPasso(3)}
                className="py-3 px-4 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium rounded-xl transition flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={handleEnviar}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar e Enviar Informações
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400 border-t border-zinc-100 bg-white">
        Projeto Andorinha • Sistema de Cadastro de Beneficiários
      </footer>
    </div>
  );
}
