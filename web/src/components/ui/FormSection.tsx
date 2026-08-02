"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FormSection({ title, defaultOpen = true, children }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-zinc-200 px-5 py-5">{children}</div>}
    </div>
  );
}
