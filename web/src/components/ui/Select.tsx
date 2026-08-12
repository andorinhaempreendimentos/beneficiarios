import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, placeholder, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3.5 py-2.5 pr-10 text-sm font-medium text-zinc-800 dark:text-zinc-100 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:text-zinc-400 dark:disabled:text-zinc-600",
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
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
});
