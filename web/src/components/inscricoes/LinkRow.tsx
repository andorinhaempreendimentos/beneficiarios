"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

export function LinkRow({ label, tipo, path }: { label: string; tipo: string; path: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-zinc-800">{label}</span>
        <span className="text-xs text-zinc-400">{tipo}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{path}</code>
        <Link
          href={path}
          target="_blank"
          className="flex items-center gap-1 text-sky-600 hover:underline text-sm"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir
        </Link>
        <button
          type="button"
          title="Copiar link"
          onClick={copiar}
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          {copiado ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
