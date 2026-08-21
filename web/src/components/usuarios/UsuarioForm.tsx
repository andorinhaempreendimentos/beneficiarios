"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select } from "@/components/ui";
import { z } from "zod";
import { usuariosApi, type UsuarioApi, type PerfilApi } from "@/lib/api/services";
import { validarEmail } from "@/lib/mascaras";

const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Endereço de e-mail inválido"),
  perfilId: z.string().min(1, "Perfil é obrigatório"),
});

type FieldErrors = Partial<Record<string, string>>;

interface UsuarioFormProps {
  usuario?: UsuarioApi;
  perfis?: PerfilApi[];
  backHref: string;
}

export function UsuarioForm({ usuario: u, perfis = [], backHref }: UsuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string) || "";

    if (email && !validarEmail(email)) {
      setErro("Endereço de e-mail inválido. Utilize o formato termo1@termo2.termo3.");
      setLoading(false);
      return;
    }

    const data = {
      nomeCompleto: formData.get("nome") as string,
      email,
      perfilId: formData.get("perfilId") as string,
      isProfessor: formData.get("isProfessor") === "on",
      ativo: formData.get("status") !== "inativo",
    };

    const parsed = usuarioSchema.safeParse({
      nome: data.nomeCompleto,
      email: data.email,
      perfilId: data.perfilId,
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
      if (u?.id) {
        await usuariosApi.update(u.id, data);
      } else {
        await usuariosApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar usuário.");
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
      <FormSection title="Dados do Usuário">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required error={fieldErrors.nome}>
            <Input name="nome" defaultValue={u?.nomeCompleto} placeholder="Ex: Ana Beatriz Lima" />
          </Field>
          <Field label="E-mail" required error={fieldErrors.email}>
            <Input name="email" type="email" defaultValue={u?.email} placeholder="usuario@andorinha.org" />
          </Field>
          {!u && (
            <>
              <Field label="Senha" required>
                <Input name="senha" type="password" placeholder="Mínimo 8 caracteres" />
              </Field>
              <Field label="Confirmar senha" required>
                <Input name="confirmarSenha" type="password" placeholder="Repita a senha" />
              </Field>
            </>
          )}
        </div>
      </FormSection>

      <FormSection title="Acesso e Perfil">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Perfil de acesso" required error={fieldErrors.perfilId}>
            <Select name="perfilId" defaultValue={u?.perfilId ?? ""}>
              <option value="" disabled>Selecione</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={u?.ativo ? "ativo" : "inativo"}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </Select>
          </Field>
          <Field label="Identificação de Instrutor">
            <label className="flex items-center gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                name="isProfessor"
                defaultChecked={Boolean(u?.isProfessor)}
                className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm font-medium text-zinc-800">
                Este usuário é um Professor / Instrutor
              </span>

            </label>
          </Field>
        </div>
        {u && (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-700">Redefinir senha</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nova senha">
                <Input name="novaSenha" type="password" placeholder="Deixe em branco para não alterar" />
              </Field>
              <Field label="Confirmar nova senha">
                <Input name="confirmarNovaSenha" type="password" placeholder="Repita a nova senha" />
              </Field>
            </div>
          </div>
        )}
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">Voltar</LinkButton>
        <Button type="submit">{u ? "Salvar" : "Criar Usuário"}</Button>
      </div>
    </form>
  );
}
