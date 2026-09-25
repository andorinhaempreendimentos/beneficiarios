"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Clock,
  Dumbbell,
  FileBarChart,
  FolderKanban,
  GraduationCap,
  Landmark,
  Layers,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  AlertCircle,
  ClipboardCheck,
  UserPlus,
  Users,
  UsersRound,
  UserCog,
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
  const isCoordenador = Boolean((user as any)?.isCoordenador);
  const isFuncionario = !isCoordenador && (user?.isProfessor || user?.tipo === "funcionario" || pathname.startsWith("/professor"));


  if (isFuncionario) {
    return null;
  }
  const [open, setOpen] = useState(false);
  const { config } = useTheme();

  // grupos de seção
  const projetoAtivo = ["/objetos", "/concedentes", "/organizacoes"].some((p) => pathname.startsWith(p));
  const [projetoAberto, setProjetoAberto] = useState(projetoAtivo);

  const operacionalAtivo = ["/nucleos", "/turmas", "/categoria-turmas", "/atividades", "/atividades-complementares", "/aulas"].some((p) => pathname.startsWith(p));
  const [operacionalAberto, setOperacionalAberto] = useState(operacionalAtivo);

  const turmasAtivo = pathname.startsWith("/turmas") || pathname.startsWith("/categoria-turmas");
  const [turmasAberto, setTurmasAberto] = useState(turmasAtivo);

  const beneficiariosGrupoAtivo = pathname.startsWith("/beneficiarios") || pathname.startsWith("/inscricoes");
  const [beneficiariosGrupoAberto, setBeneficiariosGrupoAberto] = useState(beneficiariosGrupoAtivo);

  const rhAtivo = ["/funcionarios", "/coordenadores", "/professor"].some((p) => pathname.startsWith(p));
  const [rhAberto, setRhAberto] = useState(rhAtivo);

  const patrimonioAtivo = ["/equipamentos", "/estoque"].some((p) => pathname.startsWith(p));
  const [patrimonioAberto, setPatrimonioAberto] = useState(patrimonioAtivo);

  const gestaoAtivo = ["/supervisoes", "/pendencias-gerais", "/relatorios"].some((p) => pathname.startsWith(p));
  const [gestaoAberto, setGestaoAberto] = useState(gestaoAtivo);

  const sistemaAtivo = ["/usuarios", "/configuracoes"].some((p) => pathname.startsWith(p));
  const [sistemaAberto, setSistemaAberto] = useState(sistemaAtivo);

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
          active
            ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  }

  function subLink(href: string, label: string, Icon?: React.ElementType) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          active ? "text-sky-700 dark:text-sky-300 font-medium" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </Link>
    );
  }

  function SectionGroup({
    label,
    aberto,
    setAberto,
    ativo,
    Icon,
    children,
  }: {
    label: string;
    aberto: boolean;
    setAberto: (v: boolean) => void;
    ativo: boolean;
    Icon: React.ElementType;
    children: React.ReactNode;
  }) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
            ativo
              ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", aberto && "rotate-180")} />
        </button>
        {aberto && (
          <div className="mt-0.5 space-y-0.5 pl-1">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 shadow-md lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-60 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:left-0",
          open ? "left-0" : "-left-60"
        )}
      >
        <div className="relative flex flex-col items-center justify-center border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
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

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {isFuncionario ? (
            <>
              {navLink("/professor", "Área do Professor", CalendarCheck)}
              {navLink("/professor/ponto", "Meu Ponto", Clock)}
              {navLink("/turmas", "Minhas Turmas", GraduationCap)}
              {navLink("/beneficiarios", "Beneficiários", Users)}
            </>
          ) : isCoordenador ? (
            <>
              {navLink("/coordenador", "Meu Painel", UserCog)}
              {navLink("/nucleos", t("local", "Núcleo", true), Building2)}
              {navLink("/supervisoes", "Supervisões", ClipboardCheck)}
              {navLink("/estoque", "Estoque", Package)}
              {navLink("/pendencias-gerais", "Pendências", AlertCircle)}
            </>
          ) : (
            <>
              {navLink("/", "Painel", LayoutDashboard)}

              {/* Projeto */}
              <SectionGroup label="Projeto" aberto={projetoAberto} setAberto={setProjetoAberto} ativo={projetoAtivo} Icon={FolderKanban}>
                {navLink("/objetos", t("objeto", "Objeto", true), FolderKanban)}
                {navLink("/concedentes", "Concedentes", Landmark)}
                {navLink("/organizacoes", t("organizacao", "Organização", true), Building2)}
              </SectionGroup>

              {/* Operacional */}
              <SectionGroup label="Operacional" aberto={operacionalAberto} setAberto={setOperacionalAberto} ativo={operacionalAtivo} Icon={Layers}>
                {navLink("/nucleos", t("local", "Núcleo", true), Building2)}

                {/* Turmas sub-dropdown */}
                <div>
                  <button
                    type="button"
                    onClick={() => setTurmasAberto((v) => !v)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      turmasAtivo ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{t("turma", "Turma", true)}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", turmasAberto && "rotate-180")} />
                  </button>
                  {turmasAberto && (
                    <div className="ml-7 mt-1 space-y-1 border-l border-zinc-200 dark:border-zinc-700 pl-3">
                      {subLink("/turmas", `Todas as ${t("turma", "Turma", true).toLowerCase()}`)}
                      {subLink("/turmas/novo", `Nova ${t("turma", "Turma").toLowerCase()}`)}
                      {subLink("/categoria-turmas", "Categorias")}
                    </div>
                  )}
                </div>

                {navLink("/atividades", t("atividade", "Atividade", true), Dumbbell)}
                {navLink("/atividades-complementares", "Atividades Especiais", CalendarCheck)}
                {navLink("/aulas", "Aulas", BookOpen)}
              </SectionGroup>

              {/* Beneficiários */}
              <SectionGroup label="Beneficiários" aberto={beneficiariosGrupoAberto} setAberto={setBeneficiariosGrupoAberto} ativo={beneficiariosGrupoAtivo} Icon={Users}>
                <Link
                  href="/beneficiarios"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/beneficiarios" || (pathname.startsWith("/beneficiarios") && !pathname.startsWith("/beneficiarios/novo"))
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  {t("beneficiario", "Beneficiário", true)}
                </Link>
                <Link
                  href="/inscricoes"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/inscricoes")
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  Inscrições
                </Link>
                <Link
                  href="/beneficiarios/novo"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/beneficiarios/novo"
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  {`Novo ${t("beneficiario", "Beneficiário").toLowerCase()}`}
                </Link>
              </SectionGroup>

              {/* Recursos Humanos */}
              <SectionGroup label="Recursos Humanos" aberto={rhAberto} setAberto={setRhAberto} ativo={rhAtivo} Icon={UsersRound}>
                {navLink("/funcionarios", "Funcionários", UsersRound)}
                {navLink("/funcionarios/funcoes", "Funções", ShieldCheck)}
                {navLink("/coordenadores", "Coordenadores", UserCog)}
                {navLink("/professor", "Área do Professor", CalendarCheck)}
              </SectionGroup>

              {/* Patrimônio */}
              <SectionGroup label="Patrimônio" aberto={patrimonioAberto} setAberto={setPatrimonioAberto} ativo={patrimonioAtivo} Icon={Package}>
                {navLink("/equipamentos", "Equipamentos", Box)}
                {navLink("/estoque", "Estoque", Package)}
              </SectionGroup>

              {/* Gestão */}
              <SectionGroup label="Gestão" aberto={gestaoAberto} setAberto={setGestaoAberto} ativo={gestaoAtivo} Icon={ClipboardCheck}>
                {navLink("/supervisoes", "Supervisões", ClipboardCheck)}
                {navLink("/pendencias-gerais", "Pendências", AlertCircle)}
                {navLink("/relatorios", "Relatórios", FileBarChart)}
              </SectionGroup>

              {/* Sistema */}
              <div className="my-2 border-t border-zinc-100 dark:border-zinc-800" />
              <SectionGroup label="Sistema" aberto={sistemaAberto} setAberto={setSistemaAberto} ativo={sistemaAtivo} Icon={Settings}>
                {navLink("/usuarios", "Usuários", ShieldCheck)}
                {navLink("/configuracoes", "Configurações", Settings)}
              </SectionGroup>
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