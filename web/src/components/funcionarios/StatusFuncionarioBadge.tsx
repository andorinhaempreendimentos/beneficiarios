"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { funcionariosApi } from "@/lib/api/services";
import { statusFuncionarioTone, statusFuncionarioLabel } from "@/lib/status";
import type { StatusFuncionario } from "@/lib/types";
import { useToast } from "@/components/providers/ToastProvider";

const OPCOES: { value: StatusFuncionario; label: string; tone: keyof typeof statusFuncionarioTone }[] = [
  { value: "contratado", label: "Contratado", tone: "green" },
  { value: "voluntario", label: "Voluntário", tone: "sky" },
  { value: "pendente", label: "Pendente", tone: "amber" },
  { value: "demitido", label: "Demitido", tone: "red" },
];

interface StatusFuncionarioBadgeProps {
  funcionarioId: string;
  statusAtual?: string | null;
  onStatusChange?: (novoStatus: StatusFuncionario) => void;
}

export function StatusFuncionarioBadge({
  funcionarioId,
  statusAtual,
  onStatusChange,
}: StatusFuncionarioBadgeProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState<StatusFuncionario>(
    (statusAtual as StatusFuncionario) || "contratado"
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusAtual) setStatusState(statusAtual as StatusFuncionario);
  }, [statusAtual]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(novoStatus: StatusFuncionario) {
    setOpen(false);
    if (novoStatus === statusState) return;

    const statusAntigo = statusState;
    setStatusState(novoStatus);
    setLoading(true);

    try {
      await funcionariosApi.update(funcionarioId, { status: novoStatus });
      toast.success(
        `Status do funcionário alterado para ${statusFuncionarioLabel[novoStatus] ?? novoStatus}!`
      );
      if (onStatusChange) onStatusChange(novoStatus);
    } catch (err: any) {
      setStatusState(statusAntigo);
      toast.error(err?.message || "Erro ao alterar status do funcionário.");
    } finally {
      setLoading(false);
    }
  }

  const tone = statusFuncionarioTone[statusState] ?? "zinc";
  const label = statusFuncionarioLabel[statusState] ?? statusState;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center gap-1 rounded-full outline-hidden transition-all focus:ring-2 focus:ring-sky-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
        title="Clique para alterar o status"
      >
        <Badge tone={tone}>
          <span className="flex items-center gap-1">
            <span>{label}</span>
            <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </span>
        </Badge>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">
            Status do Colaborador
          </div>
          {OPCOES.map((op) => {
            const isSelected = op.value === statusState;
            return (
              <button
                key={op.value}
                type="button"
                onClick={() => handleSelect(op.value)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      op.tone === "green"
                        ? "bg-green-500"
                        : op.tone === "sky"
                        ? "bg-sky-500"
                        : op.tone === "amber"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span>{op.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-sky-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
