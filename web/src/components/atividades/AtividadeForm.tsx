"use client";

import { useState } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button, Field, FormSection, Input, LinkButton, Switch } from "@/components/ui";
import type { Atividade, PerguntaAtividade, Turno } from "@/lib/types";

interface AtividadeFormProps {
  atividade?: Atividade;
  backHref: string;
}

export function AtividadeForm({ atividade: a, backHref }: AtividadeFormProps) {
  const [disponivelPreInscricao, setDisponivelPreInscricao] = useState(a?.disponivelPreInscricao ?? false);
  const [turnos, setTurnos] = useState<Set<Turno>>(new Set(a?.turnos ?? []));
  const [perguntas, setPerguntas] = useState<PerguntaAtividade[]>(a?.perguntas ?? []);

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
    <form className="flex flex-col gap-6">
      <FormSection title="Dados da Atividade">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" defaultValue={a?.nome} placeholder="Ex: Funcional, Futebol, Karatê" />
          </Field>
        </div>

        <div className="mt-4">
          <Switch
            checked={disponivelPreInscricao}
            onChange={setDisponivelPreInscricao}
            label="Disponível no formulário de inscrição?"
          />
        </div>

        {disponivelPreInscricao && (
          <div className="mt-4 flex flex-wrap gap-6 rounded-lg bg-zinc-50 p-4">
            <Switch checked={turnos.has("manha")} onChange={(v) => toggleTurno("manha", v)} label="Manhã" />
            <Switch checked={turnos.has("tarde")} onChange={(v) => toggleTurno("tarde", v)} label="Tarde" />
            <Switch checked={turnos.has("noite")} onChange={(v) => toggleTurno("noite", v)} label="Noite" />
          </div>
        )}
      </FormSection>

      <FormSection title="Perguntas Personalizadas">
        <div className="flex flex-col gap-4">
          {perguntas.map((p, index) => (
            <div key={p.id} className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto_auto]">
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
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
