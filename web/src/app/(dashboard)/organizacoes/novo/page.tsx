import { PageHeader } from "@/components/ui";
import { OrganizacaoForm } from "@/components/organizacoes/OrganizacaoForm";

export default function NovaOrganizacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova organização" description="Cadastro de entidade executora" />
      <OrganizacaoForm backHref="/organizacoes" />
    </div>
  );
}
