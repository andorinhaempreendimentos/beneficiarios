import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { getUsuarioById, getPerfilById } from "@/lib/mock/usuarios";
import { statusUsuarioLabel, statusUsuarioTone } from "@/lib/status";
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

interface Props { params: Promise<{ id: string }> }

export default async function UsuarioDetailPage({ params }: Props) {
  const { id } = await params;
  const usuario = getUsuarioById(id);
  if (!usuario) notFound();

  const perfil = getPerfilById(usuario.perfilId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={usuario.nome}
        description={usuario.email}
        actions={
          <div className="flex gap-2">
            <LinkButton href="/usuarios" variant="outline">Voltar</LinkButton>
            <LinkButton href={`/usuarios/${id}/editar`}>Editar</LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><h3 className="text-sm font-semibold text-zinc-700">Informações</h3></CardHeader>
          <CardBody className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <Badge tone={statusUsuarioTone[usuario.status]}>{statusUsuarioLabel[usuario.status]}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Perfil</span>
              <Badge tone="sky">{perfil?.nome ?? "—"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Criado em</span>
              <span className="text-zinc-700">{formatarData(usuario.criadoEm)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Último acesso</span>
              <span className="text-zinc-700">{usuario.ultimoAcesso ? formatarData(usuario.ultimoAcesso) : "—"}</span>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-sm font-semibold text-zinc-700">
              Permissões — {perfil?.nome ?? "Perfil não encontrado"}
            </h3>
            {perfil && (
              <Link href={`/usuarios/perfis/${perfil.id}`} className="text-xs text-sky-600 hover:underline">
                Ver perfil completo
              </Link>
            )}
          </CardHeader>
          <CardBody>
            {perfil ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      <th className="py-2 text-left">Módulo</th>
                      <th className="py-2 text-left">Permissões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfil.permissoes.map((perm) => (
                      <tr key={perm.modulo} className="border-b border-zinc-50 last:border-0">
                        <td className="py-2 pr-4 text-zinc-600">{MODULO_LABEL[perm.modulo] ?? perm.modulo}</td>
                        <td className="py-2">
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
            ) : (
              <p className="text-sm text-zinc-400">Perfil não encontrado.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
