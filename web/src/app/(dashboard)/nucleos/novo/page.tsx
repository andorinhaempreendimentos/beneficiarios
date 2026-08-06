import { PageHeader } from "@/components/ui";
import { NucleoForm } from "@/components/nucleos/NucleoForm";
import { atividadesApi } from "@/lib/api/services";

export default async function NovoNucleoPage() {
  const atividadesRes = await atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo núcleo" description="Cadastro de núcleo / polo" />
      <NucleoForm atividades={atividadesRes.data} backHref="/nucleos" />
    </div>
  );
}
