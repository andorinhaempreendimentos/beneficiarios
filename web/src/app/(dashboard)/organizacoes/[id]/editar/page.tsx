import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { OrganizacaoForm } from "@/components/organizacoes/OrganizacaoForm";
import { organizacoesApi, objetosApi } from "@/lib/api/services";

export default async function EditarOrganizacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await organizacoesApi.get(id).catch(() => null);
  if (!o) notFound();

  const objetosRes = await objetosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar organização" description={o.nome} />
      <OrganizacaoForm organizacao={o} objetos={objetosRes.data} backHref={`/organizacoes/${o.id}`} />
    </div>
  );
}
