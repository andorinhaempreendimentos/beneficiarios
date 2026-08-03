"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { usuarios, perfis } from "@/lib/mock/usuarios";
import { statusUsuarioLabel, statusUsuarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { busca: "", perfilId: "", status: "" };

export default function UsuariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (ativos.busca && !u.nome.toLowerCase().includes(ativos.busca.toLowerCase()) &&
          !u.email.toLowerCase().includes(ativos.busca.toLowerCase())) return false;
      if (ativos.perfilId && u.perfilId !== ativos.perfilId) return false;
      if (ativos.status && u.status !== ativos.status) return false;
      return true;
    });
  }, [ativos]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const pagAtual = Math.min(pagina, totalPages);
  const resultado = filtrados.slice((pagAtual - 1) * PER_PAGE, pagAtual * PER_PAGE);

  function aplicar() { setPagina(1); setAtivos(filtros); }
  function limpar() { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }

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
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Perfil</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Último acesso</th>
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
                      <Link href={`/usuarios/${u.id}`} className="font-medium text-sky-600 hover:underline">{u.nome}</Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone="sky">{perfil?.nome ?? "—"}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusUsuarioTone[u.status]}>{statusUsuarioLabel[u.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{u.ultimoAcesso ? formatarData(u.ultimoAcesso) : "—"}</td>
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
        <Pagination currentPage={pagAtual} totalPages={totalPages} totalItems={filtrados.length} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
