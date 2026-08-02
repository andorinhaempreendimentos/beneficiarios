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
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-zinc-700"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {visible ? "Ocultar filtros" : "Exibir filtros"}
      </button>
      {visible && (
        <div className="border-t border-zinc-200 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {children}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClear} type="button">
              Limpar
            </Button>
            <Button onClick={onFilter} type="button">
              Filtrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
