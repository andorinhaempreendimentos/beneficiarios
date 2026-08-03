"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui";
import { AbaPermissoes } from "@/components/configuracoes/AbaPermissoes";
import { AbaDicionario } from "@/components/configuracoes/AbaDicionario";
import { AbaStorage } from "@/components/configuracoes/AbaStorage";
import { AbaAparencia } from "@/components/configuracoes/AbaAparencia";
import { cn } from "@/lib/utils";

type Aba = "aparencia" | "permissoes" | "dicionario" | "storage";

const ABAS: { id: Aba; label: string }[] = [
  { id: "aparencia",  label: "Aparência" },
  { id: "permissoes", label: "Permissões / RBAC" },
  { id: "dicionario", label: "Dicionário de Termos" },
  { id: "storage",    label: "Armazenamento" },
];

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<Aba>("aparencia");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description="Aparência, permissões de acesso, terminologia e armazenamento"
      />

      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex gap-0">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                aba === a.id
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
              )}
            >
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      {aba === "aparencia"  && <AbaAparencia />}
      {aba === "permissoes" && <AbaPermissoes />}
      {aba === "dicionario" && <AbaDicionario />}
      {aba === "storage"    && <AbaStorage />}
    </div>
  );
}
