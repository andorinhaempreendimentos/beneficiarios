"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select } from "@/components/ui";
import type { TipoDuracao } from "@/lib/types";
import { objetosApi, type ObjetoApi } from "@/lib/api/services";

interface ObjetoFormProps {
  objeto?: ObjetoApi;
  backHref: string;
}

export function ObjetoForm({ objeto: o, backHref }: ObjetoFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoDuracao, setTipoDuracao] = useState<TipoDuracao>((o?.tipoDuracao as TipoDuracao) ?? "periodo");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      termoDeFomento: (formData.get("termoDeFomento") as string) || null,
      codigoObjeto: (formData.get("codigoObjeto") as string) || null,
      codigoPrograma: (formData.get("codigoPrograma") as string) || null,
      nomePrograma: (formData.get("nomePrograma") as string) || null,
      descricao: (formData.get("descricao") as string) || null,
      tipoDuracao,
      dataEvento: tipoDuracao === "pontual" ? ((formData.get("dataEvento") as string) || null) : null,
      dataInicio: tipoDuracao === "periodo" ? ((formData.get("dataInicio") as string) || null) : null,
      dataTermino: tipoDuracao === "periodo" ? ((formData.get("dataTermino") as string) || null) : null,
      status: (formData.get("status") as string) || "ativo",
    };

    try {
      if (o?.id) {
        await objetosApi.update(o.id, data);
      } else {
        await objetosApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar objeto.");
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
      <FormSection title="Dados do Objeto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do Projeto" required>
            <Input name="nome" defaultValue={o?.nome} placeholder="Ex: Esporte na Comunidade" />
          </Field>
          <Field label="Termo de Fomento">
            <Input name="termoDeFomento" defaultValue={o?.termoDeFomento} placeholder="Ex: TF-2024/001" />
          </Field>
          <Field label="Código do Objeto">
            <Input name="codigoObjeto" defaultValue={o?.codigoObjeto} placeholder="Ex: OBJ-001" />
          </Field>
          <Field label="Código do Programa">
            <Input name="codigoPrograma" defaultValue={o?.codigoPrograma} placeholder="Ex: PRG-010" />
          </Field>
          <Field label="Nome do Programa">
            <Input name="nomePrograma" defaultValue={o?.nomePrograma} placeholder="Ex: Esporte para Todos" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Descrição">
            <textarea
              name="descricao"
              defaultValue={o?.descricao}
              rows={3}
              placeholder="Detalhes sobre o projeto ou evento"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Duração do Objeto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de duração" required>
            <Select
              name="tipoDuracao"
              value={tipoDuracao}
              onChange={(e) => setTipoDuracao(e.target.value as TipoDuracao)}
            >
              <option value="periodo">Evento de Período</option>
              <option value="pontual">Evento Pontual</option>
            </Select>
          </Field>
        </div>

        {tipoDuracao === "pontual" && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data do Evento" required>
              <Input type="date" name="dataEvento" defaultValue={o?.dataEvento} />
            </Field>
          </div>
        )}

        {tipoDuracao === "periodo" && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data de Início" required>
              <Input type="date" name="dataInicio" defaultValue={o?.dataInicio} />
            </Field>
            <Field label="Data de Término" required>
              <Input type="date" name="dataTermino" defaultValue={o?.dataTermino} />
            </Field>
          </div>
        )}
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit">{o ? "Salvar" : "Cadastrar Objeto"}</Button>
      </div>
    </form>
  );
}
