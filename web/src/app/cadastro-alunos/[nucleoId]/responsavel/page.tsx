"use client";

import { use, useEffect, useState, useMemo } from "react";
import {
  User,
  Heart,
  Calendar,
  Sparkles,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Send,
  Loader2,
  Users,
  Copy,
  Check,
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

function formatarTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2) return nums ? `(${nums}` : "";
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
}

export default function PaginaCadastroResponsavel({
  params,
}: {
  params: Promise<{ nucleoId: string }>;
}) {
  const resolvedParams = use(params);
  const nucleoId = resolvedParams.nucleoId;

  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Informações do núcleo
  const [nucleo, setNucleo] = useState<{ id: string; identificacao: string; nomeLocal: string } | null>(null);
  const [professorNome, setProfessorNome] = useState("");
  const [modalidadeNome, setModalidadeNome] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // Dados do Filho (Aluno)
  const [nomeAluno, setNomeAluno] = useState("");
  const [dataNascAluno, setDataNascAluno] = useState("");
  const [sexoAluno, setSexoAluno] = useState<"M" | "F">("M");
  const [cpfAluno, setCpfAluno] = useState("");
  const [turmaId, setTurmaId] = useState("");

  // Dados do Responsável
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [parentesco, setParentesco] = useState("Mãe");
  const [whatsapp, setWhatsapp] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Validação e Envio
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sucessoDados, setSucessoDados] = useState<any>(null);

  // Carregar dados do núcleo
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
          setTurmaId(data.turmas[0].id);
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

  // Idade calculada
  const idadeCalculada = useMemo(() => {
    return calcularIdade(dataNascAluno);
  }, [dataNascAluno]);

  // Turma sugerida
  const turmaSugerida = useMemo(() => {
    if (idadeCalculada === null || turmas.length === 0) return null;
    return (
      turmas.find(
        (t) => idadeCalculada >= t.idadeMinima && idadeCalculada <= t.idadeMaxima
      ) || null
    );
  }, [idadeCalculada, turmas]);

  // Selecionar turma sugerida automaticamente
  useEffect(() => {
    if (turmaSugerida) {
      setTurmaId(turmaSugerida.id);
    }
  }, [turmaSugerida]);

  // Turma escolhida atualmente
  const turmaSelecionada = useMemo(() => {
    return turmas.find((t) => t.id === turmaId) || null;
  }, [turmas, turmaId]);

  // Feedback de cópia do comprovante
  const [copiadoComprovante, setCopiadoComprovante] = useState(false);

  function handleCopiarComprovante() {
    if (!sucessoDados || !nucleo) return;
    const texto = `📋 *COMPROVANTE DE PRÉ-INSCRIÇÃO • ESCOLINHA ESPORTIVA*\n\n` +
      `*Aluno:* ${sucessoDados.alunoNome}\n` +
      `*Núcleo:* ${nucleo.identificacao}\n` +
      `*Turma:* Turma ${sucessoDados.turma.identificador} (${sucessoDados.turma.diasResumo})\n` +
      `*Horário:* ${sucessoDados.turma.horarioResumo}\n` +
      `*Responsável:* ${sucessoDados.responsavelNome}\n` +
      `*WhatsApp:* ${sucessoDados.whatsapp}\n` +
      `*Protocolo:* ${sucessoDados.protocolo}\n\n` +
      `A coordenação entrará em contato para confirmar o início dos treinos.`;

    navigator.clipboard.writeText(texto);
    setCopiadoComprovante(true);
    setTimeout(() => setCopiadoComprovante(false), 3000);
  }

  // Submissão do formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroForm(null);

    const nomeAlunoLimpo = nomeAluno.trim().toUpperCase();
    if (!nomeAlunoLimpo) {
      setErroForm("Por favor, informe o nome completo do aluno.");
      return;
    }

    if (!dataNascAluno) {
      setErroForm("Por favor, preencha a data de nascimento do aluno.");
      return;
    }

    if (!turmaId || !turmaSelecionada) {
      setErroForm("Selecione a turma em que deseja matricular o aluno.");
      return;
    }

    const nomeRespLimpo = nomeResponsavel.trim();
    if (!nomeRespLimpo) {
      setErroForm("Por favor, informe o nome completo do responsável.");
      return;
    }

    const whatsappLimpo = whatsapp.replace(/\D/g, "");
    if (whatsappLimpo.length < 10) {
      setErroForm("Por favor, informe um número de WhatsApp válido com DDD.");
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        nucleoId: nucleo!.id,
        nucleoNome: nucleo!.identificacao,
        aluno: {
          nomeCompleto: nomeAlunoLimpo,
          dataNascimento: dataNascAluno,
          idade: idadeCalculada,
          sexo: sexoAluno,
          cpf: cpfAluno || null,
          turmaId: turmaSelecionada.id,
          turmaNome: turmaSelecionada.nome,
          turmaIdentificador: turmaSelecionada.identificador,
        },
        responsavel: {
          nomeCompleto: nomeRespLimpo,
          parentesco,
          whatsapp,
        },
        observacoes,
      };

      const res = await fetch("/api/cadastro-alunos/responsavel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar inscrição.");
      }

      const protocoloGerado = `EA-${Math.floor(100000 + Math.random() * 900000)}`;

      setSucessoDados({
        alunoNome: nomeAlunoLimpo,
        idade: idadeCalculada,
        turma: turmaSelecionada,
        responsavelNome: nomeRespLimpo,
        whatsapp,
        protocolo: protocoloGerado,
      });
      setSucesso(true);
    } catch (err: any) {
      console.error("Erro ao enviar:", err);
      setErroForm(err.message || "Falha ao enviar inscrição. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // Limpar para cadastrar outro filho
  function handleNovoCadastro() {
    setNomeAluno("");
    setDataNascAluno("");
    setCpfAluno("");
    setObservacoes("");
    setSucesso(false);
    setSucessoDados(null);
  }

  // Carregando
  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-zinc-600">Carregando informações da escolinha...</p>
      </div>
    );
  }

  // Erro ao carregar
  if (erroCarregamento || !nucleo) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-sm border border-zinc-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-zinc-900">Núcleo não encontrado</h2>
          <p className="text-xs text-zinc-600">{erroCarregamento || "Não foi possível carregar as informações."}</p>
        </div>
      </div>
    );
  }

  // Tela de Sucesso / Comprovante
  if (sucesso && sucessoDados) {
    return (
      <div className="min-h-screen bg-zinc-50/70 flex flex-col items-center justify-center p-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-sm border border-zinc-200 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <span className="text-3xs uppercase tracking-wider font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Inscrição Recebida!
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
              Matrícula em Processamento
            </h1>
            <p className="text-xs text-zinc-600">
              Recebemos os dados do aluno com sucesso. Nossa equipe entrará em contato via WhatsApp para confirmar o início das atividades.
            </p>
          </div>

          {/* Cartão de Resumo da Inscrição */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Protocolo:</span>
              <span className="font-mono font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {sucessoDados.protocolo}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Aluno:</span>
              <strong className="text-zinc-900">{sucessoDados.alunoNome}</strong>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Núcleo:</span>
              <strong className="text-zinc-900">{nucleo.identificacao}</strong>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Turma Escolhida:</span>
              <strong className="text-sky-700 font-black">
                Turma {sucessoDados.turma.identificador} ({sucessoDados.turma.diasResumo})
              </strong>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Horário dos Treinos:</span>
              <strong className="text-zinc-800">{sucessoDados.turma.horarioResumo}</strong>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Responsável / WhatsApp:</span>
              <strong className="text-zinc-900">{sucessoDados.whatsapp}</strong>
            </div>
          </div>

          {/* Botão de Copiar Comprovante */}
          <button
            type="button"
            onClick={handleCopiarComprovante}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              copiadoComprovante
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200"
            }`}
          >
            {copiadoComprovante ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Comprovante Copiado para a Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Resumo do Comprovante</span>
              </>
            )}
          </button>

          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-3xs text-zinc-600 font-medium flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Suas informações estão salvas. No primeiro dia de treino, compareça com documento do aluno e do responsável para confirmação com o professor {professorNome || "da escolinha"}.
            </span>
          </div>

          <button
            type="button"
            onClick={handleNovoCadastro}
            className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            Cadastrar Outro Filho Neste Núcleo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 py-6 sm:py-10 px-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Cabeçalho de Apresentação */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-3">
          <div>
            <span className="text-3xs uppercase tracking-wider font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Escolinha Esportiva • Inscrição Aberta
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 mt-2">
              {nucleo.identificacao}
            </h1>
            <p className="text-xs text-zinc-600 font-medium mt-0.5">
              Modalidade: <strong>{modalidadeNome}</strong> • Prof: <strong>{professorNome || "Responsável pelo Núcleo"}</strong>
            </p>
          </div>

          {nucleo.nomeLocal && (
            <div className="flex items-center gap-1.5 text-3xs text-zinc-500">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Local de Treino: {nucleo.nomeLocal}</span>
            </div>
          )}

          <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            Preencha o formulário abaixo para inscrever seu filho no projeto esportivo gratuito.
          </p>
        </div>

        {/* Formulário do Responsável */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SEÇÃO 1: DADOS DO ALUNO */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900">1. Dados do Aluno (Filho)</h2>
                <p className="text-3xs text-zinc-500">Informações de quem vai treinar</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nome Completo */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Nome Completo do Aluno *
                </label>
                <input
                  type="text"
                  value={nomeAluno}
                  onChange={(e) => setNomeAluno(e.target.value)}
                  placeholder="Ex: LUCAS HENRIQUE SILVA"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Nascimento */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                      Data de Nascimento *
                    </label>
                    {idadeCalculada !== null && (
                      <span className="text-3xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {idadeCalculada} anos
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dataNascAluno}
                    onChange={(e) => setDataNascAluno(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Sexo */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    Sexo *
                  </label>
                  <div className="grid grid-cols-2 gap-2 h-11">
                    <button
                      type="button"
                      onClick={() => setSexoAluno("M")}
                      className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                        sexoAluno === "M"
                          ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      Masculino (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSexoAluno("F")}
                      className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                        sexoAluno === "F"
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
                {/* CPF do Aluno */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    CPF do Aluno (opcional)
                  </label>
                  <input
                    type="text"
                    value={cpfAluno}
                    onChange={(e) => setCpfAluno(formatarCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Turma de Interesse */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                      Turma de Interesse *
                    </label>
                    {turmaSugerida && (
                      <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Sugerida por idade
                      </span>
                    )}
                  </div>
                  <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

              {/* Detalhe do Horário da Turma Selecionada */}
              {turmaSelecionada && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-900">
                    <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Dias: <strong>{turmaSelecionada.diasResumo}</strong>
                    </span>
                  </div>
                  <strong className="text-sky-800">{turmaSelecionada.horarioResumo}</strong>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DO RESPONSÁVEL */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900">2. Dados do Responsável</h2>
                <p className="text-3xs text-zinc-500">Contato para confirmação e avisos dos treinos</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nome do Responsável */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Nome Completo do Responsável *
                </label>
                <input
                  type="text"
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Ex: MARIA APARECIDA DA SILVA"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Parentesco */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    Parentesco *
                  </label>
                  <select
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó / Avô">Avó / Avô</option>
                    <option value="Tio / Tia">Tio / Tia</option>
                    <option value="Responsável Legal">Outro Responsável Legal</option>
                  </select>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    WhatsApp para Contato *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
                      placeholder="(63) 99999-9999"
                      maxLength={15}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Observações Opcionais */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Observações de saúde ou gerais (opcional):
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Alguma alergia, restrição física ou informação importante para o professor saber?"
                  rows={2}
                  className="w-full p-3 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Erro Inline */}
          {erroForm && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando Inscrição...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Concluir Inscrição do Aluno</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
