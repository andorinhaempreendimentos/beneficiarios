"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  Trash2,
  Copy,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { inscricoesApi } from "@/lib/api/services";

// Categorias de Uniforme Solicitadas
interface ItemUniforme {
  id: string; // Ex: "10-12", "P" (gravado no banco)
  titulo: string; // Ex: "TAM 10-12"
  desc: string;
  minIdade: number;
  maxIdade: number;
}

interface CategoriaUniforme {
  nome: string;
  icone: string;
  itens: ItemUniforme[];
}

const CATEGORIAS_UNIFORME: CategoriaUniforme[] = [
  {
    nome: "Categoria Infantil (Kids)",
    icone: "🧒",
    itens: [
      { id: "4-6", titulo: "TAM 4-6", desc: "Veste crianças de 5 a 6 anos", minIdade: 4, maxIdade: 6 },
      { id: "6-8", titulo: "TAM 6-8", desc: "Veste crianças de 7 a 8 anos", minIdade: 7, maxIdade: 8 },
    ],
  },
  {
    nome: "Categoria Juvenil (Teen/Junior)",
    icone: "⚽",
    itens: [
      { id: "10-12", titulo: "TAM 10-12", desc: "Veste crianças de 9 a 12 anos", minIdade: 9, maxIdade: 12 },
      { id: "14-16", titulo: "TAM 14-16", desc: "Veste adolescentes de 13 a 15 anos", minIdade: 13, maxIdade: 15 },
    ],
  },
  {
    nome: "Categoria Adulto (16 e 17 anos)",
    icone: "👕",
    itens: [
      { id: "P", titulo: "TAM P", desc: "Pequeno (Atletas a partir de 16 anos)", minIdade: 16, maxIdade: 17 },
      { id: "M", titulo: "TAM M", desc: "Médio (Atletas a partir de 16 anos)", minIdade: 16, maxIdade: 17 },
      { id: "G", titulo: "TAM G", desc: "Grande (Atletas mais altos/fortes)", minIdade: 16, maxIdade: 17 },
    ],
  },
];

const DIAS_SEMANA = [
  { id: "Seg", label: "Segunda" },
  { id: "Ter", label: "Terça" },
  { id: "Qua", label: "Quarta" },
  { id: "Qui", label: "Quinta" },
  { id: "Sex", label: "Sexta" },
  { id: "Sáb", label: "Sábado" },
];

export interface AlunoData {
  nome: string;
  dataNascimento: string;
  idade: number | null;
  sexo: "M" | "F";
  cpf: string;
  turnoEscola: string; // "Matutino" | "Vespertino" | "Integral" | "Não estuda" | ""
  escola: string;
  uniforme: string; // Ex: "10-12", "P"
  diasTreino: string[];
  turnoTreino: string; // "Manha" | "Tarde" | "TantoFaz" | ""
  pcd: boolean;
  detalhePcd: string;
}

interface InscricaoRealizada {
  id: string;
  matricula: string;
  nome: string;
  idade: number | null;
  uniforme: string;
  escola: string;
  diasTreino: string[];
  turnoTreino: string;
}

interface Props {
  nucleo: {
    id: string;
    identificacao: string;
    nomeLocal?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
  };
}

export function InscricaoNucleoSimplificadaWizard({ nucleo }: Props) {
  const { toast } = useToast();
  const [passoAtual, setPassoAtual] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  // Dados do Responsável (preenchido no Passo 1)
  const [respNome, setRespNome] = useState("");
  const [respWhats, setRespWhats] = useState("");
  const [respCpf, setRespCpf] = useState("");

  // Aluno em edição
  const [alunoNome, setAlunoNome] = useState("");
  const [alunoDataNasc, setAlunoDataNasc] = useState("");
  const [alunoIdade, setAlunoIdade] = useState<number | null>(null);
  const [alunoSexo, setAlunoSexo] = useState<"M" | "F">("M");
  const [alunoCpf, setAlunoCpf] = useState("");

  // Vida Escolar (Passo 3)
  const [alunoTurnoEscola, setAlunoTurnoEscola] = useState("");
  const [buscaEscola, setBuscaEscola] = useState("");
  const [escolasSugeridas, setEscolasSugeridas] = useState<string[]>([]);
  const [dropdownEscolasAberto, setDropdownEscolasAberto] = useState(false);
  const [carregandoEscolas, setCarregandoEscolas] = useState(false);

  // Equipamento e Treino (Passo 4)
  const [alunoUniforme, setAlunoUniforme] = useState("");
  const [areaUniformesAberta, setAreaUniformesAberta] = useState(false);
  const [diasTreino, setDiasTreino] = useState<string[]>([]);
  const [turnoTreino, setTurnoTreino] = useState("");
  const [pcd, setPcd] = useState(false);
  const [detalhePcd, setDetalhePcd] = useState("");

  // Lista de Filhos adicionados
  const [listaFilhos, setListaFilhos] = useState<AlunoData[]>([]);

  // Notificação de uniforme auto-selecionado
  const [notificacaoUniforme, setNotificacaoUniforme] = useState<string | null>(null);

  // Tela de Sucesso
  const [isSucesso, setIsSucesso] = useState(false);
  const [inscricoesConfirmadas, setInscricoesConfirmadas] = useState<InscricaoRealizada[]>([]);

  // Máscara de CPF
  function formatarCpf(v: string) {
    const limpo = v.replace(/\D/g, "").slice(0, 11);
    if (limpo.length <= 3) return limpo;
    if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
    if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
    return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
  }

  // Máscara de WhatsApp / Celular
  function formatarTelefone(v: string) {
    const limpo = v.replace(/\D/g, "").slice(0, 11);
    if (limpo.length <= 2) return limpo.length ? `(${limpo}` : "";
    if (limpo.length <= 7) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }

  // Cálculo da idade a partir da data de nascimento padrão nativa
  function handleMudarDataNasc(dataStr: string) {
    setAlunoDataNasc(dataStr);
    if (!dataStr) {
      setAlunoIdade(null);
      return;
    }
    const nasc = new Date(dataStr + "T12:00:00");
    const hoje = new Date();
    let idadeCalculada = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idadeCalculada--;
    }
    const idadeFinal = Math.max(0, idadeCalculada);
    setAlunoIdade(idadeFinal);

    // Auto-seleção do tamanho ideal do uniforme
    let sugerido = "";
    if (idadeFinal <= 6) sugerido = "4-6";
    else if (idadeFinal <= 8) sugerido = "6-8";
    else if (idadeFinal <= 12) sugerido = "10-12";
    else if (idadeFinal <= 15) sugerido = "14-16";
    else sugerido = "P";

    setAlunoUniforme(sugerido);
    setNotificacaoUniforme(`TAM ${sugerido} auto-selecionado para ${idadeFinal} anos!`);
  }

  // Busca de escolas via API do INEP com debounce
  useEffect(() => {
    if (buscaEscola.trim().length < 2) {
      setEscolasSugeridas([]);
      setDropdownEscolasAberto(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCarregandoEscolas(true);
      try {
        const res = await fetch(`/api/escolas-inep?municipio=1721000&q=${encodeURIComponent(buscaEscola)}`);
        if (res.ok) {
          const data = await res.json();
          setEscolasSugeridas(data.escolas || []);
          setDropdownEscolasAberto(true);
        }
      } catch {
        // Fallback silencioso
      } finally {
        setCarregandoEscolas(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [buscaEscola]);

  function selecionarEscola(nome: string) {
    setBuscaEscola(nome);
    setDropdownEscolasAberto(false);
  }

  function toggleDiaTreino(diaId: string) {
    setDiasTreino((prev) =>
      prev.includes(diaId) ? prev.filter((d) => d !== diaId) : [...prev, diaId]
    );
  }

  // Limpa o formulário do aluno atual para cadastrar outro filho
  function adicionarOutroFilhoEVoltarPasso2() {
    // 1. Validar se o aluno atual tem nome e data
    if (!alunoNome.trim() || !alunoDataNasc) {
      toast.error("Preencha o nome e a data de nascimento do aluno antes de adicionar outro.");
      return;
    }
    if (!alunoTurnoEscola) {
      toast.error("Informe o turno escolar do aluno.");
      return;
    }
    if (!alunoUniforme) {
      toast.error("Selecione o tamanho do uniforme do aluno.");
      return;
    }
    if (diasTreino.length === 0) {
      toast.error("Selecione ao menos um dia de treino para o aluno.");
      return;
    }
    if (!turnoTreino) {
      toast.error("Selecione o turno de preferência para o treino.");
      return;
    }

    // 2. Salvar aluno atual na lista consolidada
    const novoFilho: AlunoData = {
      nome: alunoNome.trim().toUpperCase(),
      dataNascimento: alunoDataNasc,
      idade: alunoIdade,
      sexo: alunoSexo,
      cpf: alunoCpf.trim(),
      turnoEscola: alunoTurnoEscola,
      escola: alunoTurnoEscola === "Não estuda" ? "Não estuda atualmente" : buscaEscola.trim(),
      uniforme: alunoUniforme,
      diasTreino: [...diasTreino],
      turnoTreino,
      pcd,
      detalhePcd: pcd ? detalhePcd.trim() : "",
    };

    setListaFilhos((prev) => [...prev, novoFilho]);

    // 3. Resetar estado do aluno atual (mantendo os dados do responsável intactos!)
    setAlunoNome("");
    setAlunoDataNasc("");
    setAlunoIdade(null);
    setAlunoSexo("M");
    setAlunoCpf("");
    setAlunoTurnoEscola("");
    setBuscaEscola("");
    setAlunoUniforme("");
    setAreaUniformesAberta(false);
    setDiasTreino([]);
    setTurnoTreino("");
    setPcd(false);
    setDetalhePcd("");
    setNotificacaoUniforme(null);

    toast.success(`${novoFilho.nome} salvo! Agora informe os dados do próximo filho.`);
    setPassoAtual(2);
  }

  function removerFilhoSalvo(index: number) {
    setListaFilhos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Aluno removido da lista.");
  }

  // Validação de Avanço de Passo
  function avancarPasso(proximoPasso: number) {
    if (passoAtual === 1 && proximoPasso > 1) {
      if (!respNome.trim()) {
        toast.error("Por favor, preencha o nome completo do responsável.");
        return;
      }
      if (respWhats.replace(/\D/g, "").length < 10) {
        toast.error("Informe um número de WhatsApp válido com DDD.");
        return;
      }
      if (respCpf.replace(/\D/g, "").length < 11) {
        toast.error("Informe um CPF válido com 11 dígitos para o responsável.");
        return;
      }
    }

    if (passoAtual === 2 && proximoPasso > 2) {
      if (!alunoNome.trim()) {
        toast.error("Por favor, informe o nome completo do aluno.");
        return;
      }
      if (!alunoDataNasc) {
        toast.error("Por favor, selecione a data de nascimento do aluno.");
        return;
      }
    }

    if (passoAtual === 3 && proximoPasso > 3) {
      if (!alunoTurnoEscola) {
        toast.error("Por favor, selecione em qual turno o aluno estuda na escola usando os botões.");
        return;
      }
      if (alunoTurnoEscola !== "Não estuda" && !buscaEscola.trim()) {
        toast.error("Por favor, selecione ou digite o nome da escola em que o aluno estuda.");
        return;
      }
    }

    if (passoAtual === 4 && proximoPasso > 4) {
      if (!alunoUniforme) {
        toast.error("Por favor, selecione o tamanho do uniforme desejado.");
        return;
      }
      if (diasTreino.length === 0) {
        toast.error("Por favor, marque pelo menos um dia da semana disponível para o treino.");
        return;
      }
      if (!turnoTreino) {
        toast.error("Por favor, selecione o turno de preferência para o treino no núcleo.");
        return;
      }
    }

    setPassoAtual(proximoPasso);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Submissão Final e Persistência no Supabase
  async function finalizarEnvio() {
    // Monta a lista completa de alunos a inscrever
    const todosAlunos: AlunoData[] = [...listaFilhos];

    // Se houver um aluno preenchido nos passos, adiciona ele
    if (alunoNome.trim() && alunoDataNasc) {
      todosAlunos.push({
        nome: alunoNome.trim().toUpperCase(),
        dataNascimento: alunoDataNasc,
        idade: alunoIdade,
        sexo: alunoSexo,
        cpf: alunoCpf.trim(),
        turnoEscola: alunoTurnoEscola,
        escola: alunoTurnoEscola === "Não estuda" ? "Não estuda atualmente" : buscaEscola.trim(),
        uniforme: alunoUniforme,
        diasTreino: [...diasTreino],
        turnoTreino,
        pcd,
        detalhePcd: pcd ? detalhePcd.trim() : "",
      });
    }

    if (todosAlunos.length === 0) {
      toast.error("Nenhum aluno foi informado para a inscrição.");
      return;
    }

    setSubmitting(true);
    startTransition(async () => {
      try {
        const confirmados: InscricaoRealizada[] = [];

        for (const aluno of todosAlunos) {
          const obsDias = aluno.diasTreino.join(", ");
          const obsTexto = `Disponibilidade no Núcleo: ${obsDias || "Não informado"} | Turno preferido: ${aluno.turnoTreino || "Qualquer"}`;

          const payload = {
            nomeCompleto: aluno.nome,
            dataNascimento: aluno.dataNascimento,
            sexo: aluno.sexo,
            cpf: aluno.cpf || null,
            pcd: aluno.pcd,
            tipoPcd: aluno.pcd ? aluno.detalhePcd : null,
            nomeResponsavel: respNome.trim().toUpperCase(),
            celularResponsavel: respWhats.trim(),
            cpfResponsavel: respCpf.trim(),
            nomeEscola: aluno.escola,
            turnoEscolar: aluno.turnoEscola,
            tamanhoCamisa: aluno.uniforme,
            cidade: nucleo.cidade || "Palmas",
            estado: nucleo.estado || "TO",
          };

          const res = await inscricoesApi.inscreverPublicoNucleo(payload, nucleo.id, obsTexto);

          confirmados.push({
            id: res.id,
            matricula: res.matricula || `AND-${Math.floor(100000 + Math.random() * 900000)}`,
            nome: aluno.nome,
            idade: aluno.idade,
            uniforme: aluno.uniforme,
            escola: aluno.escola,
            diasTreino: aluno.diasTreino,
            turnoTreino: aluno.turnoTreino,
          });
        }

        setInscricoesConfirmadas(confirmados);
        setIsSucesso(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.success(`Inscrição de ${confirmados.length} aluno(s) confirmada com sucesso!`);
      } catch (err: any) {
        toast.error(err?.message || "Erro ao processar inscrições. Tente novamente.");
      } finally {
        setSubmitting(false);
      }
    });
  }

  // Copiar comprovante para WhatsApp
  function copiarComprovante() {
    let msg = `📋 *INSCRIÇÃO OFICIAL NO NÚCLEO ${nucleo.identificacao.toUpperCase()}*\n`;
    msg += `*Responsável:* ${respNome}\n`;
    msg += `*Contato:* ${respWhats} (CPF: ${respCpf})\n\n`;
    msg += `*Alunos Inscritos (${inscricoesConfirmadas.length}):*\n`;

    inscricoesConfirmadas.forEach((al, idx) => {
      msg += `\n${idx + 1}. *${al.nome}* (${al.idade ?? "--"} anos)\n`;
      msg += `   • Protocolo/Matrícula: *${al.matricula}*\n`;
      msg += `   • Escola: ${al.escola}\n`;
      msg += `   • Uniforme: TAM ${al.uniforme}\n`;
      msg += `   • Dias no Núcleo: ${al.diasTreino.join(", ")} (${al.turnoTreino})\n`;
    });

    msg += `\n📍 *Núcleo:* ${nucleo.identificacao} - ${nucleo.bairro || ""}, ${nucleo.cidade || "Palmas"}\n`;
    msg += `\n_Apresente esta mensagem ao professor no primeiro dia de treino._`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      toast.success("Comprovante copiado! Cole no WhatsApp da coordenação ou guarde com você.");
    } else {
      toast.info("Não foi possível acessar a área de transferência.");
    }
  }

  // Títulos dos passos para o rótulo do topo
  const titulosPassos = [
    "Passo 1 de 5: Responsável",
    "Passo 2 de 5: Identificação do Aluno",
    "Passo 3 de 5: Vida Escolar",
    "Passo 4 de 5: Uniforme e Treino",
    "Passo 5 de 5: Revisão e Envio",
  ];

  // -------------------------------------------------------------
  // TELA DE SUCESSO
  // -------------------------------------------------------------
  if (isSucesso) {
    return (
      <div className="max-w-xl mx-auto p-5 sm:p-7 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Inscrição Confirmada!
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Dados Enviados ao Núcleo
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            O professor do <strong>{nucleo.identificacao}</strong> já recebeu a inscrição oficial no sistema para organizar as turmas.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left space-y-3">
          <div className="space-y-0.5 border-b border-slate-200 pb-2">
            <span className="text-xs text-slate-500 font-medium">Responsável:</span>
            <div className="text-xs font-black text-slate-900">{respNome}</div>
            <div className="text-xs text-slate-500">WhatsApp: {respWhats} • CPF: {respCpf}</div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Aluno(s) Cadastrado(s):
            </span>
            <div className="space-y-2">
              {inscricoesConfirmadas.map((al, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>{idx + 1}. {al.nome}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">
                      {al.matricula}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Uniforme: TAM {al.uniforme} • Escola: {al.escola}
                  </div>
                  <div className="text-[11px] text-slate-700 font-semibold">
                    Treino: {al.diasTreino.join(", ")} ({al.turnoTreino})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={copiarComprovante}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Copy className="w-5 h-5" />
            <span>Copiar Comprovante para WhatsApp</span>
          </button>
          <p className="text-[11px] text-slate-500">
            Apresente este protocolo ao professor ou guarde uma cópia no seu WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FORMULÁRIO WIZARD (STEPPER)
  // -------------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Hero do Núcleo */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-5 sm:p-6 relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
            Escolinha Esportiva
          </span>
          {listaFilhos.length > 0 && (
            <span className="text-xs bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full shadow-xs">
              {listaFilhos.length} {listaFilhos.length === 1 ? "filho já salvo" : "filhos já salvos"}
            </span>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
          {nucleo.identificacao}
        </h2>
        <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          {[nucleo.nomeLocal, nucleo.bairro, nucleo.cidade, nucleo.estado].filter(Boolean).join(" • ")}
        </p>
      </div>

      {/* BARRA DE PROGRESSO LIMPA NO TOPO (SEM LISTA REDUNDANTE) */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className="text-emerald-800 font-black">{titulosPassos[passoAtual - 1]}</span>
          <span className="text-emerald-700 font-black bg-emerald-100/80 px-2 py-0.5 rounded-md">
            {passoAtual * 20}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${passoAtual * 20}%` }}
          />
        </div>
      </div>

      {/* CORPO DOS PASSOS */}
      <div className="p-5 sm:p-6">
        {/* ========================================================
             PASSO 1: DADOS DO RESPONSÁVEL
             ======================================================== */}
        {passoAtual === 1 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                1
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                  Responsável
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Quem está fazendo a inscrição?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Informe seus dados para contato e avisos sobre as aulas pelo WhatsApp.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo do Responsável *
                </label>
                <input
                  type="text"
                  placeholder="Ex: MARIA HELENA DOS SANTOS"
                  value={respNome}
                  onChange={(e) => setRespNome(e.target.value.toUpperCase())}
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp para Contato *
                  </label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={respWhats}
                    onChange={(e) => setRespWhats(formatarTelefone(e.target.value))}
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CPF do Responsável *
                  </label>
                  <input
                    type="tel"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={respCpf}
                    onChange={(e) => setRespCpf(formatarCpf(e.target.value))}
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => avancarPasso(2)}
                className="relative overflow-hidden w-full min-h-[62px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-lg shadow-emerald-700/25 transition-all cursor-pointer flex flex-col justify-center"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 bg-emerald-800/60 px-2 py-0.5 rounded-md">
                    Etapa 1 de 5
                  </span>
                  <span className="text-[11px] font-bold text-emerald-200">
                    20% Concluído
                  </span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-black text-white">Continuar: Identificação do Aluno</span>
                  <div className="flex items-center gap-1.5 font-black text-xs bg-white text-emerald-800 px-2.5 py-1 rounded-xl shadow-xs">
                    <span>Passo 2</span>
                    <span>➔</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-950/30">
                  <div className="h-full bg-emerald-300 rounded-r-full" style={{ width: "20%" }} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
             PASSO 2: IDENTIFICAÇÃO DO ALUNO (DATA PADRÃO + IDADE)
             ======================================================== */}
        {passoAtual === 2 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                2
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-800">
                  {listaFilhos.length > 0 ? `Cadastrando ${listaFilhos.length + 1}º Aluno` : "Aluno Principal"}
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Identificação do Aluno
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Informe o nome e a data de nascimento. O sistema calcula a idade e sugere o uniforme ideal.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo do Aluno *
                </label>
                <input
                  type="text"
                  placeholder="Ex: GABRIEL MENEZES SANTOS"
                  value={alunoNome}
                  onChange={(e) => setAlunoNome(e.target.value.toUpperCase())}
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                />
              </div>

              {/* Data de Nascimento Padrão Nativa */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Data de Nascimento *
                  </label>
                  {alunoIdade !== null && (
                    <span className="text-xs font-black text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md border border-sky-200">
                      {alunoIdade} anos
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={alunoDataNasc}
                  onChange={(e) => handleMudarDataNasc(e.target.value)}
                  min="2007-01-01"
                  max="2022-12-31"
                  className="w-full h-12 px-3.5 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-white focus:border-sky-500 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Notificação de Auto-Seleção do Uniforme */}
              {notificacaoUniforme && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-pulse">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{notificacaoUniforme}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sexo *
                  </label>
                  <div className="grid grid-cols-2 gap-2 h-12">
                    <button
                      type="button"
                      onClick={() => setAlunoSexo("M")}
                      className={`rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center ${
                        alunoSexo === "M"
                          ? "border-sky-600 bg-sky-600 text-white font-black"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlunoSexo("F")}
                      className={`rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center ${
                        alunoSexo === "F"
                          ? "border-pink-600 bg-pink-600 text-white font-black"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Feminino
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CPF do Aluno <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Se possuir, digite aqui"
                    maxLength={14}
                    value={alunoCpf}
                    onChange={(e) => setAlunoCpf(formatarCpf(e.target.value))}
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => avancarPasso(1)}
                className="w-1/3 min-h-[62px] py-2 px-3 rounded-2xl border-2 border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-[0.99] font-bold text-xs cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Passo 1</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">⬅ Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => avancarPasso(3)}
                className="relative overflow-hidden w-2/3 min-h-[62px] py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white shadow-lg shadow-sky-600/25 cursor-pointer flex flex-col justify-center"
              >
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-100 bg-sky-800/50 px-1.5 py-0.5 rounded">
                    Etapa 2 de 5
                  </span>
                  <span className="text-[10px] font-black text-sky-200">
                    40%
                  </span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs sm:text-sm font-black text-white truncate">Continuar: Escola</span>
                  <div className="flex items-center gap-1 font-black text-[11px] bg-white text-sky-800 px-2 py-0.5 rounded-lg shrink-0 ml-1">
                    <span>Passo 3</span>
                    <span>➔</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-sky-950/30">
                  <div className="h-full bg-sky-300 rounded-r-full" style={{ width: "40%" }} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
             PASSO 3: VIDA ESCOLAR (TURNO EM BOTÕES + INEP)
             ======================================================== */}
        {passoAtual === 3 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                3
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800">
                  Vida Escolar
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Turno de Estudo e Escola
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Informe o turno e busque a escola no INEP para evitarmos choque com os horários de treino.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 1. Turno Escolar em Botões (ANTES da escola) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Em qual turno o aluno estuda na escola? *
                  </label>
                  {alunoTurnoEscola && (
                    <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200">
                      Turno: {alunoTurnoEscola}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Toque para selecionar o turno em que o aluno estuda:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "Matutino", label: "Manhã", sub: "Matutino", icone: "☀️" },
                    { id: "Vespertino", label: "Tarde", sub: "Vespertino", icone: "⛅" },
                    { id: "Noturno", label: "Noite", sub: "Noturno", icone: "🌙" },
                    { id: "Não estuda", label: "Não Estuda", sub: "Atualmente", icone: "🏠" },
                  ].map((t) => {
                    const sel = alunoTurnoEscola === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setAlunoTurnoEscola(t.id);
                          if (t.id === "Não estuda") {
                            setBuscaEscola("");
                          }
                        }}
                        className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          sel
                            ? "border-indigo-600 bg-indigo-50/90 text-indigo-950 font-black ring-2 ring-indigo-500/20 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl">{t.icone}</span>
                        <span className="font-black text-xs text-slate-900">{t.label}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{t.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Campo de busca no INEP (Oculto se Não Estuda) */}
              {alunoTurnoEscola !== "Não estuda" ? (
                <div className="relative pt-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome da Escola * <span className="text-indigo-600 font-bold">(Busca INEP)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite as primeiras letras da escola..."
                      value={buscaEscola}
                      onChange={(e) => setBuscaEscola(e.target.value)}
                      onFocus={() => {
                        if (escolasSugeridas.length > 0) setDropdownEscolasAberto(true);
                      }}
                      className="w-full h-12 pl-3.5 pr-10 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      {carregandoEscolas ? "⏳" : "🔍"}
                    </div>
                  </div>

                  {dropdownEscolasAberto && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border-2 border-indigo-300 shadow-2xl p-2 z-40 max-h-56 overflow-y-auto space-y-1">
                      {escolasSugeridas.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          Nenhuma escola encontrada no INEP com esse nome.
                          <button
                            type="button"
                            onClick={() => selecionarEscola(buscaEscola)}
                            className="block w-full mt-1.5 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 cursor-pointer"
                          >
                            Usar &quot;{buscaEscola}&quot; como nome manual
                          </button>
                        </div>
                      ) : (
                        escolasSugeridas.map((esc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selecionarEscola(esc)}
                            className="w-full text-left p-2.5 hover:bg-indigo-50 rounded-xl text-xs font-semibold text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>🏫 {esc}</span>
                            <span className="text-[10px] text-indigo-600 font-bold">INEP</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2.5">
                  <span className="text-lg">ℹ️</span>
                  <div>
                    <span className="font-bold block text-slate-900">Aluno não estuda atualmente</span>
                    <span className="text-[11px] text-slate-600">
                      Não é necessário preencher o nome da escola. Você já pode continuar para a próxima etapa.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => avancarPasso(2)}
                className="w-1/3 min-h-[62px] py-2 px-3 rounded-2xl border-2 border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-[0.99] font-bold text-xs cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Passo 2</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">⬅ Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => avancarPasso(4)}
                className="relative overflow-hidden w-2/3 min-h-[62px] py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/25 cursor-pointer flex flex-col justify-center"
              >
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100 bg-indigo-800/50 px-1.5 py-0.5 rounded">
                    Etapa 3 de 5
                  </span>
                  <span className="text-[10px] font-black text-indigo-200">
                    60%
                  </span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs sm:text-sm font-black text-white truncate">Continuar: Treino</span>
                  <div className="flex items-center gap-1 font-black text-[11px] bg-white text-indigo-800 px-2 py-0.5 rounded-lg shrink-0 ml-1">
                    <span>Passo 4</span>
                    <span>➔</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-950/30">
                  <div className="h-full bg-indigo-300 rounded-r-full" style={{ width: "60%" }} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
             PASSO 4: UNIFORME RECOLHIDO + BLOCO DIAS/TURNO ESCURECIDO
             ======================================================== */}
        {passoAtual === 4 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                4
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-800">
                  Equipamento e Frequência
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Uniforme e Horários de Treino
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Confira o tamanho do uniforme e informe os dias e turnos em que o aluno pode participar.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 1. Tamanho do Uniforme (Recolhido com Toggle) */}
              <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden transition-all shadow-2xs">
                <button
                  type="button"
                  onClick={() => setAreaUniformesAberta((v) => !v)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg shrink-0">
                      👕
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Tamanho do Uniforme *
                        </span>
                        {alunoIdade !== null && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            ⚡ {alunoIdade} anos
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 truncate">
                        <span>Selecionado:</span>
                        <strong className="text-teal-900 font-black">
                          TAM {alunoUniforme || "Não selecionado"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="text-xs font-black text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-xl border border-teal-200 transition-colors flex items-center gap-1.5 shadow-2xs">
                      <span>{areaUniformesAberta ? "Recolher opções" : "Escolher tamanho do uniforme"}</span>
                      {areaUniformesAberta ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </button>

                {areaUniformesAberta && (
                  <div className="p-3.5 sm:p-4 border-t border-slate-200/90 bg-slate-50/60 space-y-3">
                    {CATEGORIAS_UNIFORME.map((cat, cIdx) => (
                      <div key={cIdx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <span className="text-sm">{cat.icone}</span>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{cat.nome}</span>
                        </div>

                        <div className={`grid ${cat.itens.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-2`}>
                          {cat.itens.map((item) => {
                            const selecionado = alunoUniforme === item.id;
                            const eSugerido = alunoIdade !== null && alunoIdade >= item.minIdade && alunoIdade <= item.maxIdade;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setAlunoUniforme(item.id)}
                                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  selecionado
                                    ? "border-emerald-600 bg-emerald-50 text-slate-900 shadow-xs ring-2 ring-emerald-500/20"
                                    : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 w-full mb-1">
                                  <span className={`font-black text-xs ${selecionado ? "text-emerald-950 font-black" : "text-slate-900"}`}>
                                    {item.titulo}
                                  </span>
                                  {selecionado && (
                                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/90 px-1.5 py-0.5 rounded">
                                      ✓ Escolhido
                                    </span>
                                  )}
                                  {!selecionado && eSugerido && (
                                    <span className="text-[10px] font-extrabold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                                      ⚡ Ideal
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[11px] ${selecionado ? "text-emerald-800 font-bold" : "text-slate-500 font-medium"}`}>
                                  {item.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. ÁREA COM FUNDO DIFERENCIADO / MAIS ESCURO: DIAS E TURNOS DE TREINO */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border-2 border-slate-200/90 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      Em quais dias o aluno pode ir ao núcleo? *
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">Seleção Múltipla</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Toque para selecionar os dias disponíveis (nenhum vem pré-marcado):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DIAS_SEMANA.map((d) => {
                      const marcado = diasTreino.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDiaTreino(d.id)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between border-2 transition-all cursor-pointer ${
                            marcado
                              ? "border-teal-600 bg-teal-600 text-white font-black shadow-xs ring-2 ring-teal-500/20"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                          }`}
                        >
                          <span>{d.label}</span>
                          <span className={marcado ? "text-white font-black" : "text-slate-400 font-bold"}>
                            {marcado ? "✓" : "+"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200/90" />

                {/* Turno do Treino */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Turno de preferência para o treino no núcleo *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "Manha", label: "☀️ Manhã" },
                      { id: "Tarde", label: "⛅ Tarde" },
                      { id: "Noite", label: "🌙 Noite" },
                      { id: "TantoFaz", label: "🔄 Qualquer" },
                    ].map((turn) => {
                      const sel = turnoTreino === turn.id;
                      return (
                        <button
                          key={turn.id}
                          type="button"
                          onClick={() => setTurnoTreino(turn.id)}
                          className={`py-2.5 px-3 rounded-xl text-xs text-center transition-all cursor-pointer ${
                            sel
                              ? "border-2 border-teal-600 bg-teal-600 text-white font-black shadow-xs ring-2 ring-teal-500/20"
                              : "border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                          }`}
                        >
                          {turn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Deficiência ou Restrição Médica */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Possui deficiência ou restrição médica?</span>
                  <span className="text-[11px] text-slate-400">Auxilia o professor no planejamento</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPcd((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    pcd ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pcd ? "Sim" : "Não"}
                </button>
              </div>

              {pcd && (
                <div>
                  <input
                    type="text"
                    placeholder="Qual deficiência ou restrição?"
                    value={detalhePcd}
                    onChange={(e) => setDetalhePcd(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => avancarPasso(3)}
                className="w-1/3 min-h-[62px] py-2 px-3 rounded-2xl border-2 border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-[0.99] font-bold text-xs cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Passo 3</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">⬅ Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => avancarPasso(5)}
                className="relative overflow-hidden w-2/3 min-h-[62px] py-2.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white shadow-lg shadow-teal-600/25 cursor-pointer flex flex-col justify-center"
              >
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-100 bg-teal-800/50 px-1.5 py-0.5 rounded">
                    Etapa 4 de 5
                  </span>
                  <span className="text-[10px] font-black text-teal-200">
                    80%
                  </span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs sm:text-sm font-black text-white truncate">Continuar: Revisão</span>
                  <div className="flex items-center gap-1 font-black text-[11px] bg-white text-teal-800 px-2 py-0.5 rounded-lg shrink-0 ml-1">
                    <span>Passo 5</span>
                    <span>➔</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-teal-950/30">
                  <div className="h-full bg-teal-300 rounded-r-full" style={{ width: "80%" }} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
             PASSO 5: REVISÃO, MULTI-FILHO E FINALIZAÇÃO
             ======================================================== */}
        {passoAtual === 5 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                5
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                  Conferência Final
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Revisar e Finalizar Inscrição
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Confira os dados da família. Se tiver outro filho, adicione antes de enviar!
                </p>
              </div>
            </div>

            {/* Resumo do Responsável */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-semibold border-b border-slate-200 pb-1">
                <span>RESPONSÁVEL:</span>
                <button
                  type="button"
                  onClick={() => setPassoAtual(1)}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Editar
                </button>
              </div>
              <div className="font-black text-slate-900">{respNome}</div>
              <div className="text-slate-600 font-medium">WhatsApp: {respWhats} • CPF: {respCpf}</div>
            </div>

            {/* Lista dos Alunos a Inscrever */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                Aluno(s) a Inscrever ({listaFilhos.length + (alunoNome ? 1 : 0)}):
              </span>

              {/* Filhos já salvos */}
              {listaFilhos.map((f, i) => (
                <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1.5 text-xs text-left">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>{i + 1}. {f.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-extrabold">
                        {f.idade ?? "--"} anos
                      </span>
                      <button
                        type="button"
                        onClick={() => removerFilhoSalvo(i)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Remover este aluno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    🏫 Escola: <strong>{f.turnoEscola === "Não estuda" ? "Não estuda atualmente" : `${f.escola} (${f.turnoEscola})`}</strong>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    👕 Uniforme: <strong>TAM {f.uniforme}</strong>
                  </div>
                  <div className="text-slate-700 text-[11px] font-semibold">
                    ⚽ Treino no Núcleo: {f.diasTreino.join(", ")} • Turno: {f.turnoTreino}
                  </div>
                </div>
              ))}

              {/* Aluno atualmente em edição nos passos */}
              {alunoNome && (
                <div className="p-3.5 bg-emerald-50/50 border-2 border-emerald-300 rounded-2xl shadow-2xs space-y-1.5 text-xs text-left">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>{listaFilhos.length + 1}. {alunoNome}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-extrabold">
                      {alunoIdade ?? "--"} anos
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    🏫 Escola: <strong>{alunoTurnoEscola === "Não estuda" ? "Não estuda atualmente" : `${buscaEscola} (${alunoTurnoEscola})`}</strong>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    👕 Uniforme: <strong>TAM {alunoUniforme}</strong>
                  </div>
                  <div className="text-slate-700 text-[11px] font-semibold">
                    ⚽ Treino no Núcleo: {diasTreino.join(", ")} • Turno: {turnoTreino}
                  </div>
                </div>
              )}
            </div>

            {/* A SOLUÇÃO MULTI-FILHO NO STEPPER */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/70 space-y-2 text-center">
              <span className="text-xs font-bold text-sky-950 block">Tem outro filho ou irmão para inscrever?</span>
              <p className="text-[11px] text-sky-800 leading-tight">
                Ao clicar abaixo, este aluno fica salvo e você cadastra o próximo a partir do <strong>Passo 2</strong>, sem precisar redigitar os dados do responsável!
              </p>
              <button
                type="button"
                onClick={adicionarOutroFilhoEVoltarPasso2}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-300 font-black text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Mais um Filho / Irmão</span>
              </button>
            </div>

            {/* BOTÃO FINAL DE SUBMISSÃO */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={finalizarEnvio}
                className="relative overflow-hidden w-full min-h-[64px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xl shadow-emerald-700/25 active:scale-[0.99] transition-all flex flex-col justify-center cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 bg-emerald-900/50 px-2 py-0.5 rounded-md">
                    Passo 5 de 5 • Etapa Final
                  </span>
                  <span className="text-[11px] font-black text-emerald-200">
                    100% Concluído
                  </span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-black text-white">
                    {submitting ? "Processando e Gravando..." : "Concluir e Enviar Inscrição"}
                  </span>
                  <div className="flex items-center gap-1.5 font-black text-xs bg-white text-emerald-800 px-3 py-1 rounded-xl shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Finalizar</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-950/40">
                  <div className="h-full bg-emerald-300 w-full" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPassoAtual(4)}
                className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⬅ Voltar ao Passo 4 (Uniforme e Treino)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
