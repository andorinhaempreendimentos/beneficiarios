"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Card,
  PageHeader,
  Field,
  Input,
  Select,
  Textarea,
  LinkButton,
} from "@/components/ui";
import { materiaisApi, type MaterialApi } from "@/lib/api/services";

const CATEGORIAS = [
  "Esportivo",
  "Vestuário",
  "Papelaria",
  "Limpeza",
  "Informática",
  "Mobiliário",
  "Outros",
];

const UNIDADES = ["un", "par", "kit", "cx", "pct", "rolo", "m", "L", "kg", "g"];

type Props = { material?: MaterialApi };

export function MaterialForm({ material }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const editando = !!material;

  const [form, setForm] = useState({
    nome: material?.nome ?? "",
    descricao: material?.descricao ?? "",
    categoria: material?.categoria ?? "",
    unidadeMedida: material?.unidadeMedida ?? "un",
    estoqueMinimo: material?.estoqueMinimo?.toString() ?? "0",
    ativo: material?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);

  function set(campo: string, valor: unknown) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.categoria) {
      toast.error("Nome e categoria são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      const body = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        categoria: form.categoria,
        unidadeMedida: form.unidadeMedida,
        estoqueMinimo: parseInt(form.estoqueMinimo, 10) || 0,
        ativo: form.ativo,
      };
      if (editando && material) {
        await materiaisApi.update(material.id, body);
        toast.success("Material atualizado.");
      } else {
        await materiaisApi.create(body);
        toast.success("Material cadastrado.");
      }
      router.push("/estoque/materiais");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={editando ? "Editar Material" : "Novo Material"}
        description={editando ? `Editando "${material?.nome}"` : "Cadastro de material consumível"}
        actions={<LinkButton href="/estoque/materiais" variant="secondary">Voltar</LinkButton>}
      />

      <Card>
        <form onSubmit={salvar} className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nome" required>
              <Input
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex: Bola de Futebol"
                required
              />
            </Field>

            <Field label="Categoria" required>
              <Select
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>

            <Field label="Unidade de Medida">
              <Select
                value={form.unidadeMedida}
                onChange={(e) => set("unidadeMedida", e.target.value)}
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </Field>

            <Field label="Estoque Mínimo" hint="Alertas são gerados quando abaixo deste valor">
              <Input
                type="number"
                min={0}
                value={form.estoqueMinimo}
                onChange={(e) => set("estoqueMinimo", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Descrição opcional do material"
              rows={3}
            />
          </Field>

          <Field label="Status">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => set("ativo", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-sm text-zinc-700">Material ativo</span>
            </label>
          </Field>

          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar material"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/estoque/materiais")}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
