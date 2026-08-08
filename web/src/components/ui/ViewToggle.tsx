"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "cards" | "table";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 gap-1", className)}>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          mode === "cards"
            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
        )}
        title="Visualização em Cards"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>Cards</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          mode === "table"
            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
        )}
        title="Visualização em Lista / Tabela"
      >
        <List className="h-3.5 w-3.5" />
        <span>Lista</span>
      </button>
    </div>
  );
}
