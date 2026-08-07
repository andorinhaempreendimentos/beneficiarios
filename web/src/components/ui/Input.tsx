import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const inputBase =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 shadow-sm transition-all hover:border-zinc-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-zinc-50 disabled:text-zinc-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-24 resize-y", className)} {...props} />;
}
