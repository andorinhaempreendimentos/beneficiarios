"use client";

import { useState } from "react";
import { Button, Field, FileUpload, FormSection, Input, LinkButton, Select } from "@/components/ui";
import type { CategoriaEquipamento, ConservacaoEquipamento } from "@/lib/types";
import { z } from "zod";
import { equipamentosApi, type EquipamentoApi, type NucleoApi, type ObjetoApi } from "@/lib/api/services";

const equipamentoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
});

type FieldErrors = Partial<Record<string, string>>;

interface EquipamentoFormProps {
  equipamento?: EquipamentoApi;
  nucleos?: NucleoApi[];
  objetos?: ObjetoApi[];
  backHref: string;
}

const CATEGORIAS: CategoriaEquipamento[] = ["Esportivo", "Escritório", "Informática", "Mobiliário", "Vestuário", "Outros"];
const CONSERVACOES: { value: ConservacaoEquipamento; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "bom", label: "Bom" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "inservivel", label: "Inservível" },
];

export function EquipamentoForm({ equipamento: e, nucleos = [], objetos = [], backHref }: EquipamentoFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      categoria: formData.get("categoria") as string,
      quantidade: Number(formData.get("quantidade") || 1),
      conservacao: formData.get("conservacao") as string,
      valorUnitario: formData.get("valorUnitario") ? Number(formData.get("valorUnitario")) : null,
      dataAquisicao: (formData.get("dataAquisicao") as string) || null,
      nucleoId: (formData.get("nucleoId") as string) || null,
      objetoId: (formData.get("objetoId") as string) || null,
      notaFiscal: (formData.get("notaFiscal") as string) || null,
    };

    const parsed = equipamentoSchema.safeParse({
      nome: data.nome,
      categoria: data.categoria,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      if (e?.id) {
        await equipamentosApi.update(e.id, data);
      } else {
        await equipamentosApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar equipamento.");
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
      <FormSection title="Dados do Equipamento">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required error={fieldErrors.nome}>
            <Input name="nome" defaultValue={e?.nome} placeholder="Ex: Bola de Futebol Oficial" />
          </Field>
          <Field label="Categoria" required error={fieldErrors.categoria}>
            <Select name="categoria" defaultValue={e?.categoria ?? ""}>
              <option value="" disabled>Selecione</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade" required>
            <Input name="quantidade" type="number" defaultValue={e?.quantidade?.toString()} placeholder="1" />
          </Field>
          <Field label="Estado de conservação" required>
            <Select name="conservacao" defaultValue={e?.conservacao ?? ""}>
              <option value="" disabled>Selecione</option>
              {CONSERVACOES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Valor unitário (R$)">
            <Input name="valorUnitario" type="number" step="0.01" defaultValue={e?.valorUnitario?.toString()} placeholder="0,00" />
          </Field>
          <Field label="Data de aquisição">
            <Input name="dataAquisicao" type="date" defaultValue={e?.dataAquisicao} />
          </Field>
          <Field label="Núcleo">
            <Select name="nucleoId" defaultValue={e?.nucleoId ?? ""}>
              <option value="">Nenhum</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
          <Field label="Objeto vinculado">
            <Select name="objetoId" defaultValue={e?.objetoId ?? ""}>
              <option value="">Nenhum</option>
              {objetos.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Observação">
            <textarea
              name="observacao"
              defaultValue={e?.observacao}
              rows={2}
              placeholder="Observações sobre o equipamento"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Documentos">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nota Fiscal">
            <Input name="notaFiscal" defaultValue={e?.notaFiscal} placeholder="Número da NF" />
          </Field>
          <Field label="Foto do equipamento">
            <FileUpload label="Clique para enviar a foto" />
          </Field>
          <Field label="Arquivo da nota fiscal">
            <FileUpload label="Clique para enviar a NF" />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit">{e ? "Salvar" : "Cadastrar Equipamento"}</Button>
      </div>
    </form>
  );
}
