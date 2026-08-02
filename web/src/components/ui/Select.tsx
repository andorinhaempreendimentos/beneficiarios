import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export function Select({ className, placeholder, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-zinc-50 disabled:text-zinc-500",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}
