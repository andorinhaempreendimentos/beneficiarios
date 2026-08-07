"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  FileBarChart,
  FolderKanban,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDicionario } from "@/components/providers/DictionaryProvider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useDicionario();
  const isFuncionario = user?.tipo === "funcionario";
  const [open, setOpen] = useState(false);
  const turmasAtivo = pathname.startsWith("/turmas");
  const [turmasAberto, setTurmasAberto] = useState(turmasAtivo);

  const beneficiariosAtivo = pathname.startsWith("/beneficiarios") || pathname.startsWith("/inscricoes");
  const [beneficiariosAberto, setBeneficiariosAberto] = useState(beneficiariosAtivo);

  const pessoalAtivo = pathname.startsWith("/funcionarios");
  const [pessoalAberto, setPessoalAberto] = useState(pessoalAtivo);
  const { config } = useTheme();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function navLink(href: string, label: string, Icon: React.ElementType) {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-sky-50 text-sky-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-zinc-700" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-60 flex-col border-r border-zinc-200 bg-white transition-[left] duration-200 lg:static lg:left-0",
          open ? "left-0" : "-left-60"
        )}
      >
        <div className="relative flex flex-col items-center justify-center border-b border-zinc-200 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
          {config.logoUrl ? (
            <>
              <Logo className="h-auto w-[70%] max-h-24 object-contain" />
              <span className="mt-1 truncate text-xs font-medium text-zinc-400">{config.nomeSistema}</span>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-8 shrink-0" />
              <span className="truncate text-sm font-semibold text-zinc-900">{config.nomeSistema}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {isFuncionario ? (
            <>
              {navLink("/professor", "Área do Professor", CalendarCheck)}
              {navLink("/turmas", "Minhas Turmas", GraduationCap)}
              {navLink("/beneficiarios", "Beneficiários", Users)}
            </>
          ) : (
            <>
              {navLink("/", "Painel", LayoutDashboard)}
              {navLink("/objetos", t("objeto", "Objeto", true), FolderKanban)}
              {navLink("/organizacoes", t("organizacao", "Organização", true), Landmark)}
              {navLink("/nucleos", t("local", "Núcleo", true), Building2)}

              {/* Turmas com subitem */}
              <div>
                <button
                  type="button"
                  onClick={() => setTurmasAberto((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    turmasAtivo ? "bg-sky-50 text-sky-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{t("turma", "Turma", true)}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", turmasAberto && "rotate-180")} />
                </button>
                {turmasAberto && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-zinc-200 pl-3">
                    <Link
                      href="/turmas"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/turmas" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      {`Todas as ${t("turma", "Turma", true).toLowerCase()}`}
                    </Link>
                    <Link
                      href="/turmas/novo"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/turmas/novo" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      {`Nova ${t("turma", "Turma").toLowerCase()}`}
                    </Link>
                  </div>
                )}
              </div>

              {navLink("/atividades", t("atividade", "Atividade", true), Dumbbell)}

              {/* Beneficiários com subitem */}
              <div>
                <button
                  type="button"
                  onClick={() => setBeneficiariosAberto((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    beneficiariosAtivo ? "bg-sky-50 text-sky-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{t("beneficiario", "Beneficiário", true)}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", beneficiariosAberto && "rotate-180")} />
                </button>
                {beneficiariosAberto && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-zinc-200 pl-3">
                    <Link
                      href="/beneficiarios"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/beneficiarios" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      {`Todos os ${t("beneficiario", "Beneficiário", true).toLowerCase()}`}
                    </Link>
                    <Link
                      href="/inscricoes"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/inscricoes" || pathname.includes("/inscricoes") ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                      Inscrições
                    </Link>
                    <Link
                      href="/beneficiarios/novo"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/beneficiarios/novo" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <UserPlus className="h-3.5 w-3.5 shrink-0" />
                      {`Novo ${t("beneficiario", "Beneficiário").toLowerCase()}`}
                    </Link>
                  </div>
                )}
              </div>

              {/* Pessoal / Funcionários com subitem */}
              <div>
                <button
                  type="button"
                  onClick={() => setPessoalAberto((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pessoalAtivo ? "bg-sky-50 text-sky-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <UsersRound className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">Pessoal</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", pessoalAberto && "rotate-180")} />
                </button>
                {pessoalAberto && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-zinc-200 pl-3">
                    <Link
                      href="/funcionarios"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/funcionarios" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <UsersRound className="h-3.5 w-3.5 shrink-0" />
                      Todos os funcionários
                    </Link>
                    <Link
                      href="/funcionarios/funcoes"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/funcionarios/funcoes" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      Gerenciar funções
                    </Link>
                    <Link
                      href="/professor"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === "/professor" ? "text-sky-700 font-medium" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                      Área do Professor
                    </Link>
                  </div>
                )}
              </div>

              {navLink("/equipamentos", "Equipamentos", Box)}

              <div className="my-2 border-t border-zinc-100" />

              {navLink("/relatorios", "Relatórios", FileBarChart)}
              {navLink("/usuarios", "Usuários", ShieldCheck)}
              {navLink("/configuracoes", "Configurações", Settings)}
            </>
          )}
        </nav>

        <div className="border-t border-zinc-100 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}