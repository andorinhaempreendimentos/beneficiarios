"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

interface LinkRowProps {
  label: string;
  sub?: string;
  path: string;
}

export function LinkRow({ label, sub, path }: LinkRowProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-800">{label}</p>
        {sub && <p className="truncate text-xs text-zinc-400">{sub}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          title={copiado ? "Copiado!" : "Copiar link"}
          onClick={copiar}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          {copiado ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <Link
          href={path}
          target="_blank"
          title="Abrir link"
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-sky-600 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
