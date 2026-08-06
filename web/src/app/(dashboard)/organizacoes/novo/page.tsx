import { PageHeader } from "@/components/ui";
import { OrganizacaoForm } from "@/components/organizacoes/OrganizacaoForm";
import { objetosApi } from "@/lib/api/services";

export default async function NovaOrganizacaoPage() {
  const objetosRes = await objetosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova organização" description="Cadastro de entidade executora" />
      <OrganizacaoForm objetos={objetosRes.data} backHref="/organizacoes" />
    </div>
  );
}
