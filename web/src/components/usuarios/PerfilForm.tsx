"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton } from "@/components/ui";
import { z } from "zod";
import type { ModuloSistema, AcaoPermissao } from "@/lib/types";
import { perfisApi, type PerfilApi } from "@/lib/api/services";

const perfilSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

type FieldErrors = Partial<Record<string, string>>;

const MODULOS: { key: ModuloSistema; label: string }[] = [
  { key: "objetos",       label: "Objetos" },
  { key: "organizacoes",  label: "Organizações" },
  { key: "nucleos",       label: "Núcleos" },
  { key: "turmas",        label: "Turmas" },
  { key: "inscricoes",    label: "Inscrições" },
  { key: "atividades",    label: "Atividades" },
  { key: "beneficiarios", label: "Beneficiários" },
  { key: "funcionarios",  label: "Pessoal" },
  { key: "equipamentos",  label: "Equipamentos" },
  { key: "relatorios",    label: "Relatórios" },
  { key: "configuracoes", label: "Configurações" },
  { key: "usuarios",      label: "Usuários" },
];

const ACOES: AcaoPermissao[] = ["visualizar", "criar", "editar", "excluir"];
const ACAO_LABEL: Record<AcaoPermissao, string> = {
  visualizar: "Ver",
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
};

type PermMap = Record<ModuloSistema, Set<AcaoPermissao>>;

function buildPermMap(perfil?: PerfilApi): PermMap {
  const map = {} as PermMap;
  for (const m of MODULOS) {
    const found = perfil?.permissoes.find((p) => p.modulo === m.key);
    map[m.key] = new Set((found?.acoes as AcaoPermissao[]) ?? []);
  }
  return map;
}

interface PerfilFormProps {
  perfil?: PerfilApi;
  backHref: string;
}

export function PerfilForm({ perfil: p, backHref }: PerfilFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [perms, setPerms] = useState<PermMap>(() => buildPermMap(p));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const permissoes = Object.entries(perms).map(([modulo, acoesSet]) => ({
      modulo,
      acoes: Array.from(acoesSet),
    }));

    const data = {
      nome: formData.get("nome") as string,
      descricao: (formData.get("descricao") as string) || undefined,
      permissoes,
    };

    const parsed = perfilSchema.safeParse({
      nome: data.nome,
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
      if (p?.id) {
        await perfisApi.update(p.id, data);
      } else {
        await perfisApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(modulo: ModuloSistema, acao: AcaoPermissao) {
    setPerms((prev) => {
      const next = { ...prev, [modulo]: new Set(prev[modulo]) };
      if (next[modulo].has(acao)) {
        next[modulo].delete(acao);
        // se remover visualizar, remover todas
        if (acao === "visualizar") next[modulo].clear();
      } else {
        next[modulo].add(acao);
        // se adicionar qualquer ação, garantir visualizar
        if (acao !== "visualizar") next[modulo].add("visualizar");
      }
      return next;
    });
  }

  function toggleLinha(modulo: ModuloSistema, tudo: boolean) {
    setPerms((prev) => ({
      ...prev,
      [modulo]: tudo ? new Set<AcaoPermissao>(ACOES) : new Set<AcaoPermissao>(),
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}
      <FormSection title="Dados do Perfil">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do perfil" required error={fieldErrors.nome}>
            <Input name="nome" defaultValue={p?.nome} placeholder="Ex: Coordenador" />
          </Field>
          <Field label="Descrição">
            <Input name="descricao" defaultValue={p?.descricao} placeholder="Breve descrição das permissões" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Matriz de Permissões">
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 w-48">Módulo</th>
                {ACOES.map((a) => (
                  <th key={a} className="px-4 py-3 text-center">{ACAO_LABEL[a]}</th>
                ))}
                <th className="px-4 py-3 text-center">Todos</th>
              </tr>
            </thead>
            <tbody>
              {MODULOS.map(({ key, label }, idx) => {
                const set = perms[key];
                const todos = ACOES.every((a) => set.has(a));
                return (
                  <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                    <td className="px-4 py-3 font-medium text-zinc-700">{label}</td>
                    {ACOES.map((acao) => (
                      <td key={acao} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={set.has(acao)}
                          onChange={() => toggle(key, acao)}
                          className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-sky-600"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={todos}
                        onChange={(e) => toggleLinha(key, e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-sky-600"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Marcar qualquer ação garante automaticamente "Ver". Desmarcar "Ver" remove todas as permissões do módulo.</p>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">Voltar</LinkButton>
        <Button type="submit">{p ? "Salvar" : "Criar Perfil"}</Button>
      </div>
    </form>
  );
}
