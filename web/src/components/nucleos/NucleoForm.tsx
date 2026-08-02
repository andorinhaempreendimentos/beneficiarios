"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button, Field, FormSection, Input, LinkButton, Switch } from "@/components/ui";
import type { Nucleo } from "@/lib/types";

interface NucleoFormProps {
  nucleo?: Nucleo;
  backHref: string;
}

export function NucleoForm({ nucleo: n, backHref }: NucleoFormProps) {
  const [emFuncionamento, setEmFuncionamento] = useState(n?.emFuncionamento ?? true);
  const [disponivelPreInscricao, setDisponivelPreInscricao] = useState(n?.disponivelPreInscricao ?? true);

  return (
    <form className="flex flex-col gap-6">
      <FormSection title="Identificação">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Identificação" required>
            <Input name="identificacao" defaultValue={n?.identificacao} placeholder="Ex: Núcleo Vila Esperança" />
          </Field>
          <Field label="Nome do local">
            <Input name="nomeLocal" defaultValue={n?.nomeLocal} placeholder="Ex: Escola Municipal..." />
          </Field>
          <Field label="Região">
            <Input name="regiao" defaultValue={n?.regiao} />
          </Field>
          <Field label="Nome do responsável">
            <Input name="nomeResponsavel" defaultValue={n?.nomeResponsavel} />
          </Field>
          <Field label="Telefone de contato">
            <Input name="telefoneContato" defaultValue={n?.telefoneContato} placeholder="(00) 00000-0000" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Endereço">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CEP">
            <Input name="cep" defaultValue={n?.cep} placeholder="00000-000" />
          </Field>
          <Field label="Endereço" className="lg:col-span-2">
            <Input name="endereco" defaultValue={n?.endereco} />
          </Field>
          <Field label="Número">
            <Input name="numero" defaultValue={n?.numero} />
          </Field>
          <Field label="Bairro">
            <Input name="bairro" defaultValue={n?.bairro} />
          </Field>
          <Field label="Cidade">
            <Input name="cidade" defaultValue={n?.cidade} />
          </Field>
          <Field label="Complemento" className="lg:col-span-3">
            <Input name="complemento" defaultValue={n?.complemento} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Localização no mapa">
            <div className="flex h-48 items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Mapa interativo (Google Maps API)</span>
            </div>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Funcionamento">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data de início" required>
            <Input type="date" name="dataInicio" defaultValue={n?.dataInicio} />
          </Field>
          <Field label="Data de fechamento">
            <Input type="date" name="dataFechamento" defaultValue={n?.dataFechamento} />
          </Field>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Switch checked={emFuncionamento} onChange={setEmFuncionamento} label="Em funcionamento?" />
          <Switch
            checked={disponivelPreInscricao}
            onChange={setDisponivelPreInscricao}
            label="Disponível na pré inscrição"
          />
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
