"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { usuariosApi, perfisApi, type Paginated, type UsuarioApi, type PerfilApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", perfilId: "", ativo: "" };

export default function UsuariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const { data: pageData, loading } = useQuery<Paginated<UsuarioApi>>(
    () => usuariosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: perfisData } = useQuery<Paginated<PerfilApi>>(() => perfisApi.list({ limit: 100 }), []);

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const perfis = perfisData?.data ?? [];

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Gestão de acesso ao sistema"
        actions={
          <div className="flex gap-2">
            <LinkButton href="/usuarios/perfis" variant="outline">Gerenciar perfis</LinkButton>
            <LinkButton href="/usuarios/novo">Novo usuário</LinkButton>
          </div>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input placeholder="Nome ou e-mail" value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} />
        </Field>
        <Field label="Perfil">
          <Select value={filtros.perfilId} onChange={(e) => setFiltros((f) => ({ ...f, perfilId: e.target.value }))}>
            <option value="">Todos</option>
            {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.ativo} onChange={(e) => setFiltros((f) => ({ ...f, ativo: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Perfil</th>
                  <th className="px-5 py-3">É Professor?</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Criado em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum usuário encontrado.</td></tr>
                ) : resultado.map((u) => {
                  const perfil = perfis.find((p) => p.id === u.perfilId);
                  return (
                    <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <Link href={`/usuarios/${u.id}`} className="font-medium text-sky-600 hover:underline">{u.nomeCompleto}</Link>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <Badge tone="sky">{perfil?.nome ?? "—"}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(u.isProfessor)}
                            onChange={async (e) => {
                              const novoVal = e.target.checked;
                              await usuariosApi.update(u.id, { isProfessor: novoVal });
                              window.location.reload();
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                          <span className="ml-2 text-xs font-semibold text-zinc-700">
                            {u.isProfessor ? "Sim" : "Não"}
                          </span>
                        </label>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={u.ativo ? "green" : "red"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{formatarData(u.criadoEm)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/usuarios/${u.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                        <span className="mx-1.5 text-zinc-300">|</span>
                        <Link href={`/usuarios/${u.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
