"use client";

import { UploadCloud } from "lucide-react";

export function FileUpload({ label = "Clique para enviar ou arraste o arquivo" }: { label?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center hover:border-sky-400 hover:bg-sky-50/50">
      <UploadCloud className="h-6 w-6 text-zinc-400" />
      <span className="text-sm text-zinc-500">{label}</span>
      <input type="file" className="hidden" />
    </label>
  );
}
