"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Select, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  termosEntregaApi,
  nucleosApi,
  funcionariosApi,
  type Paginated,
  type NucleoApi,
  type FuncionarioApi,
} from "@/lib/api/services";

export default function NovoTermoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    recebedorTipo: "funcionario",
    recebedorId: "",
    entregadorId: "",
    dataDevolucaoPrev: "",
    observacoes: "",
  });

  const { data: funcData } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ limit: 200 }), []);
  const funcionarios = funcData?.data ?? [];

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recebedorId || !form.entregadorId) {
      toast.error("Recebedor e entregador são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      const criado = await termosEntregaApi.create({
        movimentacaoId: "", // sem vínculo direto neste fluxo
        recebedorTipo: form.recebedorTipo,
        recebedorId: form.recebedorId,
        entregadorId: form.entregadorId,
        dataDevolucaoPrev: form.dataDevolucaoPrev || null,
        observacoes: form.observacoes.trim() || null,
      });
      toast.success("Termo criado.");
      router.push("/estoque/termos");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar termo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Novo Termo de Entrega"
        description="Registrar entrega de material a funcionário ou beneficiário"
        actions={<LinkButton href="/estoque/termos" variant="secondary">Voltar</LinkButton>}
      />
      <Card>
        <form onSubmit={salvar} className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Tipo de recebedor">
              <Select value={form.recebedorTipo} onChange={(e) => set("recebedorTipo", e.target.value)}>
                <option value="funcionario">Funcionário</option>
                <option value="beneficiario">Beneficiário</option>
              </Select>
            </Field>
            <Field label="Recebedor" required>
              <Select value={form.recebedorId} onChange={(e) => set("recebedorId", e.target.value)} required>
                <option value="">Selecione…</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nomeCompleto}</option>
                ))}
              </Select>
            </Field>
            <Field label="Entregador (responsável)" required>
              <Select value={form.entregadorId} onChange={(e) => set("entregadorId", e.target.value)} required>
                <option value="">Selecione…</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nomeCompleto}</option>
                ))}
              </Select>
            </Field>
            <Field label="Data prevista de devolução">
              <input
                type="date"
                value={form.dataDevolucaoPrev}
                onChange={(e) => set("dataDevolucaoPrev", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </Field>
          </div>
          <Field label="Observações">
            <textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={3}
              placeholder="Observações adicionais…"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </Field>
          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button type="submit" disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 cursor-pointer transition-colors">
              {salvando ? "Salvando…" : "Criar termo"}
            </button>
            <button type="button" onClick={() => router.push("/estoque/termos")}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
