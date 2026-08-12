import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "sky" | "red" | "green" | "zinc";

const toneClasses: Record<Tone, string> = {
  sky: "bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300",
  red: "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300",
  green: "bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-300",
  zinc: "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
};

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: Tone;
  icon?: LucideIcon;
}

export function StatCard({ label, value, tone = "zinc", icon: Icon }: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors")}>
      {Icon && (
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}
