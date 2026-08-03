"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { autenticar, autenticarBeneficiario, demoCredenciais, demoBeneficiario } from "@/lib/mock/credenciais";
import { rotaInicial } from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

type Modo = "sistema" | "beneficiario";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [modo, setModo] = useState<Modo>("sistema");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Campos sistema
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  // Campos beneficiário
  const [matricula, setMatricula] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [celular, setCelular] = useState("");

  function trocarModo(m: Modo) {
    setModo(m);
    setErro("");
    setShowDemo(false);
  }

  function handleSistema(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const user = autenticar(email.trim(), senha);
    if (!user) { setErro("Email ou senha incorretos."); setLoading(false); return; }
    finalizar(user);
  }

  function handleBeneficiario(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const user = autenticarBeneficiario(matricula.trim(), dataNasc, celular.trim());
    if (!user) { setErro("Dados não conferem. Verifique matrícula, data de nascimento e celular."); setLoading(false); return; }
    finalizar(user);
  }

  function finalizar(user: ReturnType<typeof autenticar>) {
    if (!user) return;
    login(user);
    setCookie("auth_type", user.tipo);
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : rotaInicial(user.tipo));
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 shadow-lg">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Andorinha</h1>
        <p className="text-sm text-zinc-500">Acesse sua conta para continuar</p>
      </div>

      {/* Toggle de modo */}
      <div className="mb-4 flex rounded-xl border border-zinc-200 bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => trocarModo("sistema")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
            modo === "sistema" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Equipe / Admin
        </button>
        <button
          type="button"
          onClick={() => trocarModo("beneficiario")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
            modo === "beneficiario" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Beneficiário
        </button>
      </div>

      {/* Formulário sistema */}
      {modo === "sistema" && (
        <form onSubmit={handleSistema} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-zinc-700">Senha</label>
            <div className="relative">
              <input
                id="senha" name="senha" type={showSenha ? "text" : "password"}
                autoComplete="current-password" required
                value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button type="button" onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
          <button type="submit" disabled={loading}
            className="mt-1 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}

      {/* Formulário beneficiário */}
      {modo === "beneficiario" && (
        <form onSubmit={handleBeneficiario} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="matricula" className="text-sm font-medium text-zinc-700">Matrícula</label>
            <input
              id="matricula" name="matricula" type="text" required
              value={matricula} onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ex: 2024-0001"
              className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm tracking-wider focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dataNasc" className="text-sm font-medium text-zinc-700">Data de nascimento</label>
            <input
              id="dataNasc" name="dataNasc" type="date" required
              value={dataNasc} onChange={(e) => setDataNasc(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="celular" className="text-sm font-medium text-zinc-700">Celular cadastrado</label>
            <input
              id="celular" name="celular" type="tel" required
              value={celular} onChange={(e) => setCelular(e.target.value)}
              placeholder="(21) 99999-0000"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
          <button type="submit" disabled={loading}
            className="mt-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}

      {/* Demo */}
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white">
        <button type="button" onClick={() => setShowDemo(!showDemo)}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-zinc-500 hover:text-zinc-700">
          Credenciais de demonstração
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDemo ? "rotate-180" : ""}`} />
        </button>
        {showDemo && (
          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {modo === "sistema" && demoCredenciais.map((c) => (
              <button key={c.email} type="button"
                onClick={() => { setEmail(c.email); setSenha(c.senha); setShowDemo(false); setErro(""); }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50">
                <span className="text-xs font-medium text-zinc-700">{c.label}</span>
                <span className="font-mono text-xs text-zinc-400">{c.email}</span>
              </button>
            ))}
            {modo === "beneficiario" && demoBeneficiario && (
              <button type="button"
                onClick={() => {
                  setMatricula(demoBeneficiario!.matricula);
                  setDataNasc(demoBeneficiario!.dataNascimento);
                  setCelular(demoBeneficiario!.celular);
                  setShowDemo(false);
                  setErro("");
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50">
                <span className="text-xs font-medium text-zinc-700">Beneficiário demo</span>
                <span className="font-mono text-xs text-zinc-400">{demoBeneficiario.matricula}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Andorinha &copy; 2024 — Sistema de Gestão de Beneficiários
      </p>
    </div>
  );
}
