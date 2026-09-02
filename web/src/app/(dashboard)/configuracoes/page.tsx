"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui";
import { AbaPermissoes } from "@/components/configuracoes/AbaPermissoes";
import { AbaDicionario } from "@/components/configuracoes/AbaDicionario";
import { AbaStorage } from "@/components/configuracoes/AbaStorage";
import { AbaAparencia } from "@/components/configuracoes/AbaAparencia";
import { AbaInscricaoGeolocalizacao } from "@/components/configuracoes/AbaInscricaoGeolocalizacao";
import { cn } from "@/lib/utils";

type Aba = "permissoes" | "aparencia" | "dicionario" | "storage" | "inscricoes";

const ABAS: { id: Aba; label: string }[] = [
  { id: "permissoes", label: "Permissões / RBAC" },
  { id: "inscricoes", label: "Inscrições & GPS" },
  { id: "aparencia",  label: "Aparência" },
  { id: "dicionario", label: "Dicionário de Termos" },
  { id: "storage",    label: "Armazenamento" },
];

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<Aba>("permissoes");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações do Sistema"
        description="Gestão de permissões RBAC de acesso, geolocalização de inscrições, aparência e armazenamento"
      />

      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex gap-0">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer",
                aba === a.id
                  ? "border-sky-600 text-sky-700 bg-sky-50/50"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
              )}
            >
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      {aba === "permissoes" && <AbaPermissoes />}
      {aba === "inscricoes" && <AbaInscricaoGeolocalizacao />}
      {aba === "aparencia"  && <AbaAparencia />}
      {aba === "dicionario" && <AbaDicionario />}
      {aba === "storage"    && <AbaStorage />}
    </div>
  );
}
