"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Input, Select, Textarea, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  movimentacoesEstoqueApi,
  materiaisApi,
  nucleosApi,
  funcionariosApi,
  type Paginated,
  type MaterialApi,
  type NucleoApi,
  type FuncionarioApi,
} from "@/lib/api/services";

const TIPOS = [
  { value: "entrada", label: "Entrada" },
  { value: "saida", label: "Saída" },
  { value: "transferencia", label: "Transferência" },
  { value: "perda", label: "Perda" },
  { value: "dano", label: "Dano" },
];

export default function NovaMovimentacaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    materialId: "",
    nucleoId: "",
    tipo: "entrada",
    quantidade: "",
    responsavelId: "",
    destinoNucleoId: "",
    motivo: "",
    observacoes: "",
  });

  const { data: matData } = useQuery<Paginated<MaterialApi>>(() => materiaisApi.list({ limit: 200, ativo: "true" }), []);
  const { data: nucData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: funcData } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ limit: 200 }), []);

  const materiais = matData?.data ?? [];
  const nucleos = nucData?.data ?? [];
  const funcionarios = funcData?.data ?? [];

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.materialId || !form.nucleoId || !form.quantidade || !form.responsavelId) {
      toast.error("Material, núcleo, quantidade e responsável são obrigatórios.");
      return;
    }
    if (form.tipo === "transferencia" && !form.destinoNucleoId) {
      toast.error("Transferência requer núcleo de destino.");
      return;
    }
    setSalvando(true);
    try {
      await movimentacoesEstoqueApi.create({
        materialId: form.materialId,
        nucleoId: form.nucleoId,
        tipo: form.tipo,
        quantidade: parseInt(form.quantidade, 10),
        responsavelId: form.responsavelId,
        destinoNucleoId: form.destinoNucleoId || null,
        motivo: form.motivo.trim() || null,
        observacoes: form.observacoes.trim() || null,
        dataMovimentacao: new Date().toISOString(),
      });
      toast.success("Movimentação registrada.");
      router.push("/estoque/movimentacoes");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Nova Movimentação"
        description="Registrar entrada, saída ou transferência de material"
        actions={<LinkButton href="/estoque/movimentacoes" variant="secondary">Voltar</LinkButton>}
      />
      <Card>
        <form onSubmit={salvar} className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Material" required>
              <Select value={form.materialId} onChange={(e) => set("materialId", e.target.value)} required>
                <option value="">Selecione…</option>
                {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome} ({m.unidadeMedida})</option>)}
              </Select>
            </Field>
            <Field label="Tipo" required>
              <Select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} required>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Núcleo de origem" required>
              <Select value={form.nucleoId} onChange={(e) => set("nucleoId", e.target.value)} required>
                <option value="">Selecione…</option>
                {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
              </Select>
            </Field>
            {form.tipo === "transferencia" && (
              <Field label="Núcleo de destino" required>
                <Select value={form.destinoNucleoId} onChange={(e) => set("destinoNucleoId", e.target.value)} required>
                  <option value="">Selecione…</option>
                  {nucleos.filter((n) => n.id !== form.nucleoId).map((n) => (
                    <option key={n.id} value={n.id}>{n.identificacao}</option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Quantidade" required>
              <Input
                type="number"
                min={1}
                value={form.quantidade}
                onChange={(e) => set("quantidade", e.target.value)}
                placeholder="0"
                required
              />
            </Field>
            <Field label="Responsável" required>
              <Select value={form.responsavelId} onChange={(e) => set("responsavelId", e.target.value)} required>
                <option value="">Selecione…</option>
                {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Motivo">
            <Input value={form.motivo} onChange={(e) => set("motivo", e.target.value)} placeholder="Motivo da movimentação (opcional)" />
          </Field>
          <Field label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} placeholder="Observações adicionais…" />
          </Field>
          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button type="submit" disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer">
              {salvando ? "Salvando…" : "Registrar movimentação"}
            </button>
            <button type="button" onClick={() => router.push("/estoque/movimentacoes")}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
