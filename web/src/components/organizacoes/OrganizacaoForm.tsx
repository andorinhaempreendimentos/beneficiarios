"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select } from "@/components/ui";
import type { TipoOrganizacao } from "@/lib/types";
import { organizacoesApi, type OrganizacaoApi, type ObjetoApi } from "@/lib/api/services";
import { validarCnpj, validarCep, validarEmail } from "@/lib/mascaras";

interface OrganizacaoFormProps {
  organizacao?: OrganizacaoApi;
  objetos?: ObjetoApi[];
  backHref: string;
}

const TIPOS: TipoOrganizacao[] = ["Instituto", "ONG", "Associação", "Fundação", "Outro"];

export function OrganizacaoForm({ organizacao: o, objetos = [], backHref }: OrganizacaoFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [objetoId, setObjetoId] = useState(o?.objetoId ?? (objetos[0]?.id || ""));

  const [cep, setCep] = useState(o?.cep ?? "");
  const [endereco, setEndereco] = useState(o?.endereco ?? "");
  const [cidade, setCidade] = useState(o?.cidade ?? "");
  const [estado, setEstado] = useState(o?.estado ?? "");

  async function handleCepBlur() {
    if (!cep) return;
    const { buscarEnderecoPorCep } = await import("@/lib/cep");
    const res = await buscarEnderecoPorCep(cep);
    if (res) {
      if (res.logradouro) setEndereco(res.logradouro);
      if (res.localidade) setCidade(res.localidade);
      if (res.uf) setEstado(res.uf);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const cnpj = (formData.get("cnpj") as string) || "";
    const email = (formData.get("email") as string) || "";
    const cepVal = cep || "";

    if (cnpj && !validarCnpj(cnpj)) {
      setErro("CNPJ inválido. Por favor, verifique o número digitado.");
      setLoading(false);
      return;
    }

    if (email && !validarEmail(email)) {
      setErro("Formato de e-mail inválido. Exemplo correto: contato@empresa.com");
      setLoading(false);
      return;
    }

    if (cepVal && !validarCep(cepVal)) {
      setErro("CEP inválido. Deve conter exatamente 8 dígitos.");
      setLoading(false);
      return;
    }

    const objId = (formData.get("objetoId") as string) || objetoId;

    if (!objId) {
      setErro("Por favor, selecione um objeto vinculado.");
      setLoading(false);
      return;
    }

    const data = {
      nome: formData.get("nome") as string,
      tipo: formData.get("tipo") as string,
      cnpj: cnpj || null,
      nomeResponsavel: (formData.get("nomeResponsavel") as string) || null,
      telefone: (formData.get("telefone") as string) || null,
      email: email || null,
      objetoId: objId,
      cep: cepVal || null,
      endereco: (formData.get("endereco") as string) || null,
      cidade: (formData.get("cidade") as string) || null,
      estado: (formData.get("estado") as string) || null,
      status: (formData.get("status") as string) || "ativa",
    };

    try {
      if (o?.id) {
        await organizacoesApi.update(o.id, data);
      } else {
        await organizacoesApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar organização.");
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
            <Input name="cnpj" mask="cnpj" defaultValue={o?.cnpj} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Nome do responsável">
            <Input name="nomeResponsavel" defaultValue={o?.nomeResponsavel} placeholder="Nome completo" />
          </Field>
          <Field label="Telefone">
            <Input name="telefone" mask="telefone" defaultValue={o?.telefone} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={o?.email} placeholder="contato@org.com.br" />
          </Field>
          <Field label="Objeto vinculado" required>
            <Select name="objetoId" value={objetoId} onChange={(e) => setObjetoId(e.target.value)}>
              <option value="" disabled>Selecione um objeto</option>
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
            <Input
              name="cep"
              mask="cep"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
              placeholder="00000-000"
            />
          </Field>
          <Field label="Endereço">
            <Input
              name="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, Av., número"
            />
          </Field>
          <Field label="Cidade">
            <Input
              name="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Cidade"
            />
          </Field>
          <Field label="Estado">
            <Input
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              placeholder="UF"
            />
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
