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
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white px-4 py-3 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 max-w-[90vw] sm:max-w-xl",
        className
      )}
    >
      <div className="flex items-center gap-2 border-r border-zinc-700 pr-3">
        <button
          type="button"
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 text-sky-400" />
          ) : (
            <Square className="h-4 w-4 text-zinc-400" />
          )}
          <span>
            {selectedCount} de {totalCount} selecionado(s)
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-1 overflow-x-auto py-0.5">
        {children}
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-auto"
        title="Cancelar seleção"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
