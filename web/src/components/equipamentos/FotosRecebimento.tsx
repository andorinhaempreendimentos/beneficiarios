"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Trash2, UploadCloud } from "lucide-react";

interface FotoSlot {
  id: number;
  previewUrl: string | null;
  nome: string | null;
}

export function FotosRecebimento() {
  const [slots, setSlots] = useState<FotoSlot[]>([
    { id: 1, previewUrl: null, nome: null },
    { id: 2, previewUrl: null, nome: null },
  ]);

  function handleFile(id: number, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, previewUrl: url, nome: file.name } : s))
    );
  }

  function remover(id: number) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, previewUrl: null, nome: null } : s))
    );
  }

  const enviadas = slots.filter((s) => s.previewUrl !== null).length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-700">Fotos de recebimento</h3>
        </div>
        {enviadas > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {enviadas} de 2 foto{enviadas !== 1 ? "s" : ""} enviada{enviadas !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="mb-4 text-xs text-zinc-400">
          Registre até 2 fotos que comprovam o recebimento e custódia do material.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slots.map((slot) => (
            <div key={slot.id} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-zinc-500">Foto {slot.id}</p>

              {slot.previewUrl ? (
                <div className="relative overflow-hidden rounded-lg border border-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.previewUrl}
                    alt={`Foto de recebimento ${slot.id}`}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-3 py-2">
                    <span className="max-w-[180px] truncate text-xs text-white/80">{slot.nome}</span>
                    <button
                      type="button"
                      onClick={() => remover(slot.id)}
                      className="flex items-center gap-1 text-xs text-red-300 hover:text-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-300">
                  <UploadCloud className="h-6 w-6 text-zinc-300" />
                  <p className="text-xs text-zinc-400">Adicionar foto</p>
                  <div className="flex gap-2">
                    <label className="cursor-pointer rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                      <Camera className="mr-1.5 inline h-3.5 w-3.5" />
                      Câmera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFile(slot.id, e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <label className="cursor-pointer rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                      <UploadCloud className="mr-1.5 inline h-3.5 w-3.5" />
                      Galeria
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFile(slot.id, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <span className="text-xs text-zinc-300">JPG, PNG — máx. 5 MB</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {enviadas === 2 && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Salvar fotos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
