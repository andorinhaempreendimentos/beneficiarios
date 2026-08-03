import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { OrganizacaoForm } from "@/components/organizacoes/OrganizacaoForm";
import { getOrganizacaoById } from "@/lib/mock/organizacoes";

export default async function EditarOrganizacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOrganizacaoById(id);
  if (!o) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar organização" description={o.nome} />
      <OrganizacaoForm organizacao={o} backHref={`/organizacoes/${o.id}`} />
    </div>
  );
}
