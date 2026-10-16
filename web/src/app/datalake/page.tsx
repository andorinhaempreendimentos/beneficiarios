"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  FileText,
  Phone,
  Calendar,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

interface AlunoDatalake {
  id: string;
  matricula: string | null;
  nome_completo: string;
  data_nascimento: string | null;
  idade: number | null;
  sexo: string | null;
  cpf: string | null;
  nucleo_id: string | null;
  nucleo_nome: string;
  responsavel_nome: string | null;
  responsavel_contato: string | null;
  origem: "banco_ativo" | "formulario_online" | string;
  created_at: string;
}

interface NucleoMeta {
  id: string;
  nome: string;
  nomeLocal: string | null;
  totalBanco: number;
  totalFormulario: number;
  totalGeral: number;
  meta: number;
  percentual: number;
  statusMeta: "atingida" | "em_andamento" | "zerado";
}

interface DatalakeResumo {
  totalGeral: number;
  totalBanco: number;
  totalFormulario: number;
  totalNucleos: number;
  atualizadoEm: string;
}

const SENHA_LOCAL = "Datalake123#";

export default function DatalakePage() {
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [senhaInput, setSenhaInput] = useState<string>("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const [resumo, setResumo] = useState<DatalakeResumo | null>(null);
  const [nucleosMetas, setNucleosMetas] = useState<NucleoMeta[]>([]);
  const [alunos, setAlunos] = useState<AlunoDatalake[]>([]);

  // Filtros
  const [busca, setBusca] = useState<string>("");
  const [filtroNucleo, setFiltroNucleo] = useState<string>("todos");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("todos");
  const [filtroFaixa, setFiltroFaixa] = useState<string>("todas");
  const [ordenacao, setOrdenacao] = useState<"nome" | "idade" | "nucleo">("nucleo");
  const [ordemAsc, setOrdemAsc] = useState<boolean>(true);

  // Checar autenticação inicial
  useEffect(() => {
    if (typeof window !== "undefined") {
      const salvo = sessionStorage.getItem("datalake_auth_token");
      if (salvo === "Datalake123#" || salvo === "Datalake123") {
        setAutenticado(true);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const carregarDados = async (senhaParaUsar?: string) => {
    const senha = senhaParaUsar || sessionStorage.getItem("datalake_auth_token") || "";
    if (!senha) return;

    try {
      setLoading(true);
      setErro(null);

      const res = await fetch(`/api/datalake?t=${Date.now()}`, {
        headers: {
          "x-datalake-senha": senha,
        },
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao carregar dados do datalake.");
      }

      setResumo(data.resumo);
      setNucleosMetas(data.nucleosMetas || []);
      setAlunos(data.alunos || []);
      setAutenticado(true);
    } catch (err: any) {
      setErro(err.message || "Erro ao conectar com o datalake.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      carregarDados();
    }
  }, [autenticado]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const limpa = senhaInput.trim();
    if (limpa === "Datalake123#" || limpa === "Datalake123") {
      sessionStorage.setItem("datalake_auth_token", limpa);
      setErroSenha(null);
      setAutenticado(true);
      carregarDados(limpa);
    } else {
      setErroSenha("Senha incorreta. Tente novamente.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("datalake_auth_token");
    setAutenticado(false);
    setSenhaInput("");
    setAlunos([]);
    setNucleosMetas([]);
  };

  // Filtragem
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a) => {
      // Busca textual
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const nomeMatch = a.nome_completo?.toLowerCase().includes(q);
        const respMatch = a.responsavel_nome?.toLowerCase().includes(q);
        const contMatch = a.responsavel_contato?.toLowerCase().includes(q);
        const nucMatch = a.nucleo_nome?.toLowerCase().includes(q);
        const matMatch = a.matricula?.toLowerCase().includes(q);
        if (!nomeMatch && !respMatch && !contMatch && !nucMatch && !matMatch) {
          return false;
        }
      }

      // Filtro Núcleo
      if (filtroNucleo !== "todos") {
        if (a.nucleo_id !== filtroNucleo && a.nucleo_nome !== filtroNucleo) {
          return false;
        }
      }

      // Filtro Origem
      if (filtroOrigem !== "todos") {
        if (a.origem !== filtroOrigem) {
          return false;
        }
      }

      // Filtro Faixa Etária
      if (filtroFaixa !== "todas") {
        const id = a.idade;
        if (id === null || id === undefined) return false;
        if (filtroFaixa === "ate_6" && id > 6) return false;
        if (filtroFaixa === "7_10" && (id < 7 || id > 10)) return false;
        if (filtroFaixa === "11_14" && (id < 11 || id > 14)) return false;
        if (filtroFaixa === "15_mais" && id < 15) return false;
      }

      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (ordenacao === "nome") {
        comp = (a.nome_completo || "").localeCompare(b.nome_completo || "");
      } else if (ordenacao === "idade") {
        comp = (a.idade || 0) - (b.idade || 0);
      } else if (ordenacao === "nucleo") {
        comp = (a.nucleo_nome || "").localeCompare(b.nucleo_nome || "");
      }
      return ordemAsc ? comp : -comp;
    });
  }, [alunos, busca, filtroNucleo, filtroOrigem, filtroFaixa, ordenacao, ordemAsc]);

  // Exportar CSV
  const exportarCSV = () => {
    if (!alunosFiltrados.length) return;

    const cabecalhos = [
      "ID",
      "Matrícula",
      "Nome do Aluno",
      "Data Nascimento",
      "Idade",
      "Sexo",
      "CPF Aluno",
      "Núcleo",
      "Responsável",
      "WhatsApp / Contato",
      "Origem do Registro",
      "Data Registro",
    ];

    const linhas = alunosFiltrados.map((a) => [
      `"${a.id || ""}"`,
      `"${a.matricula || ""}"`,
      `"${(a.nome_completo || "").replace(/"/g, '""')}"`,
      `"${a.data_nascimento || ""}"`,
      `"${a.idade ?? ""}"`,
      `"${a.sexo || ""}"`,
      `"${a.cpf || ""}"`,
      `"${(a.nucleo_nome || "").replace(/"/g, '""')}"`,
      `"${(a.responsavel_nome || "").replace(/"/g, '""')}"`,
      `"${a.responsavel_contato || ""}"`,
      `"${a.origem === "banco_ativo" ? "Banco Ativo" : "Formulário Online"}"`,
      `"${a.created_at || ""}"`,
    ]);

    const conteudoCSV = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `datalake_beneficiarios_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Se não autenticado, exibir tela de senha
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 text-zinc-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            Datalake de Beneficiários
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Área de consulta e conferência consolidada da coordenação.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-zinc-900 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-zinc-800">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={senhaInput}
                    onChange={(e) => {
                      setSenhaInput(e.target.value);
                      setErroSenha(null);
                    }}
                    placeholder="Digite a senha..."
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>
                {erroSenha && (
                  <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {erroSenha}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Acessar Datalake
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <span className="text-xs text-zinc-500 font-medium">
                Acesso restrito para consulta • Projeto Atletas para Sempre
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-16">
      {/* Topo / Header */}
      <header className="bg-zinc-900 text-white border-b border-zinc-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Datalake de Beneficiários
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tempo Real
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Apenas Consulta
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Cruzamento unificado: Banco Relacional + Formulários dos Responsáveis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => carregarDados()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={exportarCSV}
              disabled={!alunosFiltrados.length}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV ({alunosFiltrados.length})</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-xs font-semibold text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-900/50 transition-all cursor-pointer"
              title="Sair da consulta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Cards de Resumo Geral */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total no Datalake</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-900">
              {resumo ? resumo.totalGeral : "..."}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Registros consolidados</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Banco Ativo</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {resumo ? resumo.totalBanco : "..."}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Tabela beneficiários</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Formulário Online</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-blue-600">
              {resumo ? resumo.totalFormulario : "..."}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Cadastrados pelos pais</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Núcleos</span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-purple-700">
              {resumo ? resumo.totalNucleos : 20}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Meta de 100 alunos/núcleo</p>
          </div>
        </section>

        {/* Metas dos 20 Núcleos (Visual Rápido) */}
        <section className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-700" />
                Painel de Metas dos 20 Núcleos (Meta: 100 alunos)
              </h2>
              <p className="text-xs text-zinc-500">
                Clique em qualquer núcleo para filtrar a tabela de alunos abaixo.
              </p>
            </div>
            {filtroNucleo !== "todos" && (
              <button
                onClick={() => setFiltroNucleo("todos")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-auto cursor-pointer"
              >
                Limpar filtro de núcleo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {nucleosMetas.map((n) => {
              const selecionado = filtroNucleo === n.id || filtroNucleo === n.nome;
              return (
                <div
                  key={n.id}
                  onClick={() => setFiltroNucleo(selecionado ? "todos" : n.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selecionado
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                      : "border-zinc-200/90 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-xs text-zinc-900 truncate" title={n.nome}>
                      {n.nome}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        n.percentual >= 100
                          ? "bg-emerald-100 text-emerald-800"
                          : n.totalGeral > 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {n.totalGeral}/100
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        n.percentual >= 100
                          ? "bg-emerald-500"
                          : n.totalGeral > 0
                          ? "bg-blue-500"
                          : "bg-zinc-300"
                      }`}
                      style={{ width: `${n.percentual}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Banco: <strong className="text-zinc-700">{n.totalBanco}</strong></span>
                    <span>Form: <strong className="text-zinc-700">{n.totalFormulario}</strong></span>
                    <span>{n.percentual}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tabela de Consulta do Datalake */}
        <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
          {/* Controles de Filtros */}
          <div className="p-5 border-b border-zinc-200/80 bg-zinc-50/60 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por aluno, responsável, CPF ou WhatsApp..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Dropdown Núcleo */}
              <select
                value={filtroNucleo}
                onChange={(e) => setFiltroNucleo(e.target.value)}
                className="bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="todos">Todos os Núcleos</option>
                {nucleosMetas.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nome} ({n.totalGeral})
                  </option>
                ))}
              </select>

              {/* Dropdown Origem */}
              <select
                value={filtroOrigem}
                onChange={(e) => setFiltroOrigem(e.target.value)}
                className="bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="todos">Todas as Origens</option>
                <option value="banco_ativo">Apenas Banco Ativo</option>
                <option value="formulario_online">Apenas Formulário Online</option>
              </select>

              {/* Dropdown Faixa Etária */}
              <select
                value={filtroFaixa}
                onChange={(e) => setFiltroFaixa(e.target.value)}
                className="bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="todas">Todas as Idades</option>
                <option value="ate_6">Até 6 anos</option>
                <option value="7_10">7 a 10 anos</option>
                <option value="11_14">11 a 14 anos</option>
                <option value="15_mais">15 anos ou mais</option>
              </select>

              {/* Ordenação */}
              <button
                onClick={() => setOrdemAsc(!ordemAsc)}
                className="inline-flex items-center gap-1 bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-700 font-semibold shadow-sm hover:bg-zinc-50 cursor-pointer"
                title="Inverter ordem"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <span>{ordemAsc ? "Crescente" : "Decrescente"}</span>
              </button>
            </div>
          </div>

          {/* Contador de Registros */}
          <div className="px-5 py-2.5 bg-zinc-100/60 border-b border-zinc-200 text-xs font-semibold text-zinc-600 flex items-center justify-between">
            <span>
              Exibindo <strong>{alunosFiltrados.length}</strong> de{" "}
              <strong>{alunos.length}</strong> alunos no datalake
            </span>
            {(filtroNucleo !== "todos" || filtroOrigem !== "todos" || filtroFaixa !== "todas" || busca) && (
              <button
                onClick={() => {
                  setBusca("");
                  setFiltroNucleo("todos");
                  setFiltroOrigem("todos");
                  setFiltroFaixa("todas");
                }}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>

          {/* Tabela de Registros */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-600">Carregando dados do Datalake...</p>
              </div>
            ) : alunosFiltrados.length === 0 ? (
              <div className="py-20 text-center">
                <AlertCircle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-700">Nenhum aluno encontrado</p>
                <p className="text-xs text-zinc-500 mt-1">Ajuste os filtros ou a busca acima.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Aluno / Matrícula</th>
                    <th className="py-3 px-4">Idade / Nasc.</th>
                    <th className="py-3 px-4">Sexo</th>
                    <th className="py-3 px-4">Núcleo</th>
                    <th className="py-3 px-4">Responsável & Contato</th>
                    <th className="py-3 px-4 text-center">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80">
                  {alunosFiltrados.map((aluno, index) => {
                    const limpaWhats = (aluno.responsavel_contato || "").replace(/\D/g, "");
                    const linkWhats =
                      limpaWhats.length >= 10
                        ? `https://wa.me/55${limpaWhats.startsWith("55") ? limpaWhats.slice(2) : limpaWhats}`
                        : null;

                    return (
                      <tr
                        key={aluno.id || index}
                        className="hover:bg-zinc-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-mono text-zinc-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900 text-xs sm:text-sm">
                            {aluno.nome_completo}
                          </div>
                          {aluno.matricula && (
                            <div className="text-[10px] font-mono text-zinc-500">
                              Matrícula: {aluno.matricula}
                            </div>
                          )}
                          {aluno.cpf && (
                            <div className="text-[10px] font-mono text-zinc-400">
                              CPF: {aluno.cpf}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-extrabold text-zinc-800 text-sm">
                            {aluno.idade !== null ? `${aluno.idade} anos` : "—"}
                          </span>
                          {aluno.data_nascimento && (
                            <div className="text-[11px] text-zinc-400">
                              {aluno.data_nascimento.split("-").reverse().join("/")}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-600">
                          {aluno.sexo || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                            {aluno.nucleo_nome}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-800">
                            {aluno.responsavel_nome || "—"}
                          </div>
                          {aluno.responsavel_contato && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {linkWhats ? (
                                <a
                                  href={linkWhats}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900 hover:underline font-mono text-[11px] flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{aluno.responsavel_contato}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="font-mono text-zinc-500 text-[11px]">
                                  {aluno.responsavel_contato}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {aluno.origem === "banco_ativo" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Banco Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                              <FileText className="w-3 h-3 text-blue-600" />
                              Formulário
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
