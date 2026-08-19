"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { apiLogin, AuthError } from "@/lib/api/auth";
import { rotaInicial } from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { config } = useTheme();

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const profile = await apiLogin(email.trim(), senha);
      login(profile);
      const next = searchParams.get("next");
      router.push(
        next && next.startsWith("/") ? next : rotaInicial(profile)
      );
    } catch (err) {
      setErro(err instanceof AuthError ? err.message : "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
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
          <Logo
            className={
              config.logoUrl
                ? "h-24 w-auto max-w-[220px] object-contain drop-shadow-sm"
                : "h-20 w-20 drop-shadow-sm"
            }
          />
          <div className="text-center">
            {config.logoUrl ? (
              <p className="text-sm font-medium text-zinc-400">{config.nomeSistema}</p>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{config.nomeSistema}</h1>
            )}
            <p className="mt-1 text-sm text-zinc-500">Acesso restrito. Faça login para continuar.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/90 shadow-xl shadow-zinc-200/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
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
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Andorinha &copy; 2026
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
