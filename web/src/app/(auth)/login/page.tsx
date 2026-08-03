"use client";

import { useState } from "react";
import { LayoutDashboard, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 shadow-lg">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Andorinha</h1>
        <p className="text-sm text-zinc-500">Acesse sua conta para continuar</p>
      </div>

      <form className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="remember" className="rounded border-zinc-300" />
            Lembrar de mim
          </label>
          <a href="#" className="text-sm text-sky-600 hover:underline">
            Esqueci a senha
          </a>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Andorinha &copy; 2024 — Sistema de Gestão de Beneficiários
      </p>
    </div>
  );
}
