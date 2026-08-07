"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, Shield } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { funcoesApi, type FuncaoApi } from "@/lib/api/services";
import { useToast } from "@/components/providers/ToastProvider";

interface FuncoesManagerProps {
  inicialFuncoes: FuncaoApi[];
}

export function FuncoesManager({ inicialFuncoes }: FuncoesManagerProps) {
  const { toast } = useToast();
  const [funcoes, setFuncoes] = useState<FuncaoApi[]>(inicialFuncoes);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Por favor, informe o nome da função.");
      return;
    }

    setLoading(true);
    try {
      if (editandoId) {
        const atualizada = await funcoesApi.update(editandoId, { nome: nome.trim(), descricao: descricao.trim() || undefined });
        setFuncoes((prev) => prev.map((f) => (f.id === editandoId ? atualizada : f)));
        toast.success("Função atualizada com sucesso!");
      } else {
        const nova = await funcoesApi.create({ nome: nome.trim(), descricao: descricao.trim() || undefined });
        setFuncoes((prev) => [...prev, nova]);
        toast.success("Nova função cadastrada!");
      }
      limparForm();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar função.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(f: FuncaoApi) {
    setEditandoId(f.id);
    setNome(f.nome);
    setDescricao(f.descricao || "");
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover esta função?")) return;
    try {
      await funcoesApi.delete(id);
      setFuncoes((prev) => prev.filter((f) => f.id !== id));
      toast.success("Função removida.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover função.");
    }
  }

  function limparForm() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Formulário de Cadastro / Edição */}
      <Card className="p-5 lg:col-span-1 h-fit">
        <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
          {editandoId ? "Editar Função" : "Cadastrar Nova Função"}
        </h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field label="Nome da Função" required>
            <Input
              placeholder="Ex: Coordenador Pedagógico"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              placeholder="Descreva as responsabilidades desta função..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </Field>
          <div className="flex gap-2 justify-end pt-2">
            {editandoId && (
              <Button type="button" variant="outline" onClick={limparForm}>
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {editandoId ? "Salvar Alterações" : "Adicionar Função"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista de Funções */}
      <Card className="p-5 lg:col-span-2">
        <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center justify-between">
          <span>Funções Cadastradas</span>
          <span className="text-xs text-zinc-500 font-normal">{funcoes.length} funções</span>
        </h3>
        {funcoes.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            Nenhuma função cadastrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {funcoes.map((f) => (
              <div key={f.id} className="py-3.5 flex items-start justify-between gap-4 hover:bg-zinc-50/60 p-2 rounded-xl transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-sm">{f.nome}</h4>
                    {f.descricao ? (
                      <p className="text-xs text-zinc-500 mt-0.5">{f.descricao}</p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic mt-0.5">Sem descrição</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(f)}
                    className="p-1.5 text-zinc-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
