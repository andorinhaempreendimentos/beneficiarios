"use client";

import { Button, Field, FormSection, Input, LinkButton, Select } from "@/components/ui";
import { objetos } from "@/lib/mock/objetos";
import type { Organizacao, TipoOrganizacao } from "@/lib/types";

interface OrganizacaoFormProps {
  organizacao?: Organizacao;
  backHref: string;
}

const TIPOS: TipoOrganizacao[] = ["Instituto", "ONG", "Associação", "Fundação", "Outro"];

export function OrganizacaoForm({ organizacao: o, backHref }: OrganizacaoFormProps) {
  return (
    <form className="flex flex-col gap-6">
      <FormSection title="Dados da Organização">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" defaultValue={o?.nome} placeholder="Ex: Instituto Vida Ativa" />
          </Field>
          <Field label="Tipo" required>
            <Select name="tipo" defaultValue={o?.tipo ?? ""}>
              <option value="" disabled>Selecione</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="CNPJ">
            <Input name="cnpj" defaultValue={o?.cnpj} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Nome do responsável">
            <Input name="nomeResponsavel" defaultValue={o?.nomeResponsavel} placeholder="Nome completo" />
          </Field>
          <Field label="Telefone">
            <Input name="telefone" defaultValue={o?.telefone} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={o?.email} placeholder="contato@org.com.br" />
          </Field>
          <Field label="Objeto vinculado">
            <Select name="objetoId" defaultValue={o?.objetoId ?? ""}>
              <option value="">Nenhum</option>
              {objetos.map((ob) => (
                <option key={ob.id} value={ob.id}>{ob.nome}</option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Endereço">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="CEP">
            <Input name="cep" defaultValue={o?.cep} placeholder="00000-000" />
          </Field>
          <Field label="Endereço">
            <Input name="endereco" defaultValue={o?.endereco} placeholder="Rua, Av., número" />
          </Field>
          <Field label="Cidade">
            <Input name="cidade" defaultValue={o?.cidade} placeholder="Cidade" />
          </Field>
          <Field label="Estado">
            <Input name="estado" defaultValue={o?.estado} placeholder="UF" />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit">{o ? "Salvar" : "Cadastrar Organização"}</Button>
      </div>
    </form>
  );
}
