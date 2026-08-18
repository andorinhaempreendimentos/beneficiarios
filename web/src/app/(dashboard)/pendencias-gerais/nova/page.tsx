"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Input, Select, Textarea, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { pendenciasGeraisApi, nucleosApi, funcionariosApi, type Paginated, type NucleoApi, type FuncionarioApi } from "@/lib/api/services";

export default function NovaPendenciaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nucleoId: "", tipo: "", titulo: "", descricao: "",
    gravidade: "media", responsavelId: "", prazo: "",
  });

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const { data: funcData } = useQuery<Paginated<FuncionarioApi>>(() => funcionariosApi.list({ limit: 200 }), []);
  const nucleos = nucleosData?.data ?? [];
  const funcionarios = funcData?.data ?? [];

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nucleoId || !form.tipo || !form.titulo || !form.descricao) {
      toast.error("Núcleo, tipo, título e descrição são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      const criada = await pendenciasGeraisApi.create({
        nucleoId: form.nucleoId,
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        gravidade: form.gravidade,
        responsavelId: form.responsavelId || null,
        prazo: form.prazo || null,
        createdById: "", // TODO: pegar do contexto de autenticação
      });
      toast.success("Pendência criada.");
      router.push(`/pendencias-gerais/${criada.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Nova Pendência"
        description="Registrar ocorrência ou pendência de núcleo"
        actions={<LinkButton href="/pendencias-gerais" variant="secondary">Voltar</LinkButton>}
      />
      <Card>
        <form onSubmit={salvar} className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Núcleo" required>
              <Select value={form.nucleoId} onChange={(e) => set("nucleoId", e.target.value)} required>
                <option value="">Selecione…</option>
                {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
              </Select>
            </Field>
            <Field label="Tipo" required>
              <Select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} required>
                <option value="">Selecione…</option>
                <option value="estrutura">Estrutura</option>
                <option value="material">Material</option>
                <option value="professor">Professor</option>
                <option value="beneficiario">Beneficiário</option>
                <option value="outro">Outro</option>
              </Select>
            </Field>
            <Field label="Gravidade">
              <Select value={form.gravidade} onChange={(e) => set("gravidade", e.target.value)}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </Select>
            </Field>
            <Field label="Responsável">
              <Select value={form.responsavelId} onChange={(e) => set("responsavelId", e.target.value)}>
                <option value="">Sem responsável</option>
                {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
              </Select>
            </Field>
            <Field label="Prazo">
              <Input type="date" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} />
            </Field>
          </div>
          <Field label="Título" required>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Resumo da pendência" required />
          </Field>
          <Field label="Descrição" required>
            <Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Descreva detalhadamente…" rows={5} required />
          </Field>
          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button type="submit" disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer">
              {salvando ? "Salvando…" : "Criar pendência"}
            </button>
            <button type="button" onClick={() => router.push("/pendencias-gerais")}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
