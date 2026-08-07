"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
  name: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export function RadioGroup({ name, options, value: propValue, onChange }: RadioGroupProps) {
  const [selectedValue, setSelectedValue] = useState(propValue || "");

  useEffect(() => {
    if (propValue !== undefined) {
      setSelectedValue(propValue);
    }
  }, [propValue]);

  const handleSelect = (option: string) => {
    setSelectedValue(option);
    onChange?.(option);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={selectedValue} />
      {options.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 active:scale-95",
              isSelected
                ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
