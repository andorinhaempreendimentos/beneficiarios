"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Field, Input, Select } from "@/components/ui";
import {
  movimentacoesEstoqueApi,
  type MaterialApi,
  type NucleoApi,
  type FuncionarioApi,
  type MovimentacaoEstoqueApi,
} from "@/lib/api/services";

const TIPOS = [
  { value: "entrada", label: "Entrada" },
  { value: "saida", label: "Saída" },
  { value: "transferencia", label: "Transferência" },
  { value: "perda", label: "Perda" },
  { value: "dano", label: "Dano" },
];

interface MovimentacaoFormProps {
  /** Se fornecido, pré-seleciona o material */
  materialInicial?: MaterialApi;
  /** Se fornecido, pré-seleciona o núcleo de origem */
  nucleoInicial?: NucleoApi;
  materiais: MaterialApi[];
  nucleos: NucleoApi[];
  funcionarios: FuncionarioApi[];
  onSuccess: (mov: MovimentacaoEstoqueApi) => void;
  onClose: () => void;
}

export function MovimentacaoForm({
  materialInicial,
  nucleoInicial,
  materiais,
  nucleos,
  funcionarios,
  onSuccess,
  onClose,
}: MovimentacaoFormProps) {
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    materialId: materialInicial?.id ?? "",
    nucleoId: nucleoInicial?.id ?? "",
    tipo: "saida",
    quantidade: "",
    responsavelId: "",
    destinoNucleoId: "",
    motivo: "",
  });

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.materialId || !form.nucleoId || !form.quantidade || !form.responsavelId) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.tipo === "transferencia" && !form.destinoNucleoId) {
      toast.error("Informe o núcleo de destino para transferência.");
      return;
    }
    setSalvando(true);
    try {
      const mov = await movimentacoesEstoqueApi.create({
        materialId: form.materialId,
        nucleoId: form.nucleoId,
        tipo: form.tipo,
        quantidade: parseInt(form.quantidade, 10),
        responsavelId: form.responsavelId,
        destinoNucleoId: form.destinoNucleoId || null,
        motivo: form.motivo.trim() || null,
        dataMovimentacao: new Date().toISOString(),
      });
      toast.success("Movimentação registrada.");
      onSuccess(mov);
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar.");
    } finally {
      setSalvando(false);
    }
  }

  const materialSelecionado = materiais.find((m) => m.id === form.materialId);

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-800">Registrar Movimentação</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={salvar} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Material" required>
              <Select value={form.materialId} onChange={(e) => set("materialId", e.target.value)} required disabled={!!materialInicial}>
                <option value="">Selecione…</option>
                {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
            </Field>
            <Field label="Tipo" required>
              <Select value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Núcleo origem" required>
              <Select value={form.nucleoId} onChange={(e) => set("nucleoId", e.target.value)} required disabled={!!nucleoInicial}>
                <option value="">Selecione…</option>
                {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
              </Select>
            </Field>
            {form.tipo === "transferencia" ? (
              <Field label="Núcleo destino" required>
                <Select value={form.destinoNucleoId} onChange={(e) => set("destinoNucleoId", e.target.value)} required>
                  <option value="">Selecione…</option>
                  {nucleos.filter((n) => n.id !== form.nucleoId).map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
                </Select>
              </Field>
            ) : (
              <Field label="Quantidade" required>
                <Input type="number" min={1} value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)} placeholder="0" required />
              </Field>
            )}
            {form.tipo === "transferencia" && (
              <Field label="Quantidade" required>
                <Input type="number" min={1} value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)} placeholder="0" required />
              </Field>
            )}
            <Field label="Responsável" required className="col-span-2">
              <Select value={form.responsavelId} onChange={(e) => set("responsavelId", e.target.value)} required>
                <option value="">Selecione…</option>
                {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
              </Select>
            </Field>
          </div>

          {materialSelecionado && (
            <p className="text-xs text-zinc-400">
              Unidade: <strong>{materialSelecionado.unidadeMedida}</strong>
            </p>
          )}

          <Field label="Motivo">
            <Input value={form.motivo} onChange={(e) => set("motivo", e.target.value)} placeholder="Opcional" />
          </Field>

          {/* Footer */}
          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 cursor-pointer transition-colors">
              {salvando ? "Salvando…" : "Registrar"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
