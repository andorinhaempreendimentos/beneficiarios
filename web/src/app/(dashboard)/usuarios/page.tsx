"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Download, Check } from "lucide-react";
import {
  Badge,
  Card,
  FilterBar,
  Field,
  Input,
  Select,
  LinkButton,
  PageHeader,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { usuariosApi, perfisApi, type Paginated, type UsuarioApi, type PerfilApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { StatusUsuarioBadge } from "@/components/usuarios/StatusUsuarioBadge";

const PER_PAGE = 15;
const EMPTY = { busca: "", perfilId: "", ativo: "" };

export default function UsuariosPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setAtivos(filtros);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros]);

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

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((u) => u.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = resultado.length > 0 && selectedIds.length === resultado.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Usuários"
        description="Gestão de acesso ao sistema"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
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
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum usuário encontrado.
                  </div>
                ) : (
                  resultado.map((u) => {
                    const perfil = perfis.find((p) => p.id === u.perfilId);
                    const isSelected = selectedIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        className={`group relative overflow-hidden rounded-2xl border transition-all flex flex-col justify-between gap-3 p-4 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/30 ring-2 ring-sky-500/20 shadow-xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Checkbox Elegante no Canto Superior Esquerdo (Padrão Beneficiário) */}
                        <label
                          className={`absolute top-0 left-0 z-10 flex h-8 w-9 items-center justify-center rounded-br-xl border-r border-b transition-all cursor-pointer ${
                            isSelected
                              ? "bg-sky-600 border-sky-600 text-white shadow-2xs"
                              : "bg-zinc-100/90 border-zinc-200/80 text-zinc-400 group-hover:bg-zinc-200/80 group-hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(u.id)}
                            className="sr-only"
                          />
                          <Check className={`h-4 w-4 stroke-[3] transition-transform ${isSelected ? "scale-100 text-white" : "scale-85 text-zinc-400 opacity-60 group-hover:opacity-100"}`} />
                        </label>

                        {/* Cabeçalho com Deslocamento pl-7 para o Checkbox */}
                        <div className="flex items-start justify-between gap-2 pl-7">
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-zinc-400 block">{u.email}</span>
                            <Link href={`/usuarios/${u.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                              {u.nomeCompleto}
                            </Link>
                          </div>
                          <StatusUsuarioBadge usuarioId={u.id} statusAtual={u.ativo ? "ativo" : "inativo"} />
                        </div>

                        {/* Informação de Perfil e Tipo */}
                        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-2">
                          <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                            {perfil?.nome ?? "—"}
                          </span>
                          <span className="text-zinc-600 font-medium">
                            {u.isProfessor ? "Professor" : "Usuário"}
                          </span>
                        </div>

                        {/* Ações Rápidas no Rodapé (Estilo Beneficiário) */}
                        <div className="flex items-center justify-end text-xs text-zinc-500 border-t border-zinc-100 pt-2 text-right">
                          <Link href={`/usuarios/${u.id}`} className="text-sky-600 hover:underline font-medium">
                            Acessar
                          </Link>
                          <span className="mx-1.5 text-zinc-300">|</span>
                          <Link href={`/usuarios/${u.id}/editar`} className="text-zinc-500 hover:underline">
                            Editar
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
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
                      <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">Nenhum usuário encontrado.</td></tr>
                    ) : resultado.map((u) => {
                      const perfil = perfis.find((p) => p.id === u.perfilId);
                      const isSelected = selectedIds.includes(u.id);
                      return (
                        <tr key={u.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(u.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>
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
                            <StatusUsuarioBadge usuarioId={u.id} statusAtual={u.ativo ? "ativo" : "inativo"} />
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
          </>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={resultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} usuário(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
