import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "zinc" | "sky" | "green" | "red" | "amber" | "violet";

const toneClasses: Record<Tone, string> = {
  zinc: "bg-zinc-100 text-zinc-700",
  sky: "bg-sky-100 text-sky-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
};

export function Badge({ tone = "zinc", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}
