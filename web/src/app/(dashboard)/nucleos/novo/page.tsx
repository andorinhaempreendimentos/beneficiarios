import { PageHeader } from "@/components/ui";
import { NucleoForm } from "@/components/nucleos/NucleoForm";
import { atividadesApi, organizacoesApi } from "@/lib/api/services";

export default async function NovoNucleoPage() {
  const [atividadesRes, organizacoesRes] = await Promise.all([
    atividadesApi.list({ limit: 1000 }).catch(() => ({ data: [] })),
    organizacoesApi.list({ limit: 1000 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo núcleo" description="Cadastro de núcleo / polo" />
      <NucleoForm organizacoes={organizacoesRes.data} atividades={atividadesRes.data} backHref="/nucleos" />
    </div>
  );
}
