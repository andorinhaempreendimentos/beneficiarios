"use client";

import { useState } from "react";
import { Check, Palette, Type } from "lucide-react";
import { temas } from "@/lib/theme";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function AbaAparencia() {
  const { config, aplicarTema, setNomeSistema } = useTheme();
  const [nome, setNome] = useState(config.nomeSistema);
  const [nomeSalvo, setNomeSalvo] = useState(false);

  function salvarNome() {
    setNomeSistema(nome.trim() || "Andorinha");
    setNomeSalvo(true);
    setTimeout(() => setNomeSalvo(false), 2000);
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Nome do sistema */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-800">Nome do sistema</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Aparece na aba do navegador, tela de login e cabeçalho da sidebar.
        </p>
        <div className="flex max-w-sm items-center gap-3">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvarNome()}
            maxLength={40}
            placeholder="Ex: Andorinha"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={salvarNome}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
          >
            {nomeSalvo ? <Check className="h-4 w-4" /> : null}
            {nomeSalvo ? "Salvo" : "Salvar"}
          </button>
        </div>
      </section>

      <div className="border-t border-zinc-100" />

      {/* Tema de cores */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-800">Tema de cores</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Define a cor primária usada em botões, links e destaques em todo o sistema.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {temas.map((tema) => {
            const ativo = config.temaId === tema.id;
            return (
              <button
                key={tema.id}
                type="button"
                onClick={() => aplicarTema(tema.id)}
                className={cn(
                  "relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all",
                  ativo
                    ? "border-sky-600 bg-sky-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                {ativo && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}

                {/* Paleta de swatches */}
                <div className="flex gap-1.5">
                  {(["600", "400", "200", "100", "50"] as const).map((shade) => (
                    <div
                      key={shade}
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ backgroundColor: tema.cores[shade] }}
                    />
                  ))}
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-800">{tema.nome}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{tema.descricao}</p>
                </div>

                {/* Botão preview */}
                <div
                  className="rounded-lg px-3 py-1.5 text-center text-xs font-medium text-white"
                  style={{ backgroundColor: tema.cores["600"] }}
                >
                  Botão de exemplo
                </div>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}
