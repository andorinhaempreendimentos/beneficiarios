import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { perfisApi, usuariosApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const MODULO_LABEL: Record<string, string> = {
  objetos: "Objetos", organizacoes: "Organizações", nucleos: "Núcleos",
  turmas: "Turmas", inscricoes: "Inscrições", atividades: "Atividades",
  beneficiarios: "Beneficiários", funcionarios: "Pessoal", equipamentos: "Equipamentos",
  relatorios: "Relatórios", configuracoes: "Configurações", usuarios: "Usuários",
};

const ACAO_LABEL: Record<string, string> = {
  visualizar: "Ver", criar: "Criar", editar: "Editar", excluir: "Excluir",
};

interface Props { params: Promise<{ perfilId: string }> }

export default async function PerfilDetailPage({ params }: Props) {
  const { perfilId } = await params;
  const perfil = await perfisApi.get(perfilId).catch(() => null);
  if (!perfil) notFound();

  const usuariosRes = await usuariosApi.list({ limit: 100 }).catch(() => ({ data: [] }));
  const usuariosDoPerfil = usuariosRes.data.filter((u) => u.perfilId === perfilId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={perfil.nome}
        description={perfil.descricao ?? "Perfil de acesso"}
        actions={
          <div className="flex gap-2">
            <LinkButton href="/usuarios/perfis" variant="outline">Voltar</LinkButton>
            <LinkButton href={`/usuarios/perfis/${perfilId}/editar`}>Editar perfil</LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="text-sm font-semibold text-zinc-700">Matriz de Permissões</h3></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3 text-left">Módulo</th>
                    <th className="px-4 py-3 text-left">Permissões</th>
                  </tr>
                </thead>
                <tbody>
                  {perfil.permissoes.map((perm, idx) => (
                    <tr key={perm.modulo} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                      <td className="px-4 py-2.5 font-medium text-zinc-700">{MODULO_LABEL[perm.modulo] ?? perm.modulo}</td>
                      <td className="px-4 py-2.5">
                        {perm.acoes.length === 0 ? (
                          <span className="text-xs text-zinc-300">Sem acesso</span>
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
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="text-sm font-semibold text-zinc-700">Usuários com este perfil</h3>
            <span className="text-xs text-zinc-400">{usuariosDoPerfil.length} usuário(s)</span>
          </CardHeader>
          <CardBody>
            {usuariosDoPerfil.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhum usuário vinculado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {usuariosDoPerfil.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700">{u.nomeCompleto}</span>
                    <a href={`/usuarios/${u.id}`} className="text-xs text-sky-600 hover:underline">Ver</a>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
          <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400">
            Criado em {formatarData(perfil.criadoEm)}
          </div>
        </Card>
      </div>
    </div>
  );
}
