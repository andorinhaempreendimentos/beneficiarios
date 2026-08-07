"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "./Button";

interface FilterBarProps {
  children: ReactNode;
  onFilter?: () => void;
  onClear?: () => void;
}

export function FilterBar({ children, onFilter, onClear }: FilterBarProps) {
  const [visible, setVisible] = useState(true);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-800 hover:text-sky-600 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <span>Filtros de Busca</span>
        </button>

        {visible && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClear} type="button">
              Limpar
            </Button>
            <Button size="sm" onClick={onFilter} type="button">
              Aplicar Filtros
            </Button>
          </div>
        )}
      </div>

      {visible && (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
