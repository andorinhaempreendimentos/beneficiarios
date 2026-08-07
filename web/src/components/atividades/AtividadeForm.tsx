"use client";

import { useState } from "react";
import { HelpCircle, Plus, Trash2, Globe, Lock } from "lucide-react";
import { Button, Field, FormSection, Input, LinkButton, Switch } from "@/components/ui";
import type { PerguntaAtividade, Turno } from "@/lib/types";
import { atividadesApi, type AtividadeApi } from "@/lib/api/services";
import { useToast } from "@/components/providers/ToastProvider";

interface AtividadeFormProps {
  atividade?: AtividadeApi;
  backHref: string;
}

export function AtividadeForm({ atividade: a, backHref }: AtividadeFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [disponivelPreInscricao, setDisponivelPreInscricao] = useState(a?.disponivelPreInscricao ?? false);
  const [turnos, setTurnos] = useState<Set<Turno>>(new Set((a?.turnos ?? []) as Turno[]));
  const [perguntas, setPerguntas] = useState<PerguntaAtividade[]>(a?.perguntas ?? []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;

    if (!nome || !nome.trim()) {
      setErro("O nome da atividade é obrigatório.");
      toast.error("O nome da atividade é obrigatório.");
      setLoading(false);
      return;
    }

    const data = {
      nome: nome.trim(),
      disponivelPreInscricao,
      turnos: Array.from(turnos),
      perguntas,
    };

    try {
      if (a?.id) {
        await atividadesApi.update(a.id, data);
        toast.success("Atividade atualizada com sucesso!");
      } else {
        await atividadesApi.create(data);
        toast.success("Atividade cadastrada com sucesso!");
      }
      window.location.href = backHref;
    } catch (err: any) {
      const msg = err.message || "Erro ao salvar atividade.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleTurno(turno: Turno, ativo: boolean) {
    setTurnos((prev) => {
      const next = new Set(prev);
      if (ativo) next.add(turno);
      else next.delete(turno);
      return next;
    });
  }

  function adicionarPergunta() {
    setPerguntas((prev) => [
      ...prev,
      { id: `nova-${prev.length}`, pergunta: "", disponivelInscricao: true },
    ]);
  }

  function removerPergunta(index: number) {
    setPerguntas((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarPergunta(index: number, campo: keyof PerguntaAtividade, valor: string | boolean) {
    setPerguntas((prev) => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {erro}
        </div>
      )}

      <FormSection title="Dados da Atividade">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome da atividade" required>
            <Input name="nome" defaultValue={a?.nome} placeholder="Ex: Futebol, Planejamento Pedagógico, Karatê" required />
          </Field>
        </div>

        {/* SELETOR DE TIPO DE ATIVIDADE COM BOTOES DESTACADOS */}
        <div className="mt-6 flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Finalidade / Visibilidade da Atividade
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opção 1: Controle Interno */}
            <button
              type="button"
              onClick={() => setDisponivelPreInscricao(false)}
              className={`flex items-start gap-3 rounded-2xl p-4 border transition-all text-left ${
                !disponivelPreInscricao
                  ? "bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-500/20"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${!disponivelPreInscricao ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className={`text-sm font-bold block ${!disponivelPreInscricao ? "text-amber-900" : "text-zinc-700"}`}>
                  🔒 Controle Interno
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 block">
                  Ex: Planejamento, Reuniões de Equipe, Manutenção. Disponível para montar a grade de turmas, mas oculta da inscrição pública.
                </span>
              </div>
            </button>

            {/* Opção 2: Inscrição Pública */}
            <button
              type="button"
              onClick={() => setDisponivelPreInscricao(true)}
              className={`flex items-start gap-3 rounded-2xl p-4 border transition-all text-left ${
                disponivelPreInscricao
                  ? "bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/20"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${disponivelPreInscricao ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <span className={`text-sm font-bold block ${disponivelPreInscricao ? "text-sky-900" : "text-zinc-700"}`}>
                  🌐 Inscrição Pública de Alunos
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 block">
                  Disponível para os beneficiários realizarem pré-inscrição online pelo portal.
                </span>
              </div>
            </button>
          </div>
        </div>

        {disponivelPreInscricao && (
          <div className="mt-4 flex flex-wrap gap-6 rounded-2xl bg-zinc-50 p-4 border border-zinc-200">
            <Switch checked={turnos.has("manha")} onChange={(v) => toggleTurno("manha", v)} label="Manhã" />
            <Switch checked={turnos.has("tarde")} onChange={(v) => toggleTurno("tarde", v)} label="Tarde" />
            <Switch checked={turnos.has("noite")} onChange={(v) => toggleTurno("noite", v)} label="Noite" />
          </div>
        )}
      </FormSection>

      <FormSection title="Perguntas Personalizadas">
        <div className="flex flex-col gap-4">
          {perguntas.map((p, index) => (
            <div key={p.id} className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-[1fr_auto_auto]">
              <Field label="Pergunta">
                <div className="relative">
                  <Input
                    value={p.pergunta}
                    onChange={(e) => atualizarPergunta(index, "pergunta", e.target.value)}
                    className="pr-9"
                  />
                  <HelpCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>
              </Field>
              <div className="flex items-end">
                <Switch
                  checked={p.disponivelInscricao}
                  onChange={(v) => atualizarPergunta(index, "disponivelInscricao", v)}
                  label="Disponível na inscrição?"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="danger" size="sm" onClick={() => removerPergunta(index)}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={adicionarPergunta}>
            <Plus className="h-4 w-4" /> Adicionar pergunta
          </Button>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit" loading={loading}>
          {loading ? "Salvando..." : "Salvar Atividade"}
        </Button>
      </div>
    </form>
  );
}
