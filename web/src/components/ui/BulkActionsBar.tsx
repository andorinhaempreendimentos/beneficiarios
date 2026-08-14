"use client";

import { ReactNode } from "react";
import { CheckSquare, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  allSelected?: boolean;
  children?: ReactNode;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  allSelected = false,
  children,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/95 text-white px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 max-w-[95vw] sm:max-w-max shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-2 border-r border-zinc-700/80 pr-3.5 shrink-0">
        <button
          type="button"
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 text-sky-400" />
          ) : (
            <Square className="h-4 w-4 text-zinc-400" />
          )}
          <span>
            <strong className="text-white font-bold">{selectedCount}</strong> selecionado(s)
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5 whitespace-nowrap shrink-0">
        {children}
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors ml-1 cursor-pointer shrink-0"
        title="Cancelar seleção"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
