import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { getUsuarioById } from "@/lib/mock/usuarios";

interface Props { params: Promise<{ id: string }> }

export default async function EditarUsuarioPage({ params }: Props) {
  const { id } = await params;
  const usuario = getUsuarioById(id);
  if (!usuario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Usuário" description={usuario.nome} />
      <UsuarioForm usuario={usuario} backHref={`/usuarios/${id}`} />
    </div>
  );
}
