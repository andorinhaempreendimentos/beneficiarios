"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Dumbbell,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/objetos", label: "Objetos", icon: FolderKanban },
  { href: "/nucleos", label: "Núcleos", icon: Building2 },
  { href: "/beneficiarios", label: "Beneficiários", icon: Users },
  { href: "/funcionarios", label: "Pessoal", icon: UsersRound },
  { href: "/atividades", label: "Atividades", icon: Dumbbell },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-sky-600" />
            <span className="text-base font-semibold text-zinc-900">Andorinha</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}