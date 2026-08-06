"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select, Switch } from "@/components/ui";
import { GradeSemanal } from "./GradeSemanal";
import { turmasApi, type TurmaApi, type NucleoApi, type AtividadeApi } from "@/lib/api/services";

interface TurmaFormProps {
  turma?: TurmaApi;
  nucleos?: NucleoApi[];
  atividades?: AtividadeApi[];
  backHref: string;
}

export function TurmaForm({ turma: t, nucleos = [], atividades = [], backHref }: TurmaFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [exclusiva, setExclusiva] = useState(t?.exclusiva ?? false);
  const [nucleoId, setNucleoId] = useState(t?.nucleoId ?? "");
  const [atividadeId, setAtividadeId] = useState(t?.atividadeId ?? "");

  const atividadeNome = atividades.find((a) => a.id === atividadeId)?.nome;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const nId = (formData.get("nucleoId") as string) || nucleoId;
    const aId = (formData.get("atividadeId") as string) || atividadeId;

    if (!nId) {
      setErro("Por favor, selecione um núcleo.");
      setLoading(false);
      return;
    }
    if (!aId) {
      setErro("Por favor, selecione uma atividade.");
      setLoading(false);
      return;
    }

    const data = {
      nome: formData.get("nome") as string,
      nucleoId: nId,
      atividadeId: aId,
      vagasTotais: Number(formData.get("vagasTotais") || 30),
      exclusiva,
      dataInicio: (formData.get("dataInicio") as string) || null,
      dataFim: (formData.get("dataFim") as string) || null,
    };

    try {
      if (t?.id) {
        await turmasApi.update(t.id, data);
      } else {
        await turmasApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar turma.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}
      <FormSection title="Dados da Turma">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" defaultValue={t?.nome} placeholder="Ex: Futebol Manhã A" />
          </Field>
          <Field label="Núcleo" required>
            <Select name="nucleoId" value={nucleoId} onChange={(e) => setNucleoId(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
          <Field label="Atividade" required>
            <Select name="atividadeId" value={atividadeId} onChange={(e) => setAtividadeId(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {atividades.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Responsável(is)">
            <Input name="responsaveis" defaultValue={(t?.responsaveis ?? []).join(", ")} placeholder="Nomes separados por vírgula" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Horários e Vagas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vagas totais" required>
            <Input name="vagasTotais" type="number" defaultValue={t?.vagasTotais?.toString()} placeholder="30" />
          </Field>
          <Field label="Data de início">
            <Input name="dataInicio" type="date" defaultValue={t?.dataInicio} />
          </Field>
          <Field label="Duração">
            <Input name="duracao" placeholder="Ex: 12 meses" />
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-zinc-700">Grade semanal</p>
          {atividadeNome ? (
            <GradeSemanal atividadeNome={atividadeNome} />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
              Selecione uma atividade para montar a grade
            </div>
          )}
        </div>

        <div className="mt-4">
          <Switch checked={exclusiva} onChange={setExclusiva} label="Turma exclusiva (beneficiário não pode acumular outras turmas)" />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit">{t ? "Salvar" : "Cadastrar Turma"}</Button>
      </div>
    </form>
  );
}
