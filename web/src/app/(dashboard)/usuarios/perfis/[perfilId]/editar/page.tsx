import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PerfilForm } from "@/components/usuarios/PerfilForm";
import { perfisApi } from "@/lib/api/services";

interface Props { params: Promise<{ perfilId: string }> }

export default async function EditarPerfilPage({ params }: Props) {
  const { perfilId } = await params;
  const perfil = await perfisApi.get(perfilId).catch(() => null);
  if (!perfil) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Perfil" description={perfil.nome} />
      <PerfilForm perfil={perfil} backHref={`/usuarios/perfis/${perfilId}`} />
    </div>
  );
}
