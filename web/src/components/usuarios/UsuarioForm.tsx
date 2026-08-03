"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select } from "@/components/ui";
import { perfis } from "@/lib/mock/usuarios";
import type { Usuario } from "@/lib/types";

interface UsuarioFormProps {
  usuario?: Usuario;
  backHref: string;
}

export function UsuarioForm({ usuario: u, backHref }: UsuarioFormProps) {
  const [status, setStatus] = useState(u?.status ?? "ativo");

  return (
    <form className="flex flex-col gap-6">
      <FormSection title="Dados do Usuário">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required>
            <Input name="nome" defaultValue={u?.nome} placeholder="Ex: Ana Beatriz Lima" />
          </Field>
          <Field label="E-mail" required>
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
          <Field label="Perfil de acesso" required>
            <Select name="perfilId" defaultValue={u?.perfilId ?? ""}>
              <option value="" disabled>Selecione</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </Select>
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
