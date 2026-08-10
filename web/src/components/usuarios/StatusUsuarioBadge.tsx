"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { usuariosApi } from "@/lib/api/services";
import { statusUsuarioTone, statusUsuarioLabel } from "@/lib/status";
import type { StatusUsuario } from "@/lib/types";
import { useToast } from "@/components/providers/ToastProvider";

const OPCOES: { value: StatusUsuario; label: string; tone: "zinc" | "green" | "red" }[] = [
  { value: "ativo", label: "Ativo", tone: "green" },
  { value: "inativo", label: "Inativo", tone: "zinc" },
  { value: "bloqueado", label: "Bloqueado", tone: "red" },
];

interface StatusUsuarioBadgeProps {
  usuarioId: string;
  statusAtual?: string | null;
  onStatusChange?: (novoStatus: StatusUsuario) => void;
}

export function StatusUsuarioBadge({
  usuarioId,
  statusAtual,
  onStatusChange,
}: StatusUsuarioBadgeProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState<StatusUsuario>(
    (statusAtual as StatusUsuario) || "ativo"
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusAtual) setStatusState(statusAtual as StatusUsuario);
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

  async function handleSelect(novoStatus: StatusUsuario) {
    setOpen(false);
    if (novoStatus === statusState) return;

    const statusAntigo = statusState;
    setStatusState(novoStatus);
    setLoading(true);

    try {
      await usuariosApi.update(usuarioId, { status: novoStatus });
      toast.success(
        `Status do usuário alterado para ${statusUsuarioLabel[novoStatus] ?? novoStatus}!`
      );
      if (onStatusChange) onStatusChange(novoStatus);
    } catch (err: any) {
      setStatusState(statusAntigo);
      toast.error(err?.message || "Erro ao alterar status do usuário.");
    } finally {
      setLoading(false);
    }
  }

  const tone = statusUsuarioTone[statusState] ?? "zinc";
  const label = statusUsuarioLabel[statusState] ?? statusState;

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
        <div className="absolute right-0 z-50 mt-1.5 w-36 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">
            Status do Usuário
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
                      op.value === "ativo"
                        ? "bg-green-500"
                        : op.value === "bloqueado"
                        ? "bg-red-500"
                        : "bg-zinc-400"
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
