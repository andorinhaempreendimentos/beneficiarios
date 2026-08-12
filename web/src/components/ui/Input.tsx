"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import {
  mascararCpf,
  mascararCnpj,
  mascararCpfCnpj,
  mascararTelefone,
  mascararCep,
  apenasNumeros,
} from "@/lib/mascaras";

const inputBase =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:text-zinc-400 dark:disabled:text-zinc-600";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mask?: "cpf" | "cnpj" | "cpfCnpj" | "telefone" | "cep" | "numeros";
}

export function Input({ className, mask, onChange, value, defaultValue, ...props }: InputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (mask) {
      let val = e.target.value;
      if (mask === "cpf") val = mascararCpf(val);
      else if (mask === "cnpj") val = mascararCnpj(val);
      else if (mask === "cpfCnpj") val = mascararCpfCnpj(val);
      else if (mask === "telefone") val = mascararTelefone(val);
      else if (mask === "cep") val = mascararCep(val);
      else if (mask === "numeros") val = apenasNumeros(val);
      e.target.value = val;
    }
    onChange?.(e);
  }

  return <input className={cn(inputBase, className)} value={value} defaultValue={defaultValue} onChange={handleChange} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-24 resize-y", className)} {...props} />;
}
