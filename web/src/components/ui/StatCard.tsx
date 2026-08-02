import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "sky" | "red" | "green" | "zinc";

const toneClasses: Record<Tone, string> = {
  sky: "bg-sky-50 text-sky-700",
  red: "bg-red-50 text-red-700",
  green: "bg-green-50 text-green-700",
  zinc: "bg-zinc-50 text-zinc-700",
};

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: Tone;
  icon?: LucideIcon;
}

export function StatCard({ label, value, tone = "zinc", icon: Icon }: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4")}>
      {Icon && (
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-2xl font-semibold text-zinc-900">{value}</p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
