"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  School,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Sparkles,
  Share2,
} from "lucide-react";

interface NucleoItem {
  id: string;
  identificacao: string;
  nomeLocal?: string;
  professorNome: string;
  modalidadeNome: string;
  temAlunosPreExistentes: boolean;
  totalAlunosSistema: number;
  respondido: boolean;
  resposta: {
    id: string;
    nucleo_id: string;
    nucleo_nome: string;
    professor_nome: string | null;
    tem_alunos_pre_existentes: boolean;
    total_alunos_sistema: number;
    total_alunos_informado: number;
    distribuicao_turmas: Record<string, number>;
    alocacoes_alunos?: Record<string, string>;
    novos_alunos_cadastrados?: Array<{
      idTemp: string;
      nomeCompleto: string;
      cpf?: string;
      dataNascimento: string;
      sexo: string;
      turmaSugeridaId?: string;
    }>;
    observacoes: string | null;
    created_at: string;
  } | null;
}

const SENHA_CORRETA = "Conferencia123#";
const BASE_URL = "https://beneficiarios-andorinha.vercel.app";

export default function RespostasConferenciaBeneficiariosPage() {
  // Autenticação
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [senhaInput, setSenhaInput] = useState<string>("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  // Dados
  const [nucleos, setNucleos] = useState<NucleoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "preenchidos" | "pendentes" | "com_alunos" | "sem_alunos"
  >("todos");

  // Feedback de cópia
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [copiadoTodos, setCopiadoTodos] = useState<boolean>(false);

  // Modal de Detalhes
  const [detalhesNucleo, setDetalhesNucleo] = useState<NucleoItem | null>(null);

  // Exclusão
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  // Checar autenticação salva
  useEffect(() => {
    if (typeof window !== "undefined") {
      const salvo = sessionStorage.getItem("conf_beneficiarios_auth");
      if (salvo === "true") {
        setAutenticado(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaInput === SENHA_CORRETA) {
      setAutenticado(true);
      setErroSenha(null);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("conf_beneficiarios_auth", "true");
      }
    } else {
      setErroSenha("Senha incorreta. Tente novamente.");
    }
  };

  const handleLogout = () => {
    setAutenticado(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("conf_beneficiarios_auth");
    }
  };

  // Carregar dados
  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetch("/api/conferencia-beneficiarios");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar dados.");
      setNucleos(data.nucleos || []);
    } catch (err: any) {
      setErro(err.message || "Erro desconhecido ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      carregarDados();
    }
  }, [autenticado]);

  // Excluir resposta
  const handleExcluirResposta = async (respostaId: string, nomeNucleo: string) => {
    if (
      !confirm(
        `Tem certeza que deseja apagar a conferência do núcleo "${nomeNucleo}"? O professor poderá responder novamente.`
      )
    ) {
      return;
    }

    try {
      setExcluindoId(respostaId);
      const res = await fetch(`/api/conferencia-beneficiarios?id=${respostaId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir resposta.");
      await carregarDados();
      if (detalhesNucleo?.resposta?.id === respostaId) {
        setDetalhesNucleo(null);
      }
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setExcluindoId(null);
    }
  };

  // Copiar link individual
  const copiarLinkIndividual = (nucleo: NucleoItem) => {
    const url = `${BASE_URL}/conferencia-beneficiarios/${nucleo.id}`;
    const texto = `Olá Professor(a) ${nucleo.professorNome}!\n\nSegue o link exclusivo para a conferência e alocação dos alunos do núcleo *${nucleo.identificacao}*:\n\n${url}\n\nPor favor, acerte as quantidades e distribua os alunos nas turmas oficiais. Obrigado!`;

    navigator.clipboard.writeText(texto);
    setCopiadoId(nucleo.id);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  // Copiar todos os links
  const copiarTodosLinks = () => {
    let texto = `📋 *LINKS DE CONFERÊNCIA DE BENEFICIÁRIOS - ESCOLINHAS*\n\n`;
    nucleos.forEach((n, idx) => {
      const url = `${BASE_URL}/conferencia-beneficiarios/${n.id}`;
      const statusIcon = n.respondido ? "✅" : "⏳";
      texto += `${idx + 1}. *${n.identificacao}* (${n.professorNome}) ${statusIcon}\n${url}\n\n`;
    });

    navigator.clipboard.writeText(texto);
    setCopiadoTodos(true);
    setTimeout(() => setCopiadoTodos(false), 3000);
  };

  // Filtragem dos núcleos
  const nucleosFiltrados = useMemo(() => {
    return nucleos.filter((n) => {
      const termo = busca.toLowerCase();
      const matchBusca =
        n.identificacao.toLowerCase().includes(termo) ||
        n.professorNome.toLowerCase().includes(termo);

      if (!matchBusca) return false;

      if (filtroStatus === "preenchidos") return n.respondido;
      if (filtroStatus === "pendentes") return !n.respondido;
      if (filtroStatus === "com_alunos") return n.temAlunosPreExistentes;
      if (filtroStatus === "sem_alunos") return !n.temAlunosPreExistentes;

      return true;
    });
  }, [nucleos, busca, filtroStatus]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = nucleos.length;
    const respondidos = nucleos.filter((n) => n.respondido).length;
    const pendentes = total - respondidos;
    const comAlunos = nucleos.filter((n) => n.temAlunosPreExistentes).length;
    const semAlunos = total - comAlunos;

    let totalAlunosAuditados = 0;
    nucleos.forEach((n) => {
      if (n.resposta) {
        totalAlunosAuditados += Number(n.resposta.total_alunos_informado) || 0;
      }
    });

    return {
      total,
      respondidos,
      pendentes,
      comAlunos,
      semAlunos,
      totalAlunosAuditados,
      pctConcluido: total > 0 ? Math.round((respondidos / total) * 100) : 0,
    };
  }, [nucleos]);

  // TELA DE LOGIN
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-800 to-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 text-center animate-slideUp">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-3xs uppercase tracking-widest font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
              Acesso Coordenador
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 mt-2">
              Painel de Beneficiários
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Digite a senha de administrador para gerenciar links e visualizar respostas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-3xs font-black uppercase tracking-wider text-zinc-600">
                Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-zinc-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {erroSenha && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{erroSenha}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Acessar Painel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL DO PAINEL
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-zinc-50 to-white text-zinc-900 pb-20">
      {/* Top Header */}
      <header className="bg-sky-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <School className="w-7 h-7 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xs uppercase tracking-wider font-extrabold text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Administração
                </span>
                <span className="text-3xs text-sky-200 font-semibold">
                  20 Núcleos Cadastrados
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Conferência de Beneficiários e Turmas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={copiarTodosLinks}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {copiadoTodos ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiados para WhatsApp!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copiar Todos os Links</span>
                </>
              )}
            </button>

            <button
              onClick={carregarDados}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl transition-all"
              title="Sair do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-3xs uppercase font-extrabold tracking-wider">
                Total de Núcleos
              </span>
              <School className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-black text-zinc-900 mt-2">{stats.total}</p>
            <p className="text-3xs text-zinc-500 mt-0.5">
              {stats.comAlunos} Cenário A • {stats.semAlunos} Cenário B
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-3xs uppercase font-extrabold tracking-wider">
                Respostas Recebidas
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">
              {stats.respondidos}{" "}
              <span className="text-xs font-bold text-zinc-400">/ {stats.total}</span>
            </p>
            <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${stats.pctConcluido}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-3xs uppercase font-extrabold tracking-wider">
                Pendentes de Resposta
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">{stats.pendentes}</p>
            <p className="text-3xs text-zinc-500 mt-0.5">Aguardando professores</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-sky-700">
              <span className="text-3xs uppercase font-extrabold tracking-wider">
                Alunos Auditados
              </span>
              <Users className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-black text-sky-700 mt-2">
              {stats.totalAlunosAuditados}
            </p>
            <p className="text-3xs text-zinc-500 mt-0.5">Total confirmado nas respostas</p>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por núcleo ou professor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "todos", label: "Todos" },
                { id: "preenchidos", label: "Preenchidos" },
                { id: "pendentes", label: "Pendentes" },
                { id: "com_alunos", label: "Cenário A" },
                { id: "sem_alunos", label: "Cenário B" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroStatus(f.id)}
                className={`px-3 py-2 rounded-xl text-3xs font-bold transition-all whitespace-nowrap ${
                  filtroStatus === f.id
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Cards dos Núcleos */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-2xs">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-600">Carregando dados dos núcleos...</p>
          </div>
        ) : erro ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-rose-200 shadow-2xs space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-rose-700">{erro}</p>
          </div>
        ) : nucleosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-2xs space-y-2 text-zinc-400">
            <Search className="w-8 h-8 mx-auto text-zinc-300" />
            <p className="text-xs font-bold text-zinc-600">Nenhum núcleo encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nucleosFiltrados.map((n) => {
              const url = `${BASE_URL}/conferencia-beneficiarios/${n.id}`;

              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-2xs space-y-4 flex flex-col justify-between ${
                    n.respondido
                      ? "border-emerald-200 hover:border-emerald-400"
                      : "border-zinc-200 hover:border-sky-300"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            n.temAlunosPreExistentes
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {n.temAlunosPreExistentes
                            ? `Cenário A (${n.totalAlunosSistema} alunos)`
                            : "Cenário B (Sem alunos)"}
                        </span>
                        <h3 className="text-base font-black text-zinc-900 mt-1">
                          {n.identificacao}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium">
                          Prof: <strong>{n.professorNome}</strong>
                        </p>
                      </div>

                      <span
                        className={`text-3xs font-black uppercase px-2.5 py-1 rounded-lg ${
                          n.respondido
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {n.respondido ? "Preenchido ✓" : "Pendente"}
                      </span>
                    </div>

                    {/* Resumo da resposta se preenchida */}
                    {n.resposta ? (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                          <span>Alunos Informados:</span>
                          <span className="text-sm font-black">
                            {n.resposta.total_alunos_informado}
                          </span>
                        </div>
                        {n.resposta.novos_alunos_cadastrados &&
                          n.resposta.novos_alunos_cadastrados.length > 0 && (
                            <p className="text-3xs text-emerald-800">
                              Cadastrados: <strong>{n.resposta.novos_alunos_cadastrados.length} novos alunos</strong>
                            </p>
                          )}
                        <p className="text-3xs text-zinc-400">
                          Enviado em: {new Date(n.resposta.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-3xs text-zinc-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Aguardando preenchimento pelo professor</span>
                      </div>
                    )}
                  </div>

                  {/* Ações do Card */}
                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => copiarLinkIndividual(n)}
                        className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          copiadoId === n.id
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {copiadoId === n.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/conferencia-beneficiarios/${n.id}`}
                        target="_blank"
                        className="h-9 px-3 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Link</span>
                      </Link>
                    </div>

                    {n.resposta && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setDetalhesNucleo(n)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-3xs transition-all cursor-pointer text-center"
                        >
                          Ver Detalhes da Resposta
                        </button>
                        <button
                          type="button"
                          disabled={excluindoId === n.resposta.id}
                          onClick={() => handleExcluirResposta(n.resposta!.id, n.identificacao)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                          title="Excluir resposta para permitir novo envio"
                        >
                          {excluindoId === n.resposta.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL DE DETALHES DA RESPOSTA */}
        {detalhesNucleo && detalhesNucleo.resposta && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
              {/* Header do modal */}
              <div className="p-5 border-b border-zinc-100 flex items-start justify-between gap-3 bg-gradient-to-r from-sky-50 to-white">
                <div>
                  <span className="text-3xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    Detalhes da Conferência
                  </span>
                  <h3 className="text-lg font-black text-zinc-900 mt-1">
                    {detalhesNucleo.identificacao}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    Professor: <strong>{detalhesNucleo.professorNome}</strong> • Enviado em:{" "}
                    {new Date(detalhesNucleo.resposta.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetalhesNucleo(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Corpo do modal */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
                {/* Quantitativo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                    <span className="text-3xs font-extrabold uppercase text-zinc-400">
                      Total Sistema
                    </span>
                    <p className="text-lg font-black text-zinc-800 mt-1">
                      {detalhesNucleo.resposta.total_alunos_sistema} alunos
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <span className="text-3xs font-extrabold uppercase text-emerald-700">
                      Total Informado / Auditado
                    </span>
                    <p className="text-lg font-black text-emerald-800 mt-1">
                      {detalhesNucleo.resposta.total_alunos_informado} alunos
                    </p>
                  </div>
                </div>

                {/* Vagas por turma */}
                {detalhesNucleo.resposta.distribuicao_turmas && (
                  <div className="space-y-2">
                    <h4 className="font-black text-zinc-900">
                      Distribuição de Vagas por Turma:
                    </h4>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
                      {Object.entries(detalhesNucleo.resposta.distribuicao_turmas).map(
                        ([turmaId, vagas]) => (
                          <div
                            key={turmaId}
                            className="flex items-center justify-between py-1 border-b border-zinc-100 last:border-0"
                          >
                            <span className="text-3xs text-zinc-600 font-bold">
                              Turma ID: {turmaId.slice(0, 8)}...
                            </span>
                            <span className="font-extrabold text-zinc-900">{vagas} vagas</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Alunos Novos Cadastrados (Cenário B) */}
                {detalhesNucleo.resposta.novos_alunos_cadastrados &&
                  detalhesNucleo.resposta.novos_alunos_cadastrados.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-zinc-900">
                          Alunos Cadastrados no Núcleo (
                          {detalhesNucleo.resposta.novos_alunos_cadastrados.length}):
                        </h4>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1.5 border border-zinc-200 rounded-xl p-2 bg-zinc-50">
                        {detalhesNucleo.resposta.novos_alunos_cadastrados.map((a, i) => (
                          <div
                            key={a.idTemp || i}
                            className="bg-white p-2.5 rounded-lg border border-zinc-200 text-3xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-black text-zinc-900 text-xs">
                                {i + 1}. {a.nomeCompleto}
                              </p>
                              <p className="text-zinc-500">
                                Nasc: {a.dataNascimento} • Sexo: {a.sexo}{" "}
                                {a.cpf ? `• CPF: ${a.cpf}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Observações */}
                {detalhesNucleo.resposta.observacoes && (
                  <div className="space-y-1">
                    <h4 className="font-black text-zinc-900">Observações do Professor:</h4>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 text-xs">
                      {detalhesNucleo.resposta.observacoes}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé do modal */}
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDetalhesNucleo(null)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
