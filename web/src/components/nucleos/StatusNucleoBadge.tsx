"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { nucleosApi } from "@/lib/api/services";
import { useToast } from "@/components/providers/ToastProvider";

const OPCOES = [
  { value: true, label: "Em funcionamento", tone: "green" as const },
  { value: false, label: "Encerrado", tone: "zinc" as const },
];

interface StatusNucleoBadgeProps {
  nucleoId: string;
  emFuncionamento?: boolean;
  onStatusChange?: (novoStatus: boolean) => void;
}

export function StatusNucleoBadge({
  nucleoId,
  emFuncionamento = true,
  onStatusChange,
}: StatusNucleoBadgeProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState<boolean>(emFuncionamento);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatusState(emFuncionamento);
  }, [emFuncionamento]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(novoStatus: boolean) {
    setOpen(false);
    if (novoStatus === statusState) return;

    const statusAntigo = statusState;
    setStatusState(novoStatus);
    setLoading(true);

    try {
      await nucleosApi.update(nucleoId, { emFuncionamento: novoStatus });
      toast.success(
        `Status do núcleo alterado para ${novoStatus ? "Em funcionamento" : "Encerrado"}!`
      );
      if (onStatusChange) onStatusChange(novoStatus);
    } catch (err: any) {
      setStatusState(statusAntigo);
      toast.error(err?.message || "Erro ao alterar status do núcleo.");
    } finally {
      setLoading(false);
    }
  }

  const tone = statusState ? "green" : "zinc";
  const label = statusState ? "Em funcionamento" : "Encerrado";

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
            Status do Núcleo
          </div>
          {OPCOES.map((op) => {
            const isSelected = op.value === statusState;
            return (
              <button
                key={String(op.value)}
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
                      op.tone === "green" ? "bg-green-500" : "bg-zinc-400"
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
