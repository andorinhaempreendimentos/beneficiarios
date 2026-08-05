"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { apiLogin, apiLoginBeneficiario } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { rotaInicial } from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";

type Modo = "sistema" | "beneficiario";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [modo, setModo] = useState<Modo>("sistema");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const [matricula, setMatricula] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [celular, setCelular] = useState("");

  function trocarModo(m: Modo) {
    setModo(m);
    setErro("");
    setShowDemo(false);
  }

  async function handleSistema(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const profile = await apiLogin(email.trim(), senha);
      finalizar(profile);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBeneficiario(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const profile = await apiLoginBeneficiario(matricula.trim(), dataNasc, celular.trim());
      finalizar(profile);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  function finalizar(profile: Awaited<ReturnType<typeof apiLogin>>) {
    login(profile);
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : rotaInicial(profile.tipo as Parameters<typeof rotaInicial>[0]));
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-12"
      style={{
        background: "radial-gradient(ellipse at 30% 40%, #ddddf0 0%, #eceaf7 35%, #f4f3fb 65%, #f9f9fd 100%)",
      }}
    >
      <div className="w-full max-w-sm">

        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="h-20 w-20 drop-shadow-sm" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Andorinha</h1>
            <p className="mt-1 text-sm text-zinc-500">Acesso restrito. Faça login para continuar.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/90 shadow-xl shadow-zinc-200/60 backdrop-blur-sm">

          <div className="border-b border-zinc-100 p-4">
            <div className="flex rounded-xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => trocarModo("sistema")}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  modo === "sistema"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Equipe / Admin
              </button>
              <button
                type="button"
                onClick={() => trocarModo("beneficiario")}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  modo === "beneficiario"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Beneficiário
              </button>
            </div>
          </div>

          {modo === "sistema" && (
            <form onSubmit={handleSistema} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  E-MAIL
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  SENHA
                </label>
                <div className="relative">
                  <input
                    id="senha" name="senha" type={showSenha ? "text" : "password"}
                    autoComplete="current-password" required
                    value={senha} onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 transition-colors"
              >
                {loading ? "Entrando…" : "Entrar no painel →"}
              </button>
            </form>
          )}

          {modo === "beneficiario" && (
            <form onSubmit={handleBeneficiario} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="matricula" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  MATRÍCULA
                </label>
                <input
                  id="matricula" name="matricula" type="text" required
                  value={matricula} onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ex: 2024-0001"
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-sm tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dataNasc" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  DATA DE NASCIMENTO
                </label>
                <input
                  id="dataNasc" name="dataNasc" type="date" required
                  value={dataNasc} onChange={(e) => setDataNasc(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="celular" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  CELULAR CADASTRADO
                </label>
                <input
                  id="celular" name="celular" type="tel" required
                  value={celular} onChange={(e) => setCelular(e.target.value)}
                  placeholder="(21) 99999-0000"
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 transition-colors"
              >
                {loading ? "Entrando…" : "Acessar meus horários →"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex w-full items-center justify-between px-5 py-3 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Credenciais de demonstração
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDemo ? "rotate-180" : ""}`} />
            </button>
            {showDemo && (
              <div className="divide-y divide-zinc-50 border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400">
                {modo === "sistema" && (
                  <>
                    <p>admin@andorinha.app</p>
                    <p className="mt-1">Senha: andorinha123</p>
                  </>
                )}
                {modo === "beneficiario" && (
                  <p>Use matrícula, data de nascimento e celular cadastrados.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Andorinha &copy; 2024
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
