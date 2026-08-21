"use client";

import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { AlertaProntidao } from "@/lib/api/prestacaoContas";

interface PainelProntidaoProps {
  alertas: AlertaProntidao[];
  loading?: boolean;
}

export function PainelProntidao({ alertas, loading }: PainelProntidaoProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs text-zinc-500 animate-pulse">
        Verificando prontidão dos dados operacionais do período...
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <strong className="font-semibold">Dados 100% Prontos:</strong> Todas as aulas possuem chamada lançada, supervisões estão finalizadas e o quadro operacional está consistente.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span>Painel de Prontidão Operacional (Avisos Informativos)</span>
      </div>
      <p className="text-xs text-amber-800/90">
        Os itens abaixo não bloqueiam a emissão do relatório, mas alertam sobre pendências que podem impactar os indicadores oficiais:
      </p>

      <ul className="mt-1 space-y-1.5 text-xs text-amber-900">
        {alertas.map((a, idx) => (
          <li key={idx} className="flex items-start gap-2 bg-amber-100/50 rounded-lg p-2">
            {a.tipo === "alerta" ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-3.5 w-3.5 text-sky-700 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-medium">{a.mensagem}</span>
              {a.detalhes && <span className="block text-amber-700 mt-0.5 text-[11px]">{a.detalhes}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
