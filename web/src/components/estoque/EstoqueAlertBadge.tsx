"use client";

import type { EstoqueNucleoApi } from "@/lib/api/services";

type Nivel = "ok" | "atencao" | "baixo";

function calcNivel(item: EstoqueNucleoApi): Nivel {
  if (!item.material) return "ok";
  const pct = item.quantidadeAtual / Math.max(item.material.estoqueMinimo, 1);
  if (pct >= 1.5) return "ok";
  if (pct >= 1) return "atencao";
  return "baixo";
}

const nivelStyle: Record<Nivel, string> = {
  ok: "bg-green-50 text-green-700 border-green-200",
  atencao: "bg-amber-50 text-amber-700 border-amber-200",
  baixo: "bg-red-50 text-red-600 border-red-200",
};
const nivelDot: Record<Nivel, string> = {
  ok: "bg-green-500",
  atencao: "bg-amber-500",
  baixo: "bg-red-500",
};
const nivelLabel: Record<Nivel, string> = {
  ok: "OK",
  atencao: "Atenção",
  baixo: "Baixo",
};

interface EstoqueAlertBadgeProps {
  item: EstoqueNucleoApi;
  showQty?: boolean;
}

export function EstoqueAlertBadge({ item, showQty = false }: EstoqueAlertBadgeProps) {
  const nivel = calcNivel(item);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${nivelStyle[nivel]}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${nivelDot[nivel]}`} />
      {nivelLabel[nivel]}
      {showQty && (
        <span className="opacity-70 font-normal">
          {item.quantidadeAtual}{item.material ? ` ${item.material.unidadeMedida}` : ""}
        </span>
      )}
    </span>
  );
}

/** Versão simples sem EstoqueNucleoApi — só recebe quantidade e mínimo */
export function EstoqueAlertBadgeSimples({
  quantidade,
  minimo,
  unidade,
}: {
  quantidade: number;
  minimo: number;
  unidade?: string;
}) {
  const pct = quantidade / Math.max(minimo, 1);
  const nivel: Nivel = pct >= 1.5 ? "ok" : pct >= 1 ? "atencao" : "baixo";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${nivelStyle[nivel]}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${nivelDot[nivel]}`} />
      {nivelLabel[nivel]}
      <span className="opacity-70 font-normal">{quantidade}{unidade ? ` ${unidade}` : ""}</span>
    </span>
  );
}
