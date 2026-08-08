"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  Badge,
  Card,
  LinkButton,
  PageHeader,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { perfisApi, type Paginated, type PerfilApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { formatarData } from "@/lib/utils";

const ACAO_LABEL: Record<string, string> = {
  visualizar: "Ver", criar: "Criar", editar: "Editar", excluir: "Excluir",
};

export default function PerfisPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: pageData, loading } = useQuery<Paginated<PerfilApi>>(
    () => perfisApi.list({ limit: 100 }),
    [],
  );
  const perfis = pageData?.data ?? [];

  const toggleSelectAll = () => {
    if (selectedIds.length === perfis.length && perfis.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(perfis.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = perfis.length > 0 && selectedIds.length === perfis.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Perfis de Acesso"
        description="Definem as permissões dos usuários no sistema"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/usuarios/perfis/novo">Novo perfil</LinkButton>
          </div>
        }
      />

      {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando perfis…</div>}

      {!loading && (
        <>
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {perfis.map((perfil) => {
                const isSelected = selectedIds.includes(perfil.id);
                return (
                  <Card
                    key={perfil.id}
                    className={isSelected ? "ring-2 ring-sky-500 border-sky-500" : ""}
                  >
                    <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(perfil.id)}
                          className="mt-1 h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <div>
                          <p className="font-semibold text-zinc-900">{perfil.nome}</p>
                          {perfil.descricao && <p className="mt-0.5 text-sm text-zinc-500">{perfil.descricao}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <Link href={`/usuarios/perfis/${perfil.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                        <span className="text-zinc-300">|</span>
                        <Link href={`/usuarios/perfis/${perfil.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-zinc-100 text-zinc-400">
                              <th className="pb-1.5 text-left font-medium">Módulo</th>
                              <th className="pb-1.5 text-left font-medium">Permissões</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perfil.permissoes.map((perm) => (
                              <tr key={perm.modulo} className="border-b border-zinc-50 last:border-0">
                                <td className="py-1.5 pr-3 text-zinc-500 capitalize">{perm.modulo}</td>
                                <td className="py-1.5">
                                  {perm.acoes.length === 0 ? (
                                    <span className="text-zinc-300">—</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {perm.acoes.map((a) => (
                                        <Badge key={a} tone="sky">{ACAO_LABEL[a] ?? a}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-3 text-right text-xs text-zinc-400">Criado em {formatarData(perfil.criadoEm)}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-3">Nome</th>
                      <th className="px-5 py-3">Descrição</th>
                      <th className="px-5 py-3">Módulos configurados</th>
                      <th className="px-5 py-3">Criado em</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfis.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum perfil encontrado.</td></tr>
                    ) : perfis.map((perfil) => {
                      const isSelected = selectedIds.includes(perfil.id);
                      return (
                        <tr key={perfil.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(perfil.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <Link href={`/usuarios/perfis/${perfil.id}`} className="font-medium text-sky-600 hover:underline">{perfil.nome}</Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{perfil.descricao ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{perfil.permissoes.length} módulos</td>
                          <td className="px-5 py-3 text-zinc-600">{formatarData(perfil.criadoEm)}</td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/usuarios/perfis/${perfil.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <Link href={`/usuarios/perfis/${perfil.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={perfis.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} perfil(is)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
