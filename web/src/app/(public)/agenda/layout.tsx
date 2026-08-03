"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { LogOut, User } from "lucide-react";
import { limparSessao } from "@/lib/auth";

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/agenda");
    }
    if (!loading && user && user.tipo === "beneficiario") {
      router.replace("/horarios");
    }
  }, [user, loading, router]);

  function handleLogout() {
    logout();
    document.cookie = "auth_type=; path=/; max-age=0";
    router.push("/login");
  }

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{user.nome}</p>
              <p className="text-xs text-zinc-400">Andorinha</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
