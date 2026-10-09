"use client";

import { use, useEffect, useState, useMemo } from "react";
import {
  User,
  Heart,
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Send,
  Loader2,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  Sun,
  Sunrise,
  Moon,
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

interface FilhoItem {
  idTemp: string;
  nomeCompleto: string;
  dataNascimento: string;
  idade: number | null;
  sexo: "M" | "F";
  cpf: string;
  diasSemana: string[];
  turno: "Manhã" | "Tarde" | "Noite";
  observacoes: string;
}

const DIAS_DISPONIVEIS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const TURNOS: Array<"Manhã" | "Tarde" | "Noite"> = ["Manhã", "Tarde", "Noite"];

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

  // 1. DADOS DO RESPONSÁVEL (PRIMEIRA COISA DO FORMULÁRIO)
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [whatsappResponsavel, setWhatsappResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");

  // 2. LISTA DE FILHOS CADASTRADOS
  const [filhos, setFilhos] = useState<FilhoItem[]>([]);

  // 3. CAMPOS DO FORMULÁRIO PARA ADICIONAR UM FILHO
  const [nomeFilho, setNomeFilho] = useState("");
  const [dataNascFilho, setDataNascFilho] = useState("");
  const [sexoFilho, setSexoFilho] = useState<"M" | "F">("M");
  const [cpfFilho, setCpfFilho] = useState("");
  const [diasFilho, setDiasFilho] = useState<string[]>(["Segunda-feira", "Quarta-feira"]);
  const [turnoFilho, setTurnoFilho] = useState<"Manhã" | "Tarde" | "Noite">("Tarde");
  const [obsFilho, setObsFilho] = useState("");
  const [erroFilho, setErroFilho] = useState<string | null>(null);

  // Estado de envio e tela de sucesso
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
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
        setTurmas(data.turmas || []);
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

  // Idade calculada do filho em digitação
  const idadeFilhoCalculada = useMemo(() => {
    return calcularIdade(dataNascFilho);
  }, [dataNascFilho]);

  // Alternar dia da semana
  function toggleDia(dia: string) {
    setDiasFilho((prev) => {
      if (prev.includes(dia)) {
        if (prev.length === 1) return prev; // manter pelo menos 1 dia
        return prev.filter((d) => d !== dia);
      } else {
        return [...prev, dia];
      }
    });
  }

  // Adicionar filho à lista
  function handleAdicionarFilho() {
    setErroFilho(null);

    const nomeLimpo = nomeFilho.trim().toUpperCase();
    if (!nomeLimpo) {
      setErroFilho("Por favor, informe o nome completo do filho.");
      return;
    }

    if (!dataNascFilho) {
      setErroFilho("Informe a data de nascimento do aluno.");
      return;
    }

    if (diasFilho.length === 0) {
      setErroFilho("Selecione pelo menos um dia da semana que o aluno pode participar.");
      return;
    }

    const novoFilho: FilhoItem = {
      idTemp: `filho_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nomeCompleto: nomeLimpo,
      dataNascimento: dataNascFilho,
      idade: idadeFilhoCalculada,
      sexo: sexoFilho,
      cpf: cpfFilho ? formatarCpf(cpfFilho) : "",
      diasSemana: diasFilho,
      turno: turnoFilho,
      observacoes: obsFilho.trim(),
    };

    setFilhos((prev) => [...prev, novoFilho]);

    // Limpar campos do filho
    setNomeFilho("");
    setDataNascFilho("");
    setCpfFilho("");
    setObsFilho("");
  }

  // Remover filho da lista
  function handleRemoverFilho(idTemp: string) {
    setFilhos((prev) => prev.filter((f) => f.idTemp !== idTemp));
  }

  // Enviar inscrição completa
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
      setErroEnvio("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }

    const cpfRespLimpo = cpfResponsavel.replace(/\D/g, "");
    if (cpfRespLimpo.length !== 11) {
      setErroEnvio("Por favor, informe um CPF válido com 11 dígitos para o responsável.");
      return;
    }

    // Se o usuário digitou dados de um filho mas esqueceu de clicar em 'Adicionar Filho', adicionar automaticamente
    let listaFinalFilhos = [...filhos];
    if (listaFinalFilhos.length === 0 && nomeFilho.trim() && dataNascFilho) {
      const autoFilho: FilhoItem = {
        idTemp: `filho_${Date.now()}`,
        nomeCompleto: nomeFilho.trim().toUpperCase(),
        dataNascimento: dataNascFilho,
        idade: idadeFilhoCalculada,
        sexo: sexoFilho,
        cpf: cpfFilho ? formatarCpf(cpfFilho) : "",
        diasSemana: diasFilho,
        turno: turnoFilho,
        observacoes: obsFilho.trim(),
      };
      listaFinalFilhos.push(autoFilho);
      setFilhos(listaFinalFilhos);
    }

    if (listaFinalFilhos.length === 0) {
      setErroEnvio("Adicione pelo menos um filho na lista antes de enviar a inscrição.");
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
        filhos: listaFinalFilhos,
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

      const protocolo = `EA-${Math.floor(100000 + Math.random() * 900000)}`;

      setSucessoDados({
        responsavel: {
          nomeCompleto: nomeRespLimpo,
          whatsapp: whatsappResponsavel,
          cpf: formatarCpf(cpfResponsavel),
        },
        filhos: listaFinalFilhos,
        protocolo,
      });
      setSucesso(true);
    } catch (err: any) {
      console.error("Erro ao enviar:", err);
      setErroEnvio(err.message || "Falha ao enviar inscrição. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // Copiar Comprovante
  function handleCopiarComprovante() {
    if (!sucessoDados || !nucleo) return;

    let texto = `📋 *COMPROVANTE DE PRÉ-INSCRIÇÃO • ESCOLINHA ESPORTIVA*\n\n` +
      `*Núcleo:* ${nucleo.identificacao}\n` +
      `*Responsável:* ${sucessoDados.responsavel.nomeCompleto}\n` +
      `*CPF Responsável:* ${sucessoDados.responsavel.cpf}\n` +
      `*WhatsApp:* ${sucessoDados.responsavel.whatsapp}\n` +
      `*Protocolo:* ${sucessoDados.protocolo}\n\n` +
      `*FILHOS INSCRITOS (${sucessoDados.filhos.length}):*\n`;

    sucessoDados.filhos.forEach((f: FilhoItem, idx: number) => {
      texto += `${idx + 1}. *${f.nomeCompleto}* (${f.idade ? `${f.idade} anos` : f.dataNascimento})\n` +
        `   • Turno: ${f.turno}\n` +
        `   • Dias: ${f.diasSemana.join(", ")}\n`;
    });

    texto += `\nA coordenação entrará em contato para confirmar a turma e data de início dos treinos.`;

    navigator.clipboard.writeText(texto);
    setCopiadoComprovante(true);
    setTimeout(() => setCopiadoComprovante(false), 3000);
  }

  // Reiniciar formulário
  function handleNovoCadastro() {
    setNomeResponsavel("");
    setWhatsappResponsavel("");
    setCpfResponsavel("");
    setFilhos([]);
    setNomeFilho("");
    setDataNascFilho("");
    setCpfFilho("");
    setObsFilho("");
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
              Inscrição Recebida!
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
              Matrícula em Processamento
            </h1>
            <p className="text-xs text-zinc-600">
              Recebemos os dados da sua família com sucesso! Nossa equipe entrará em contato via WhatsApp para confirmar a turma e horários definitivos.
            </p>
          </div>

          {/* Cartão de Resumo da Inscrição */}
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

            {/* Lista dos Filhos Cadastrados */}
            <div className="space-y-2 pt-1">
              <span className="text-3xs font-black uppercase tracking-wider text-zinc-500 block">
                Filhos Inscritos ({sucessoDados.filhos.length}):
              </span>
              <div className="space-y-2">
                {sucessoDados.filhos.map((f: FilhoItem, idx: number) => (
                  <div key={f.idTemp} className="p-3 bg-white rounded-xl border border-zinc-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-black text-zinc-900">
                      <span>{idx + 1}. {f.nomeCompleto}</span>
                      <span className="text-3xs px-2 py-0.5 bg-emerald-50 text-emerald-800 font-extrabold rounded-md">
                        {f.idade !== null ? `${f.idade} anos` : "S/D"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-3xs text-zinc-500">
                      <span>Turno: <strong>{f.turno}</strong></span>
                      <span>Dias: {f.diasSemana.join(", ")}</span>
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
              Suas informações estão salvas. No primeiro dia de treino, compareça com documento do aluno e do responsável para confirmação com o professor {professorNome || "da escolinha"}.
            </span>
          </div>

          <button
            type="button"
            onClick={handleNovoCadastro}
            className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            Fazer Nova Inscrição
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
              Escolinha Esportiva • Inscrição de Alunos
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
            Preencha seus dados de responsável e adicione seus filhos para participar das aulas gratuitas.
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
                <h2 className="text-base font-black text-zinc-900">1. Dados do Responsável (Pai / Mãe)</h2>
                <p className="text-3xs text-zinc-500">Informações para contato e confirmação da vaga</p>
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

          {/* 2. ADICIONAR FILHOS (ALUNOS) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">2. Adicionar Filho(s)</h2>
                  <p className="text-3xs text-zinc-500">Cadastre um ou mais filhos para este núcleo</p>
                </div>
              </div>
              <span className="text-3xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                {filhos.length} {filhos.length === 1 ? "filho na lista" : "filhos na lista"}
              </span>
            </div>

            {erroFilho && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{erroFilho}</span>
              </div>
            )}

            {/* Campos do Filho */}
            <div className="space-y-4 p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200">
              {/* Nome do Filho */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Nome Completo do Aluno (Filho) *
                </label>
                <input
                  type="text"
                  value={nomeFilho}
                  onChange={(e) => setNomeFilho(e.target.value)}
                  placeholder="Ex: LUCAS HENRIQUE SILVA"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold uppercase text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Nascimento */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                      Data de Nascimento *
                    </label>
                    {idadeFilhoCalculada !== null && (
                      <span className="text-3xs font-extrabold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                        {idadeFilhoCalculada} anos
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dataNascFilho}
                    onChange={(e) => setDataNascFilho(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                      onClick={() => setSexoFilho("M")}
                      className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                        sexoFilho === "M"
                          ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      Masculino (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSexoFilho("F")}
                      className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                        sexoFilho === "F"
                          ? "bg-pink-600 text-white border-pink-600 shadow-2xs"
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      Feminino (F)
                    </button>
                  </div>
                </div>
              </div>

              {/* CPF do Filho (opcional) */}
              <div className="space-y-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  CPF do Filho (opcional)
                </label>
                <input
                  type="text"
                  value={cpfFilho}
                  onChange={(e) => setCpfFilho(formatarCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Turno Preferido */}
              <div className="space-y-1.5 pt-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600 block">
                  Turno em que o aluno pode participar *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTurnoFilho("Manhã")}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      turnoFilho === "Manhã"
                        ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <Sunrise className="w-4 h-4" />
                    <span>Manhã</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTurnoFilho("Tarde")}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      turnoFilho === "Tarde"
                        ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Tarde</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTurnoFilho("Noite")}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      turnoFilho === "Noite"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Noite</span>
                  </button>
                </div>
              </div>

              {/* Dias da Semana que vai para o Núcleo */}
              <div className="space-y-1.5 pt-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600 block">
                  Quais dias da semana o aluno pode ir? (Selecione todos que puder) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIAS_DISPONIVEIS.map((dia) => {
                    const ativo = diasFilho.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDia(dia)}
                        className={`p-2 rounded-xl text-3xs sm:text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                          ativo
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-1 ring-emerald-300"
                            : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <span>{dia.replace("-feira", "")}</span>
                        {ativo && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observação / Saúde */}
              <div className="space-y-1 pt-1">
                <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                  Alguma observação de saúde ou detalhe? (opcional)
                </label>
                <input
                  type="text"
                  value={obsFilho}
                  onChange={(e) => setObsFilho(e.target.value)}
                  placeholder="Ex: Alergia, asma ou restrição física leve"
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Botão de Adicionar à Lista */}
              <button
                type="button"
                onClick={handleAdicionarFilho}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Adicionar Este Filho à Lista</span>
              </button>
            </div>

            {/* Lista dos Filhos Já Adicionados */}
            {filhos.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Filhos Prontos para Inscrição ({filhos.length}):</span>
                </h3>
                <div className="space-y-2">
                  {filhos.map((f, index) => (
                    <div
                      key={f.idTemp}
                      className="p-3.5 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-3xs font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <strong className="text-xs sm:text-sm font-black text-zinc-900">
                            {f.nomeCompleto}
                          </strong>
                          <span
                            className={`text-3xs px-2 py-0.5 rounded-md font-black ${
                              f.sexo === "M" ? "bg-sky-100 text-sky-800" : "bg-pink-100 text-pink-800"
                            }`}
                          >
                            {f.sexo}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-3xs text-zinc-500">
                          <span>Nasc: {f.dataNascimento} ({f.idade !== null ? `${f.idade} anos` : "S/D"})</span>
                          <span>• Turno: <strong>{f.turno}</strong></span>
                          <span className="text-emerald-700 font-bold">• Dias: {f.diasSemana.map(d => d.replace("-feira", "")).join(", ")}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverFilho(f.idTemp)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Remover filho da lista"
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

          {/* Botão de Envio Principal */}
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
                <span>
                  Finalizar Inscrição {filhos.length > 0 ? `(${filhos.length} ${filhos.length === 1 ? "filho" : "filhos"})` : ""}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
