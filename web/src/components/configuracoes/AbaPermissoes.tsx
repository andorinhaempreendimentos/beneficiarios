"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit3, ShieldCheck, Check, Save } from "lucide-react";
import { Badge, Button, Card, CardHeader, LinkButton } from "@/components/ui";
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
  { id: "funcionarios", label: "Pessoal / RH" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "inscricoes", label: "Inscrições" },
  { id: "relatorios", label: "Relatórios" },
  { id: "configuracoes", label: "Configurações" },
  { id: "usuarios", label: "Usuários" },
];

const ACOES: { id: AcaoPermissao; label: string }[] = [
  { id: "visualizar", label: "Ver" },
  { id: "criar", label: "Criar" },
  { id: "editar", label: "Editar" },
  { id: "excluir", label: "Excluir" },
];

export function AbaPermissoes() {
  const { data: perfisRes, refetch: refetchPerfis } = useQuery(() => perfisApi.list({ limit: 100 }), []);
  const { data: usuariosRes } = useQuery(() => usuariosApi.list({ limit: 100 }), []);

  const perfis = perfisRes?.data ?? [];
  const usuarios = usuariosRes?.data ?? [];

  const [perfilId, setPerfilId] = useState<string>("");
  const perfil = perfis.find((p) => p.id === perfilId) ?? perfis[0];

  // Matriz de permissões em estado local
  const [permsState, setPermsState] = useState<Record<string, Set<AcaoPermissao>>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Sincroniza estado de permissões quando o perfil selecionado muda
  useEffect(() => {
    if (!perfil) return;
    const initialMap: Record<string, Set<AcaoPermissao>> = {};
    for (const m of MODULOS) {
      const found = perfil.permissoes.find((p) => p.modulo === m.id);
      initialMap[m.id] = new Set((found?.acoes as AcaoPermissao[]) ?? []);
    }
    setPermsState(initialMap);
  }, [perfil?.id, perfil]);

  function togglePermissao(moduloId: string, acao: AcaoPermissao) {
    setPermsState((prev) => {
      const currentSet = new Set(prev[moduloId] ?? []);
      if (currentSet.has(acao)) {
        currentSet.delete(acao);
        if (acao === "visualizar") currentSet.clear();
      } else {
        currentSet.add(acao);
        if (acao !== "visualizar") currentSet.add("visualizar");
      }
      return { ...prev, [moduloId]: currentSet };
    });
  }

  function toggleLinha(moduloId: string, marcarTudo: boolean) {
    setPermsState((prev) => ({
      ...prev,
      [moduloId]: marcarTudo
        ? new Set<AcaoPermissao>(["visualizar", "criar", "editar", "excluir"])
        : new Set<AcaoPermissao>(),
    }));
  }

  async function handleSalvarPermissoes() {
    if (!perfil) return;
    setSalvando(true);
    setMensagemSucesso(null);

    const payload = Object.entries(permsState).map(([modulo, acoesSet]) => ({
      modulo,
      acoes: Array.from(acoesSet),
    }));

    try {
      await perfisApi.update(perfil.id, { permissoes: payload });
      await refetchPerfis();
      setMensagemSucesso("Permissões e regra de login salvas com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (err: any) {
      alert("Erro ao salvar permissões: " + (err.message || err));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirPerfil(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir o perfil "${nome}"?`)) return;
    try {
      await perfisApi.remove(id);
      await refetchPerfis();
      if (perfilId === id) setPerfilId("");
    } catch (err: any) {
      alert("Erro ao excluir perfil: " + (err.message || err));
    }
  }

  const usuariosDoPerfil = perfil ? usuarios.filter((u) => u.perfilId === perfil.id) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Mensagem de sucesso */}
      {mensagemSucesso && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Lista de Perfis */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <span>Perfis de Acesso Cadastrados</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Selecione um perfil para visualizar ou editar suas regras de login e permissões</p>
            </div>
            <LinkButton href="/usuarios/perfis/novo" size="sm" className="cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Criar Novo Perfil
            </LinkButton>
          </div>
        </CardHeader>
        <div className="divide-y divide-zinc-100">
          {perfis.map((p) => {
            const isSelected = perfil?.id === p.id;
            const qteUsuarios = usuarios.filter((u) => u.perfilId === p.id).length;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerfilId(p.id)}
                className={`flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm transition-all cursor-pointer ${
                  isSelected ? "bg-sky-50/70 border-l-4 border-sky-600" : "hover:bg-zinc-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${isSelected ? "text-sky-900" : "text-zinc-800"}`}>{p.nome}</p>
                    {p.isSistema && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-800">
                        Sistema
                      </span>
                    )}
                  </div>
                  {p.descricao && <p className="text-xs text-zinc-500 mt-0.5">{p.descricao}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={qteUsuarios > 0 ? "sky" : "zinc"}>
                    {qteUsuarios} usuário(s)
                  </Badge>
                  <Link
                    href={`/usuarios/perfis/${p.id}/editar`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-600 hover:bg-sky-100/50 transition-colors"
                    title="Editar Perfil"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                  {!p.isSistema && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExcluirPerfil(p.id, p.nome);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Excluir Perfil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Matriz RBAC de Permissões */}
      {perfil && (
        <Card className="shadow-xs">
          <CardHeader className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">
                Matriz de Permissões — <span className="text-sky-600">{perfil.nome}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Marque ou desmarque as ações permitidas por módulo para este perfil</p>
            </div>
            <div className="flex items-center gap-2">
              <LinkButton href={`/usuarios/perfis/${perfil.id}/editar`} variant="outline" size="sm">
                <Edit3 className="h-3.5 w-3.5" /> Editar Nome / Dados
              </LinkButton>
              <Button size="sm" onClick={handleSalvarPermissoes} loading={salvando} className="cursor-pointer">
                <Save className="h-3.5 w-3.5" /> Salvar Permissões
              </Button>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 w-48">Módulo do Sistema</th>
                  {ACOES.map((a) => (
                    <th key={a.id} className="px-3 py-3 text-center">{a.label}</th>
                  ))}
                  <th className="px-3 py-3 text-center">Todos</th>
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((m) => {
                  const currentSet = permsState[m.id] ?? new Set<AcaoPermissao>();
                  const todosMarcados = ACOES.every((a) => currentSet.has(a.id));

                  return (
                    <tr key={m.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3 font-medium text-zinc-800">{m.label}</td>
                      {ACOES.map((a) => (
                        <td key={a.id} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={currentSet.has(a.id)}
                            onChange={() => togglePermissao(m.id, a.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={todosMarcados}
                          onChange={(e) => toggleLinha(m.id, e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-zinc-200 px-5 py-3 flex items-center justify-between bg-zinc-50/50">
            <p className="text-xs text-zinc-500">
              * Marcar qualquer ação garante automaticamente a permissão de "Ver". Desmarcar "Ver" revoga o acesso ao módulo.
            </p>
            <Button size="sm" onClick={handleSalvarPermissoes} loading={salvando} className="cursor-pointer">
              <Save className="h-3.5 w-3.5" /> Salvar Permissões
            </Button>
          </div>
        </Card>
      )}

      {/* Usuários Vinculados */}
      {perfil && (
        <Card className="shadow-xs">
          <CardHeader className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-800">
              Usuários Vinculados ao Perfil — <span className="text-sky-600">{perfil.nome}</span>
            </h3>
            <span className="text-xs font-semibold text-zinc-400">
              {usuariosDoPerfil.length} usuário(s)
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3">Nome Completo</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuariosDoPerfil.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-xs text-zinc-400">
                      Nenhum usuário cadastrado neste perfil ainda.
                    </td>
                  </tr>
                ) : (
                  usuariosDoPerfil.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                      <td className="px-5 py-3 font-semibold text-zinc-900">{u.nomeCompleto}</td>
                      <td className="px-5 py-3 text-zinc-500 font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-3">
                        <Badge tone={u.ativo ? "green" : "zinc"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/usuarios/${u.id}/editar`} className="text-sky-600 hover:underline text-xs font-bold">
                          Editar Usuário
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
