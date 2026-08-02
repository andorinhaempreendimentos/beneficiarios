"use client";

import { cn } from "@/lib/utils";

interface RadioGroupProps {
  name: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label key={option} className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange?.(option)}
            className={cn(
              "h-4 w-4 border-zinc-300 text-sky-600 focus:ring-sky-500"
            )}
          />
          {option}
        </label>
      ))}
    </div>
  );
}
