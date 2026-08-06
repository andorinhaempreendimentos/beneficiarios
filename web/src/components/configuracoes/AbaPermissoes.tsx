"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader } from "@/components/ui";
import { perfisApi, usuariosApi, type PerfilApi, type UsuarioApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";

type ModuloPermissao = string;
type AcaoPermissao = "visualizar" | "criar" | "editar" | "excluir";

const MODULOS: { id: ModuloPermissao; label: string }[] = [
  { id: "objetos", label: "Objetos" },
  { id: "organizacoes", label: "Organizações" },
  { id: "nucleos", label: "Núcleos" },
  { id: "turmas", label: "Turmas" },
  { id: "atividades", label: "Atividades" },
  { id: "beneficiarios", label: "Beneficiários" },
  { id: "funcionarios", label: "Pessoal" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "inscricoes", label: "Inscrições" },
  { id: "relatorios", label: "Relatórios" },
  { id: "configuracoes", label: "Configurações" },
];

const ACOES: { id: AcaoPermissao; label: string }[] = [
  { id: "visualizar", label: "Ver" },
  { id: "criar", label: "Criar" },
  { id: "editar", label: "Editar" },
  { id: "excluir", label: "Excluir" },
];

const PERFIL_LABEL: Record<string, string> = {
  admin: "Admin",
  gestor: "Gestor",
  funcionario: "Funcionário",
};

const PERFIL_TONE: Record<string, "green" | "sky" | "amber"> = {
  admin: "green",
  gestor: "sky",
  funcionario: "amber",
};

export function AbaPermissoes() {
  const { data: perfisRes } = useQuery(() => perfisApi.list({ limit: 100 }), []);
  const { data: usuariosRes } = useQuery(() => usuariosApi.list({ limit: 100 }), []);

  const perfis = perfisRes?.data ?? [];
  const usuarios = usuariosRes?.data ?? [];

  const [perfilId, setPerfilId] = useState<string>("");
  const perfil = perfis.find((p) => p.id === perfilId) ?? perfis[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Perfis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Perfis de gestor</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" /> Novo perfil
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-zinc-100">
          {perfis.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPerfilId(p.id)}
              className={`flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm transition-colors hover:bg-zinc-50 ${perfil?.id === p.id ? "bg-sky-50" : ""}`}
            >
              <div>
                <p className={`font-medium ${perfil?.id === p.id ? "text-sky-700" : "text-zinc-800"}`}>{p.nome}</p>
                {p.descricao && <p className="text-xs text-zinc-400">{p.descricao}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {usuarios.filter((u) => u.perfilId === p.id).length} usuário(s)
                </span>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Matriz de permissões */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">
            Permissões — <span className="text-sky-700">{perfil?.nome ?? "Perfil"}</span>
          </h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 w-40">Módulo</th>
                {ACOES.map((a) => (
                  <th key={a.id} className="px-3 py-3 text-center">{a.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULOS.map((m) => (
                <tr key={m.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-700">{m.label}</td>
                  {ACOES.map((a) => {
                    const perm = perfil?.permissoes?.find((p) => p.modulo === m.id);
                    const ativo = (perm?.acoes as string[])?.includes(a.id) ?? false;
                    return (
                      <td key={a.id} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={ativo}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-200 px-5 py-3 flex justify-end">
          <Button size="sm">Salvar permissões</Button>
        </div>
      </Card>

      {/* Usuários com este perfil */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Usuários</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Perfil</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-800">{u.nomeCompleto}</td>
                  <td className="px-5 py-3 text-zinc-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone="sky">{perfis.find((p) => p.id === u.perfilId)?.nome ?? "Perfil"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.ativo ? "green" : "zinc"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <a href={`/usuarios/${u.id}/editar`} className="text-sky-600 hover:underline text-sm">Editar</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
