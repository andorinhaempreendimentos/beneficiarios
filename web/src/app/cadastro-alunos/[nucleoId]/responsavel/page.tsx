"use client";

import { use, useEffect, useState, useMemo } from "react";
import {
  User,
  Heart,
  Phone,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Send,
  Loader2,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";

type TurnoOpcao = "Manhã" | "Tarde" | "Noite" | "Não sei";

interface DiaParticipacao {
  dia: string;
  turno: TurnoOpcao;
}

interface AlunoItem {
  idTemp: string;
  nomeCompleto: string;
  dataNascimento: string;
  idade: number | null;
  sexo: "M" | "F";
  diasParticipacao: DiaParticipacao[];
}

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const TURNOS: TurnoOpcao[] = ["Manhã", "Tarde", "Noite", "Não sei"];
const DIA_NAO_SEI = "Não sei informar os dias da semana";

const DIAS_DO_MES = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

const MESES_DO_ANO = [
  { valor: "01", rotulo: "01 - Janeiro" },
  { valor: "02", rotulo: "02 - Fevereiro" },
  { valor: "03", rotulo: "03 - Março" },
  { valor: "04", rotulo: "04 - Abril" },
  { valor: "05", rotulo: "05 - Maio" },
  { valor: "06", rotulo: "06 - Junho" },
  { valor: "07", rotulo: "07 - Julho" },
  { valor: "08", rotulo: "08 - Agosto" },
  { valor: "09", rotulo: "09 - Setembro" },
  { valor: "10", rotulo: "10 - Outubro" },
  { valor: "11", rotulo: "11 - Novembro" },
  { valor: "12", rotulo: "12 - Dezembro" },
];

const ANOS_NASCIMENTO = Array.from({ length: 47 }, (_, i) => String(2026 - i));

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

  // 1. DADOS DO RESPONSÁVEL (PRIMEIRA COISA DO FORMULÁRIO)
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [whatsappResponsavel, setWhatsappResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");

  // 2. LISTA DE ALUNOS (FILHOS) JÁ ADICIONADOS
  const [alunos, setAlunos] = useState<AlunoItem[]>([]);

  // 3. CAMPOS DO ALUNO EM DIGITAÇÃO
  const [nomeAluno, setNomeAluno] = useState("");
  const [diaNascAluno, setDiaNascAluno] = useState("");
  const [mesNascAluno, setMesNascAluno] = useState("");
  const [anoNascAluno, setAnoNascAluno] = useState("");
  const [sexoAluno, setSexoAluno] = useState<"M" | "F">("M");

  const dataNascAluno = useMemo(() => {
    if (!diaNascAluno || !mesNascAluno || !anoNascAluno) return "";
    return `${anoNascAluno}-${mesNascAluno.padStart(2, "0")}-${diaNascAluno.padStart(2, "0")}`;
  }, [diaNascAluno, mesNascAluno, anoNascAluno]);

  // Dias e turnos específicos de cada dia para este aluno
  // Ex: { "Segunda-feira": "Manhã", "Quarta-feira": "Não sei", "Não sei informar os dias da semana": "Manhã" }
  const [diasTurnos, setDiasTurnos] = useState<Record<string, TurnoOpcao | null>>({});
  const [abrirDataPicker, setAbrirDataPicker] = useState(false);

  const [erroAluno, setErroAluno] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Tela de Sucesso
  const [sucesso, setSucesso] = useState(false);
  const [sucessoDados, setSucessoDados] = useState<any>(null);
  const [copiadoComprovante, setCopiadoComprovante] = useState(false);

  // Carregar informações do núcleo
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

  // Idade calculada do aluno em digitação
  const idadeAlunoCalculada = useMemo(() => {
    return calcularIdade(dataNascAluno);
  }, [dataNascAluno]);

  // Alternar se o aluno participa neste dia da semana
  function toggleDia(dia: string) {
    setDiasTurnos((prev) => {
      const copy = { ...prev };
      delete copy[DIA_NAO_SEI]; // Se selecionou dia específico, desmarca "Não sei informar os dias"
      if (dia in copy) {
        delete copy[dia];
      } else {
        copy[dia] = null; // Nenhum turno pré-marcado
      }
      return copy;
    });
  }

  // Alternar opção "Não sei informar os dias da semana"
  function toggleNaoSeiDias() {
    setDiasTurnos((prev) => {
      const res: Record<string, TurnoOpcao | null> = {};
      if (!(DIA_NAO_SEI in prev)) {
        res[DIA_NAO_SEI] = null; // Limpa os outros e deixa apenas não sei
      }
      return res;
    });
  }

  // Definir turno de um dia específico
  function setTurnoDoDia(dia: string, turno: TurnoOpcao) {
    setDiasTurnos((prev) => ({
      ...prev,
      [dia]: turno,
    }));
  }

  // Adicionar aluno à lista
  function handleAdicionarAluno() {
    setErroAluno(null);

    const nomeLimpo = nomeAluno.trim().toUpperCase();
    if (!nomeLimpo) {
      setErroAluno("Por favor, informe o nome completo do aluno.");
      return;
    }

    if (!diaNascAluno || !mesNascAluno || !anoNascAluno) {
      setErroAluno("Por favor, selecione o dia, mês e ano de nascimento do aluno.");
      return;
    }

    const diasKeys = Object.keys(diasTurnos);
    if (diasKeys.length === 0) {
      setErroAluno("Selecione os dias em que o aluno vai para o núcleo ou marque 'Não sei informar os dias da semana'.");
      return;
    }

    // Verificar se algum dia marcado não teve turno selecionado
    const diaSemTurno = diasKeys.find((dia) => !diasTurnos[dia]);
    if (diaSemTurno) {
      setErroAluno(`Selecione o turno (ou marque 'Não sei') para: ${diaSemTurno}.`);
      return;
    }

    const diasParticipacao: DiaParticipacao[] = diasKeys.map((dia) => ({
      dia,
      turno: diasTurnos[dia] as TurnoOpcao,
    }));

    const novoAluno: AlunoItem = {
      idTemp: `aluno_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nomeCompleto: nomeLimpo,
      dataNascimento: dataNascAluno,
      idade: idadeAlunoCalculada,
      sexo: sexoAluno,
      diasParticipacao,
    };

    setAlunos((prev) => [...prev, novoAluno]);

    // Limpar campos do aluno para permitir adicionar o próximo
    setNomeAluno("");
    setDiaNascAluno("");
    setMesNascAluno("");
    setAnoNascAluno("");
    setDiasTurnos({});
    setAbrirDataPicker(false);
  }

  // Remover aluno da lista
  function handleRemoverAluno(idTemp: string) {
    setAlunos((prev) => prev.filter((a) => a.idTemp !== idTemp));
  }

  // Enviar informações completas
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroEnvio(null);

    const nomeRespLimpo = nomeResponsavel.trim();
    if (!nomeRespLimpo) {
      setErroEnvio("Por favor, preencha o nome completo do responsável.");
      return;
    }

    const whatsLimpo = whatsappResponsavel.replace(/\D/g, "");
    if (whatsLimpo.length < 10) {
      setErroEnvio("Por favor, informe um WhatsApp válido com DDD para contato.");
      return;
    }

    const cpfRespLimpo = cpfResponsavel.replace(/\D/g, "");
    if (cpfRespLimpo.length !== 11) {
      setErroEnvio("Por favor, informe um CPF válido com 11 dígitos para o responsável.");
      return;
    }

    // Se o responsável preencheu dados de um aluno no formulário (mesmo sem ter clicado em "Adicionar"), salvar e incluir
    let listaFinalAlunos = [...alunos];
    const temDadosDigitados =
      Boolean(nomeAluno.trim()) ||
      Boolean(diaNascAluno || mesNascAluno || anoNascAluno) ||
      Object.keys(diasTurnos).length > 0;

    if (temDadosDigitados) {
      const nomeLimpo = nomeAluno.trim().toUpperCase();
      if (!nomeLimpo) {
        setErroEnvio("Por favor, preencha o nome completo do aluno.");
        return;
      }

      if (!diaNascAluno || !mesNascAluno || !anoNascAluno) {
        setErroEnvio("Por favor, selecione o dia, mês e ano de nascimento do aluno.");
        return;
      }

      const diasKeys = Object.keys(diasTurnos);
      if (diasKeys.length === 0) {
        setErroEnvio("Selecione os dias em que o aluno vai para o núcleo ou marque 'Não sei informar os dias da semana'.");
        return;
      }

      const diaSemTurno = diasKeys.find((dia) => !diasTurnos[dia]);
      if (diaSemTurno) {
        setErroEnvio(`Selecione o turno (ou marque 'Não sei') para: ${diaSemTurno}.`);
        return;
      }

      listaFinalAlunos.push({
        idTemp: `aluno_${Date.now()}`,
        nomeCompleto: nomeLimpo,
        dataNascimento: dataNascAluno,
        idade: idadeAlunoCalculada,
        sexo: sexoAluno,
        diasParticipacao: diasKeys.map((dia) => ({
          dia,
          turno: diasTurnos[dia] as TurnoOpcao,
        })),
      });
    }

    if (listaFinalAlunos.length === 0) {
      setErroEnvio("Por favor, preencha os dados do aluno antes de enviar as informações.");
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        nucleoId: nucleo!.id,
        nucleoNome: nucleo!.identificacao,
        responsavel: {
          nomeCompleto: nomeRespLimpo,
          whatsapp: whatsappResponsavel,
          cpf: formatarCpf(cpfResponsavel),
        },
        filhos: listaFinalAlunos,
      };

      const res = await fetch("/api/cadastro-alunos/responsavel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar informações.");
      }

      const protocolo = `EA-${Math.floor(100000 + Math.random() * 900000)}`;

      setSucessoDados({
        responsavel: {
          nomeCompleto: nomeRespLimpo,
          whatsapp: whatsappResponsavel,
          cpf: formatarCpf(cpfResponsavel),
        },
        alunos: listaFinalAlunos,
        protocolo,
      });
      setSucesso(true);
    } catch (err: any) {
      console.error("Erro ao enviar:", err);
      setErroEnvio(err.message || "Falha ao enviar informações. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // Copiar Comprovante
  function handleCopiarComprovante() {
    if (!sucessoDados || !nucleo) return;

    let texto = `📋 *INFORMAÇÕES DE PARTICIPAÇÃO • ESCOLINHA ESPORTIVA*\n\n` +
      `*Núcleo:* ${nucleo.identificacao}\n` +
      `*Responsável:* ${sucessoDados.responsavel.nomeCompleto}\n` +
      `*CPF Responsável:* ${sucessoDados.responsavel.cpf}\n` +
      `*WhatsApp:* ${sucessoDados.responsavel.whatsapp}\n` +
      `*Protocolo:* ${sucessoDados.protocolo}\n\n` +
      `*ALUNOS CADASTRADOS (${sucessoDados.alunos.length}):*\n`;

    sucessoDados.alunos.forEach((a: AlunoItem, idx: number) => {
      const rotina = a.diasParticipacao
        .map((dp) => `${dp.dia.includes("Não sei") ? "Dias a definir" : dp.dia.replace("-feira", "")} (${dp.turno})`)
        .join(", ");

      texto += `${idx + 1}. *${a.nomeCompleto}* (${a.idade !== null ? `${a.idade} anos` : a.dataNascimento})\n` +
        `   • Rotina: ${rotina}\n`;
    });

    texto += `\nInformações registradas com sucesso para conferência do professor.`;

    navigator.clipboard.writeText(texto);
    setCopiadoComprovante(true);
    setTimeout(() => setCopiadoComprovante(false), 3000);
  }

  // Reiniciar formulário
  function handleNovoCadastro() {
    setNomeResponsavel("");
    setWhatsappResponsavel("");
    setCpfResponsavel("");
    setAlunos([]);
    setNomeAluno("");
    setDiaNascAluno("");
    setMesNascAluno("");
    setAnoNascAluno("");
    setDiasTurnos({});
    setAbrirDataPicker(false);
    setSucesso(false);
    setSucessoDados(null);
  }

  // Carregando
  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-zinc-600">Carregando informações do núcleo...</p>
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

  // TELA DE SUCESSO / COMPROVANTE
  if (sucesso && sucessoDados) {
    return (
      <div className="min-h-screen bg-zinc-50/70 flex flex-col items-center justify-center p-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-sm border border-zinc-200 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <span className="text-3xs uppercase tracking-wider font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Informações Recebidas!
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
              Cadastro Registrado com Sucesso
            </h1>
            <p className="text-xs text-zinc-600">
              Recebemos as informações dos alunos e seus horários de frequência para o núcleo <strong>{nucleo.identificacao}</strong>.
            </p>
          </div>

          {/* Cartão de Resumo */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-3.5">
            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Protocolo:</span>
              <span className="font-mono font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {sucessoDados.protocolo}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-zinc-200/60 pb-2">
              <span className="text-zinc-500 font-medium">Núcleo:</span>
              <strong className="text-zinc-900">{nucleo.identificacao}</strong>
            </div>

            <div className="space-y-1 border-b border-zinc-200/60 pb-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Responsável:</span>
                <strong className="text-zinc-900">{sucessoDados.responsavel.nomeCompleto}</strong>
              </div>
              <div className="flex justify-between items-center text-3xs text-zinc-500">
                <span>CPF: {sucessoDados.responsavel.cpf}</span>
                <span>WhatsApp: {sucessoDados.responsavel.whatsapp}</span>
              </div>
            </div>

            {/* Lista dos Alunos */}
            <div className="space-y-2 pt-1">
              <span className="text-3xs font-black uppercase tracking-wider text-zinc-500 block">
                Alunos ({sucessoDados.alunos.length}):
              </span>
              <div className="space-y-2">
                {sucessoDados.alunos.map((a: AlunoItem, idx: number) => (
                  <div key={a.idTemp} className="p-3 bg-white rounded-xl border border-zinc-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-black text-zinc-900">
                      <span>{idx + 1}. {a.nomeCompleto}</span>
                      <span className="text-3xs px-2 py-0.5 bg-emerald-50 text-emerald-800 font-extrabold rounded-md">
                        {a.idade !== null ? `${a.idade} anos` : "S/D"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {a.diasParticipacao.map((dp) => (
                        <span
                          key={dp.dia}
                          className="text-3xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold"
                        >
                          {dp.dia.includes("Não sei") ? "Dias a definir" : dp.dia.replace("-feira", "")}: <strong>{dp.turno}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
              Suas informações foram salvas com segurança para a organização das turmas pelo professor {professorNome || "responsável"}.
            </span>
          </div>

          <button
            type="button"
            onClick={handleNovoCadastro}
            className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            Enviar Mais Informações
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
              Escolinha Esportiva • Cadastro de Frequência
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
              <span>Local: {nucleo.nomeLocal}</span>
            </div>
          )}

          <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            Preencha seus dados de responsável e indique quais dias e turnos o aluno frequenta o núcleo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. DADOS DO RESPONSÁVEL (PRIMEIRA COISA DO FORMULÁRIO) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-emerald-200 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900">1. Dados do Responsável</h2>
                <p className="text-3xs text-zinc-500">Identificação para contato oficial</p>
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
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telefone / WhatsApp */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    Telefone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={whatsappResponsavel}
                      onChange={(e) => setWhatsappResponsavel(formatarTelefone(e.target.value))}
                      placeholder="(63) 99999-9999"
                      maxLength={15}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* CPF do Responsável */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                    CPF do Responsável *
                  </label>
                  <input
                    type="text"
                    value={cpfResponsavel}
                    onChange={(e) => setCpfResponsavel(formatarCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. DADOS DO ALUNO E PARTICIPAÇÃO */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">2. Dados do Aluno</h2>
                  <p className="text-3xs text-zinc-500">Informe os dias e turnos em que frequenta</p>
                </div>
              </div>
              <span className="text-3xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                {alunos.length} {alunos.length === 1 ? "aluno na lista" : "alunos na lista"}
              </span>
            </div>

            {erroAluno && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{erroAluno}</span>
              </div>
            )}

            {/* Campos do Aluno */}
            <div className="space-y-4 p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200">
              {/* Nome Completo do Aluno */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Nome Completo do Aluno *
                </label>
                <input
                  type="text"
                  value={nomeAluno}
                  onChange={(e) => setNomeAluno(e.target.value)}
                  placeholder="Ex: LUCAS HENRIQUE SILVA"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold uppercase text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Nascimento Unificada com Dropdown Customizado */}
                <div className="space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                      Data de Nascimento *
                    </label>
                    {idadeAlunoCalculada !== null && (
                      <span className="text-3xs font-extrabold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                        {idadeAlunoCalculada} anos
                      </span>
                    )}
                  </div>

                  {/* Campo Unificado Estilizado */}
                  <button
                    type="button"
                    onClick={() => setAbrirDataPicker((prev) => !prev)}
                    className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                      abrirDataPicker
                        ? "border-sky-500 ring-2 ring-sky-500/20 bg-white"
                        : diaNascAluno && mesNascAluno && anoNascAluno
                        ? "border-zinc-300 bg-white text-zinc-900 font-bold"
                        : "border-zinc-300 bg-white text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">
                        {diaNascAluno && mesNascAluno && anoNascAluno
                          ? `${diaNascAluno}/${mesNascAluno}/${anoNascAluno}`
                          : "Escolha o dia, mês e ano"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${
                        abrirDataPicker ? "rotate-180 text-sky-600" : ""
                      }`}
                    />
                  </button>

                  {/* Popover Dropdown Customizado sem Seletores Nativos */}
                  {abrirDataPicker && (
                    <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[360px] mt-1.5 p-3.5 bg-white rounded-2xl border-2 border-sky-300 shadow-2xl z-30 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                        <span className="text-3xs font-black uppercase tracking-wider text-zinc-500">
                          Selecione a data de nascimento:
                        </span>
                        <button
                          type="button"
                          onClick={() => setAbrirDataPicker(false)}
                          className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        {/* Coluna DIA: Mais estreita com fonte destacada */}
                        <div className="col-span-3 space-y-1">
                          <span className="text-3xs font-black uppercase text-zinc-600 text-center block">
                            Dia
                          </span>
                          <div className="h-48 overflow-y-auto space-y-1 p-1 border-2 border-zinc-200/90 rounded-xl bg-zinc-50/70 shadow-2xs">
                            {DIAS_DO_MES.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDiaNascAluno(d)}
                                className={`w-full py-1.5 rounded-lg text-sm font-black transition-all ${
                                  diaNascAluno === d
                                    ? "bg-sky-600 text-white shadow-2xs"
                                    : "text-zinc-800 hover:bg-zinc-200"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Coluna MÊS: Mais larga com fonte aumentada */}
                        <div className="col-span-5 space-y-1">
                          <span className="text-3xs font-black uppercase text-zinc-600 text-center block">
                            Mês
                          </span>
                          <div className="h-48 overflow-y-auto space-y-1 p-1 border-2 border-zinc-200/90 rounded-xl bg-zinc-50/70 shadow-2xs">
                            {MESES_DO_ANO.map((m) => (
                              <button
                                key={m.valor}
                                type="button"
                                onClick={() => setMesNascAluno(m.valor)}
                                className={`w-full py-1.5 px-1 rounded-lg text-xs sm:text-sm font-bold transition-all text-center truncate ${
                                  mesNascAluno === m.valor
                                    ? "bg-sky-600 text-white shadow-2xs font-black"
                                    : "text-zinc-800 hover:bg-zinc-200"
                                }`}
                              >
                                {m.rotulo.split(" - ")[1]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Coluna ANO: Proporcional com fonte aumentada */}
                        <div className="col-span-4 space-y-1">
                          <span className="text-3xs font-black uppercase text-zinc-600 text-center block">
                            Ano
                          </span>
                          <div className="h-48 overflow-y-auto space-y-1 p-1 border-2 border-zinc-200/90 rounded-xl bg-zinc-50/70 shadow-2xs">
                            {ANOS_NASCIMENTO.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => setAnoNascAluno(a)}
                                className={`w-full py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                                  anoNascAluno === a
                                    ? "bg-sky-600 text-white shadow-2xs font-black"
                                    : "text-zinc-800 hover:bg-zinc-200"
                                }`}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Rodapé com Botão Confirmar */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div className="text-3xs text-zinc-600 truncate">
                          {diaNascAluno && mesNascAluno && anoNascAluno ? (
                            <span className="font-bold text-sky-800">
                              {diaNascAluno}/{mesNascAluno}/{anoNascAluno} ({idadeAlunoCalculada} anos)
                            </span>
                          ) : (
                            <span className="text-zinc-400">Selecione dia, mês e ano</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setAbrirDataPicker(false)}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black shadow-2xs cursor-pointer"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
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
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
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
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      Feminino (F)
                    </button>
                  </div>
                </div>
              </div>

              {/* PARTICIPAÇÃO POR DIA E TURNO ESPECÍFICO */}
              <div className="space-y-2 pt-2 border-t border-zinc-200/60">
                <div>
                  <label className="text-3xs font-black uppercase tracking-wider text-zinc-700 block">
                    Dias e turnos que o aluno frequenta no núcleo:
                  </label>
                  <p className="text-3xs text-zinc-500 mt-0.5">
                    Marque os dias em que ele vai e defina se normalmente vai de manhã, à tarde ou à noite em cada dia:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Opção: Não sei informar os dias da semana */}
                  {(() => {
                    const naoSeiMarcado = DIA_NAO_SEI in diasTurnos;
                    const turnoNaoSei = diasTurnos[DIA_NAO_SEI];

                    return (
                      <div
                        className={`p-3 rounded-2xl border-2 transition-all ${
                          naoSeiMarcado
                            ? turnoNaoSei
                              ? "border-emerald-400 bg-white shadow-xs"
                              : "border-amber-300 bg-white shadow-xs"
                            : "border-dashed border-zinc-300 bg-white/60 hover:border-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={toggleNaoSeiDias}
                            className="flex items-center gap-2.5 cursor-pointer text-left flex-1"
                          >
                            <div
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                naoSeiMarcado
                                  ? "bg-amber-600 border-amber-600 text-white"
                                  : "border-zinc-300 bg-white"
                              }`}
                            >
                              {naoSeiMarcado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <span
                                className={`text-xs font-black ${
                                  naoSeiMarcado ? "text-zinc-900" : "text-zinc-700"
                                }`}
                              >
                                Não sei informar os dias da semana
                              </span>
                              <span className="block text-3xs text-zinc-400 font-medium">
                                Marque se você ainda não tem certeza dos dias em que o aluno frequenta
                              </span>
                            </div>
                          </button>

                          {naoSeiMarcado && (
                            <span
                              className={`text-3xs font-extrabold px-2 py-0.5 rounded-md border ${
                                turnoNaoSei
                                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                                  : "text-amber-800 bg-amber-50 border-amber-200"
                              }`}
                            >
                              {turnoNaoSei || "Selecione o turno"}
                            </span>
                          )}
                        </div>

                        {naoSeiMarcado && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-3xs font-bold text-zinc-500">
                              Turno que costuma ir:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
                              {TURNOS.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTurnoDoDia(DIA_NAO_SEI, t)}
                                  className={`px-3 py-1.5 rounded-lg text-3xs font-black transition-all cursor-pointer ${
                                    turnoNaoSei === t
                                      ? "bg-emerald-600 text-white shadow-2xs"
                                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="relative py-1 flex items-center">
                    <div className="flex-grow border-t border-zinc-200"></div>
                    <span className="flex-shrink mx-2 text-3xs font-bold uppercase tracking-wider text-zinc-400">
                      ou escolha os dias específicos
                    </span>
                    <div className="flex-grow border-t border-zinc-200"></div>
                  </div>

                  {DIAS_SEMANA.map((dia) => {
                    const estaMarcado = dia in diasTurnos;
                    const turnoAtual = diasTurnos[dia];

                    return (
                      <div
                        key={dia}
                        className={`p-3 rounded-2xl border-2 transition-all ${
                          estaMarcado
                            ? turnoAtual
                              ? "border-emerald-400 bg-white shadow-xs"
                              : "border-amber-300 bg-white shadow-xs"
                            : "border-zinc-200 bg-white/70 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleDia(dia)}
                            className="flex items-center gap-2.5 cursor-pointer text-left flex-1"
                          >
                            <div
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                estaMarcado
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-zinc-300 bg-white"
                              }`}
                            >
                              {estaMarcado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-xs font-black ${estaMarcado ? "text-zinc-900" : "text-zinc-600"}`}>
                              {dia}
                            </span>
                          </button>

                          {estaMarcado && (
                            <span
                              className={`text-3xs font-extrabold px-2 py-0.5 rounded-md border ${
                                turnoAtual
                                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                                  : "text-amber-800 bg-amber-50 border-amber-200"
                              }`}
                            >
                              {turnoAtual || "Selecione o turno"}
                            </span>
                          )}
                        </div>

                        {/* Seletor de Turno específico deste dia */}
                        {estaMarcado && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-3xs font-bold text-zinc-500">
                              Turno na {dia.replace("-feira", "")}:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
                              {TURNOS.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTurnoDoDia(dia, t)}
                                  className={`px-3 py-1.5 rounded-lg text-3xs font-black transition-all cursor-pointer ${
                                    turnoAtual === t
                                      ? "bg-emerald-600 text-white shadow-2xs"
                                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão de Adicionar à Lista */}
              <button
                type="button"
                onClick={handleAdicionarAluno}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Adicionar Este Aluno à Lista</span>
              </button>
            </div>

            {/* Lista dos Alunos Já Adicionados */}
            {alunos.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Alunos Prontos para Envio ({alunos.length}):</span>
                </h3>
                <div className="space-y-2">
                  {alunos.map((a, index) => (
                    <div
                      key={a.idTemp}
                      className="p-3.5 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-3xs font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <strong className="text-xs sm:text-sm font-black text-zinc-900">
                            {a.nomeCompleto}
                          </strong>
                          <span
                            className={`text-3xs px-2 py-0.5 rounded-md font-black ${
                              a.sexo === "M" ? "bg-sky-100 text-sky-800" : "bg-pink-100 text-pink-800"
                            }`}
                          >
                            {a.sexo}
                          </span>
                          <span className="text-3xs text-zinc-400 font-medium">
                            ({a.idade !== null ? `${a.idade} anos` : a.dataNascimento})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {a.diasParticipacao.map((dp) => (
                            <span
                              key={dp.dia}
                              className="text-3xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold"
                            >
                              {dp.dia.includes("Não sei") ? "Dias a definir" : dp.dia.replace("-feira", "")}: <strong>{dp.turno}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverAluno(a.idTemp)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Remover aluno da lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Erro Inline */}
          {erroEnvio && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{erroEnvio}</span>
            </div>
          )}

          {/* Botão de Envio Principal: "Enviar informações" */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando informações...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  Enviar informações {alunos.length > 0 ? `(${alunos.length} ${alunos.length === 1 ? "aluno" : "alunos"})` : ""}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
