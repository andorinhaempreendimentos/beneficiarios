"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
  name: string;
  options: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function RadioGroup({ name, options, value: externalValue, defaultValue, onChange }: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = externalValue !== undefined ? externalValue : internalValue;

  function handleSelect(val: string) {
    if (externalValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Campo hidden para garantir captura no FormData do formulario */}
      <input type="hidden" name={name} value={selectedValue} />

      {options.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all transform active:scale-95 border",
              isSelected
                ? "bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-500/20"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-sky-300 hover:bg-sky-50/50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
