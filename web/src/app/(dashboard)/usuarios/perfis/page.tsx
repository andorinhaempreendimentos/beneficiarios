"use client";

import Link from "next/link";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { perfisApi, type Paginated, type PerfilApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { formatarData } from "@/lib/utils";

const ACAO_LABEL: Record<string, string> = {
  visualizar: "Ver", criar: "Criar", editar: "Editar", excluir: "Excluir",
};

export default function PerfisPage() {
  const { data: pageData, loading } = useQuery<Paginated<PerfilApi>>(
    () => perfisApi.list({ limit: 100 }),
    [],
  );
  const perfis = pageData?.data ?? [];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfis de Acesso"
        description="Definem as permissões dos usuários no sistema"
        actions={<LinkButton href="/usuarios/perfis/novo">Novo perfil</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {perfis.map((perfil) => (
          <Card key={perfil.id}>
            <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <p className="font-semibold text-zinc-900">{perfil.nome}</p>
                {perfil.descricao && <p className="mt-0.5 text-sm text-zinc-500">{perfil.descricao}</p>}
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
        ))}
      </div>
    </div>
  );
}
