"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { supervisoesFotosApi, type SupervisaoFotoApi } from "@/lib/api/services";

type Categoria = SupervisaoFotoApi["categoria"];

const CATEGORIAS: { value: Categoria; label: string; emoji: string }[] = [
  { value: "espaco", label: "Espaço físico", emoji: "🏢" },
  { value: "material", label: "Materiais", emoji: "📦" },
  { value: "equipe", label: "Equipe", emoji: "👥" },
  { value: "atividade", label: "Atividade", emoji: "🏃" },
];

interface FotoUploadProps {
  supervisaoId: string;
  fotosExistentes?: SupervisaoFotoApi[];
  onUpdate?: (fotos: SupervisaoFotoApi[]) => void;
}

export function SupervisaoFotoUpload({ supervisaoId, fotosExistentes = [], onUpdate }: FotoUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria>("espaco");
  const [fotos, setFotos] = useState<SupervisaoFotoApi[]>(fotosExistentes);
  const [uploading, setUploading] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Limite: 5MB.");
      return;
    }
    setUploading(true);
    try {
      const nova = await supervisoesFotosApi.upload(supervisaoId, file, categoriaSelecionada);
      const atualizadas = [...fotos, nova];
      setFotos(atualizadas);
      onUpdate?.(atualizadas);
      toast.success("Foto enviada.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar foto.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover esta foto?")) return;
    setRemovendo(id);
    try {
      await supervisoesFotosApi.remove(id);
      const atualizadas = fotos.filter((f) => f.id !== id);
      setFotos(atualizadas);
      onUpdate?.(atualizadas);
      toast.success("Foto removida.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover.");
    } finally {
      setRemovendo(null);
    }
  }

  // Agrupar por categoria
  const porCategoria = CATEGORIAS.map((cat) => ({
    ...cat,
    fotos: fotos.filter((f) => f.categoria === cat.value),
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Seletor de categoria + upload */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-700">Categoria</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategoriaSelecionada(cat.value)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                categoriaSelecionada === cat.value
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 py-4 text-sm font-medium text-zinc-500 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 transition-all cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
          ) : (
            <><Camera className="h-4 w-4" /> Adicionar foto</>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Galeria agrupada */}
      {porCategoria.map((cat) => cat.fotos.length > 0 && (
        <div key={cat.value}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {cat.emoji} {cat.label} ({cat.fotos.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {cat.fotos.map((foto) => (
              <div key={foto.id} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                <img
                  src={foto.url}
                  alt={foto.legenda ?? cat.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => remover(foto.id)}
                  disabled={removendo === foto.id}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                >
                  {removendo === foto.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {fotos.length === 0 && (
        <p className="text-center text-xs text-zinc-400 py-4">Nenhuma foto adicionada ainda.</p>
      )}
    </div>
  );
}
