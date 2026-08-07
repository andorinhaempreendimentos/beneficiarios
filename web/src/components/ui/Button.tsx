import { cn } from "@/lib/utils";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:outline-zinc-400",
  outline: "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus-visible:outline-zinc-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  ghost: "text-zinc-600 hover:bg-zinc-100 focus-visible:outline-zinc-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading = false, disabled, children, className, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export function LinkButton({ href, variant = "primary", size = "md", className, onClick, children }: LinkButtonProps) {
  return (
    <Link href={href} onClick={onClick} className={cn(base, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </Link>
  );
}
