"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select, Switch } from "@/components/ui";
import { nucleos } from "@/lib/mock/nucleos";
import { atividades } from "@/lib/mock/atividades";
import { GradeSemanal } from "./GradeSemanal";
import type { Turma } from "@/lib/types";

interface TurmaFormProps {
  turma?: Turma;
  backHref: string;
}

export function TurmaForm({ turma: t, backHref }: TurmaFormProps) {
  const [exclusiva, setExclusiva] = useState(t?.exclusiva ?? false);
  const [atividadeId, setAtividadeId] = useState(t?.atividadeId ?? "");

  const atividadeNome = atividades.find((a) => a.id === atividadeId)?.nome;

  return (
    <form className="flex flex-col gap-6">
      <FormSection title="Dados da Turma">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" defaultValue={t?.nome} placeholder="Ex: Futebol Manhã A" />
          </Field>
          <Field label="Núcleo" required>
            <Select name="nucleoId" defaultValue={t?.nucleoId ?? ""}>
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
            <Input name="responsaveis" defaultValue={t?.responsaveis.join(", ")} placeholder="Nomes separados por vírgula" />
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
            <Input name="duracao" defaultValue={t?.duracao} placeholder="Ex: 12 meses" />
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
