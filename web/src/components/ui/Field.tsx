import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
