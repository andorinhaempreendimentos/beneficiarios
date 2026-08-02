"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-2", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
          checked ? "bg-sky-600" : "bg-zinc-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
      {label && <span className="text-sm text-zinc-700">{label}</span>}
    </label>
  );
}
