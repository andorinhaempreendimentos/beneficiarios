"use client";

import { useState } from "react";
import { Button, Field, FormSection, Input, LinkButton } from "@/components/ui";
import type { Perfil, ModuloSistema, AcaoPermissao } from "@/lib/types";

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

function buildPermMap(perfil?: Perfil): PermMap {
  const map = {} as PermMap;
  for (const m of MODULOS) {
    const found = perfil?.permissoes.find((p) => p.modulo === m.key);
    map[m.key] = new Set(found?.acoes ?? []);
  }
  return map;
}

interface PerfilFormProps {
  perfil?: Perfil;
  backHref: string;
}

export function PerfilForm({ perfil: p, backHref }: PerfilFormProps) {
  const [perms, setPerms] = useState<PermMap>(() => buildPermMap(p));

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
    <form className="flex flex-col gap-6">
      <FormSection title="Dados do Perfil">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do perfil" required>
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
