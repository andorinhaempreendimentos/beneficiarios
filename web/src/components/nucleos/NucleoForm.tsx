"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button, Field, FormSection, Input, LinkButton, Switch } from "@/components/ui";
import { nucleosApi, type NucleoApi, type OrganizacaoApi } from "@/lib/api/services";

interface NucleoFormProps {
  nucleo?: NucleoApi;
  organizacoes?: OrganizacaoApi[];
  backHref: string;
}

export function NucleoForm({ nucleo: n, organizacoes = [], backHref }: NucleoFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [emFuncionamento, setEmFuncionamento] = useState(n?.emFuncionamento ?? true);
  const [disponivelPreInscricao, setDisponivelPreInscricao] = useState(n?.disponivelPreInscricao ?? true);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      identificacao: formData.get("identificacao") as string,
      nomeLocal: (formData.get("nomeLocal") as string) || null,
      regiao: (formData.get("regiao") as string) || null,
      nomeResponsavel: (formData.get("nomeResponsavel") as string) || null,
      telefoneContato: (formData.get("telefoneContato") as string) || null,
      cep: (formData.get("cep") as string) || null,
      endereco: (formData.get("endereco") as string) || null,
      numero: (formData.get("numero") as string) || null,
      bairro: (formData.get("bairro") as string) || null,
      cidade: (formData.get("cidade") as string) || null,
      complemento: (formData.get("complemento") as string) || null,
      emFuncionamento,
      disponivelPreInscricao,
    };

    try {
      if (n?.id) {
        await nucleosApi.update(n.id, data);
      } else {
        await nucleosApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar núcleo.");
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
