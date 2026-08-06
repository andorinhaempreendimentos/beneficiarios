import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { usuariosApi, perfisApi } from "@/lib/api/services";

interface Props { params: Promise<{ id: string }> }

export default async function EditarUsuarioPage({ params }: Props) {
  const { id } = await params;
  const usuario = await usuariosApi.get(id).catch(() => null);
  if (!usuario) notFound();

  const perfisRes = await perfisApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Usuário" description={usuario.nomeCompleto} />
      <UsuarioForm usuario={usuario} perfis={perfisRes.data} backHref={`/usuarios/${id}`} />
    </div>
  );
}
