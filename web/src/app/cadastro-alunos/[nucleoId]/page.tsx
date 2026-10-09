"use client";

import { use, useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Calendar,
  Sparkles,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  Plus,
  HelpCircle,
  X,
} from "lucide-react";

interface HorarioTurma {
  id: string;
  diaSemanaNumero: number;
  diaSemanaNome: string;
  horaInicio: string;
  horaFim: string;
}

interface Turma {
  id: string;
  nome: string;
  identificador: string;
  idadeMinima: number;
  idadeMaxima: number;
  vagasTotais: number;
  horarios: HorarioTurma[];
  diasResumo: string;
  horarioResumo: string;
}

interface AlunoCadastrado {
  idTemp: string;
  nomeCompleto: string;
  dataNascimento: string;
  idade: number | null;
  sexo: "M" | "F";
  cpf: string;
  turmaId: string;
  turmaNome: string;
  turmaIdentificador: string;
}

function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

function formatarCpf(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
}

export default function PaginaCadastroAlunos({
  params,
}: {
  params: Promise<{ nucleoId: string }>;
}) {
  const resolvedParams = use(params);
  const nucleoId = resolvedParams.nucleoId;

  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Dados do núcleo e turmas
  const [nucleo, setNucleo] = useState<{ id: string; identificacao: string; nomeLocal: string } | null>(null);
  const [professorNome, setProfessorNome] = useState("");
  const [modalidadeNome, setModalidadeNome] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // Lista de alunos adicionados
  const [alunos, setAlunos] = useState<AlunoCadastrado[]>([]);

  // Campos do formulário
  const [formNome, setFormNome] = useState("");
  const [formDataNasc, setFormDataNasc] = useState("");
  const [formSexo, setFormSexo] = useState<"M" | "F">("M");
  const [formCpf, setFormCpf] = useState("");
  const [formTurmaId, setFormTurmaId] = useState("");
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Modal de confirmação pré-envio
  const [modalConfirmacao, setModalConfirmacao] = useState(false);

  // Observações e status de salvamento
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sucessoMensagem, setSucessoMensagem] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // Carregar dados da API
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErroCarregamento(null);

        const res = await fetch(`/api/cadastro-alunos/${nucleoId}`);
        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          throw new Error(erro.error || "Não foi possível carregar as informações do núcleo.");
        }

        const data = await res.json();
        setNucleo(data.nucleo);
        setProfessorNome(data.professor?.nome || "");
        setModalidadeNome(data.modalidade || "Futebol");
        setTurmas(data.turmas || []);

        if (data.turmas && data.turmas.length > 0) {
          setFormTurmaId(data.turmas[0].id);
        }

        // Recuperar alunos salvos do backend
        if (Array.isArray(data.alunosJaSalvos) && data.alunosJaSalvos.length > 0) {
          setAlunos(data.alunosJaSalvos);
        } else {
          // Recuperar rascunho salvo no localStorage se existir
          try {
            const draft = localStorage.getItem(`cadastro_alunos_draft_${nucleoId}`);
            if (draft) {
              const parsed = JSON.parse(draft);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAlunos(parsed);
              }
            }
          } catch (e) {
            // Ignorar erro de localStorage
          }
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setErroCarregamento(err.message || "Erro desconhecido ao carregar página.");
      } finally {
        setCarregando(false);
      }
    }

    if (nucleoId) {
      carregarDados();
    }
  }, [nucleoId]);

  // Salvar rascunho automático no localStorage
  useEffect(() => {
    if (nucleoId && alunos.length > 0 && !sucesso) {
      try {
        localStorage.setItem(`cadastro_alunos_draft_${nucleoId}`, JSON.stringify(alunos));
      } catch (e) {
        // Ignorar
      }
    }
  }, [nucleoId, alunos, sucesso]);

  // Idade calculada do formulário
  const idadeCalculada = useMemo(() => {
    return calcularIdade(formDataNasc);
  }, [formDataNasc]);

  // Turma sugerida com base na idade
  const turmaSugerida = useMemo(() => {
    if (idadeCalculada === null || turmas.length === 0) return null;
    return (
      turmas.find(
        (t) => idadeCalculada >= t.idadeMinima && idadeCalculada <= t.idadeMaxima
      ) || null
    );
  }, [idadeCalculada, turmas]);

  // Atualizar turma selecionada quando uma sugestão for detectada
  useEffect(() => {
    if (turmaSugerida) {
      setFormTurmaId(turmaSugerida.id);
    }
  }, [turmaSugerida]);

  // Resumo de contagem por turma
  const contagemPorTurma = useMemo(() => {
    const mapa: Record<string, number> = {};
    alunos.forEach((a) => {
      mapa[a.turmaId] = (mapa[a.turmaId] || 0) + 1;
    });
    return mapa;
  }, [alunos]);

  // Adicionar aluno à lista
  function handleAdicionarAluno() {
    setErroForm(null);

    const nomeLimpo = formNome.trim().toUpperCase();
    if (!nomeLimpo) {
      setErroForm("Por favor, informe o nome completo do aluno.");
      return;
    }

    if (!formDataNasc) {
      setErroForm("Informe a data de nascimento do aluno.");
      return;
    }

    if (!formTurmaId) {
      setErroForm("Selecione a turma em que o aluno vai participar.");
      return;
    }

    const turmaEscolhida = turmas.find((t) => t.id === formTurmaId);
    if (!turmaEscolhida) {
      setErroForm("Turma selecionada inválida.");
      return;
    }

    const novoAluno: AlunoCadastrado = {
      idTemp: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nomeCompleto: nomeLimpo,
      dataNascimento: formDataNasc,
      idade: idadeCalculada,
      sexo: formSexo,
      cpf: formCpf ? formatarCpf(formCpf) : "",
      turmaId: turmaEscolhida.id,
      turmaNome: turmaEscolhida.nome,
      turmaIdentificador: turmaEscolhida.identificador,
    };

    setAlunos((prev) => [novoAluno, ...prev]);

    // Limpar campos
    setFormNome("");
    setFormDataNasc("");
    setFormCpf("");
  }

  // Remover aluno da lista
  function handleRemoverAluno(idTemp: string) {
    setAlunos((prev) => {
      const atualizados = prev.filter((a) => a.idTemp !== idTemp);
      if (nucleoId) {
        try {
          localStorage.setItem(`cadastro_alunos_draft_${nucleoId}`, JSON.stringify(atualizados));
        } catch (e) {}
      }
      return atualizados;
    });
  }

  // Salvar lista completa
  async function handleSalvarFinal() {
    if (!nucleo) return;
    if (alunos.length === 0) {
      setErroEnvio("Adicione pelo menos um aluno antes de salvar.");
      return;
    }

    try {
      setSalvando(true);
      setErroEnvio(null);

      const res = await fetch("/api/cadastro-alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nucleoId: nucleo.id,
          nucleoNome: nucleo.identificacao,
          professorNome,
          alunos,
          observacoes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar cadastro de alunos.");
      }

      setModalConfirmacao(false);
      setSucesso(true);
      setSucessoMensagem(data.message || `Lista de ${alunos.length} alunos cadastrada com sucesso!`);

      // Limpar rascunho de localStorage pois foi salvo no servidor
      try {
        localStorage.removeItem(`cadastro_alunos_draft_${nucleoId}`);
      } catch (e) {}
    } catch (err: any) {
      console.error("Erro ao enviar:", err);
      setErroEnvio(err.message || "Falha ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Tela de Carregamento
  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-sky-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-zinc-600">Carregando formulário do núcleo...</p>
      </div>
    );
  }

  // Tela de Erro ao Carregar
  if (erroCarregamento || !nucleo) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-sm border border-zinc-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-zinc-900">Núcleo não encontrado</h2>
          <p className="text-xs text-zinc-600">{erroCarregamento || "Não foi possível carregar este núcleo."}</p>
        </div>
      </div>
    );
  }

  // Tela de Sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen bg-zinc-50/70 flex flex-col items-center justify-center p-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-sm border border-zinc-200 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900">Cadastro Salvo com Sucesso!</h2>
            <p className="text-xs text-zinc-600">{sucessoMensagem}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Núcleo:</span>
              <strong className="text-zinc-900">{nucleo.identificacao}</strong>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Professor:</span>
              <strong className="text-zinc-900">{professorNome || "Responsável"}</strong>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Total de Alunos:</span>
              <strong className="text-emerald-700 font-black">{alunos.length} cadastrados</strong>
            </div>

            {/* Resumo por Turma */}
            <div className="space-y-1.5 pt-1">
              <span className="text-3xs font-black uppercase tracking-wider text-zinc-500 block">
                Distribuição por Turma:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {turmas.map((t) => {
                  const qtd = contagemPorTurma[t.id] || 0;
                  return (
                    <div key={t.id} className="bg-white p-2 rounded-xl border border-zinc-200 text-xs flex justify-between">
                      <span className="font-bold text-zinc-700">Turma {t.identificador}:</span>
                      <strong className="text-sky-700">{qtd} alunos</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-3xs text-emerald-800 font-semibold flex items-center gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dados gravados com segurança para auditoria e conferência oficial da coordenação.</span>
          </div>

          <button
            type="button"
            onClick={() => setSucesso(false)}
            className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            Revisar Lista ou Adicionar Mais Alunos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 py-6 sm:py-10 px-4">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Cabeçalho do Núcleo */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-3xs uppercase tracking-wider font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Fase de Cadastro de Alunos
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 mt-2">
                {nucleo.identificacao}
              </h1>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">
                Professor: <strong>{professorNome || "Responsável pelo Núcleo"}</strong> • Modalidade: <strong>{modalidadeNome}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold self-start sm:self-center">
              <Users className="w-4 h-4 text-sky-600" />
              <span>{alunos.length} {alunos.length === 1 ? "aluno na lista" : "alunos na lista"}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            Cadastre abaixo os alunos atendidos nos horários deste núcleo. Os dados serão conferidos e homologados pela coordenação.
          </p>
        </div>

        {/* Card do Formulário de Cadastro Rápido */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-amber-200 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-zinc-900">Novo Aluno</h2>
            </div>
            <span className="text-3xs font-extrabold text-zinc-400 uppercase tracking-wider">
              Campos com * obrigatórios
            </span>
          </div>

          {erroForm && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Nome Completo */}
            <div className="space-y-1">
              <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                1. Nome Completo do Aluno *
              </label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: JOÃO PEDRO SILVA"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 2. Data de Nascimento */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    2. Data de Nascimento *
                  </label>
                  {idadeCalculada !== null && (
                    <span className="text-3xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      {idadeCalculada} anos
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formDataNasc}
                  onChange={(e) => setFormDataNasc(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* 3. Sexo */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  3. Sexo *
                </label>
                <div className="grid grid-cols-2 gap-2 h-11">
                  <button
                    type="button"
                    onClick={() => setFormSexo("M")}
                    className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                      formSexo === "M"
                        ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    Masculino (M)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSexo("F")}
                    className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                      formSexo === "F"
                        ? "bg-pink-600 text-white border-pink-600 shadow-2xs"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    Feminino (F)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4. CPF (Opcional) */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  4. CPF do Aluno (opcional)
                </label>
                <input
                  type="text"
                  value={formCpf}
                  onChange={(e) => setFormCpf(formatarCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* 5. Turma de Destino */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    5. Turma de Destino *
                  </label>
                  {turmaSugerida && (
                    <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Sugerida por idade
                    </span>
                  )}
                </div>
                <select
                  value={formTurmaId}
                  onChange={(e) => setFormTurmaId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {turmas.length === 0 ? (
                    <option value="">Nenhuma turma cadastrada</option>
                  ) : (
                    turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        Turma {t.identificador} ({t.idadeMinima} a {t.idadeMaxima} anos) — {t.diasResumo}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Botão de Adicionar à Lista */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAdicionarAluno}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Adicionar Aluno à Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Alunos Adicionados */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-black text-zinc-900">
                Alunos na Lista ({alunos.length})
              </h2>
            </div>
            {alunos.length > 0 && (
              <span className="text-3xs font-bold text-zinc-500">
                Revise antes de finalizar
              </span>
            )}
          </div>

          {alunos.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-zinc-600">Nenhum aluno adicionado ainda.</p>
              <p className="text-3xs text-zinc-400 max-w-sm mx-auto">
                Preencha os dados no formulário acima e clique em &quot;Adicionar Aluno à Lista&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {alunos.map((a, index) => (
                <div
                  key={a.idTemp}
                  className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-white transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-3xs font-black flex items-center justify-center">
                        {alunos.length - index}
                      </span>
                      <strong className="text-xs sm:text-sm font-black text-zinc-900">
                        {a.nomeCompleto}
                      </strong>
                      <span
                        className={`text-3xs px-2 py-0.5 rounded-md font-black ${
                          a.sexo === "M"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-pink-100 text-pink-800"
                        }`}
                      >
                        {a.sexo}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xs text-zinc-500">
                      <span>Nasc: {a.dataNascimento} ({a.idade !== null ? `${a.idade} anos` : "S/D"})</span>
                      {a.cpf && <span>• CPF: {a.cpf}</span>}
                      <span className="font-bold text-sky-700">
                        • Turma {a.turmaIdentificador}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoverAluno(a.idTemp)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Remover aluno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé de Envio */}
          {alunos.length > 0 && (
            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <div className="space-y-1.5">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Observações adicionais (opcional):
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Lista de espera, documentação pendente ou detalhes dos horários."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {erroEnvio && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{erroEnvio}</span>
                </div>
              )}

              <button
                type="button"
                disabled={salvando || alunos.length === 0}
                onClick={() => setModalConfirmacao(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Finalizar e Salvar Lista ({alunos.length} {alunos.length === 1 ? "aluno" : "alunos"})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação Pré-Envio */}
      {modalConfirmacao && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-xl border border-zinc-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-zinc-900">Confirmar Envio</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalConfirmacao(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-600">
                Você está prestes a enviar a lista com <strong>{alunos.length} alunos</strong> para o núcleo <strong>{nucleo.identificacao}</strong>.
              </p>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <span className="text-3xs font-black uppercase tracking-wider text-zinc-500">
                  Resumo de Alunos por Turma:
                </span>
                <div className="space-y-1">
                  {turmas.map((t) => {
                    const qtd = contagemPorTurma[t.id] || 0;
                    if (qtd === 0) return null;
                    return (
                      <div key={t.id} className="flex justify-between text-xs">
                        <span className="font-bold text-zinc-700">Turma {t.identificador}:</span>
                        <strong className="text-sky-700">{qtd} alunos</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={salvando}
                onClick={() => setModalConfirmacao(false)}
                className="py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Voltar e Revisar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={handleSalvarFinal}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirmar Envio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
