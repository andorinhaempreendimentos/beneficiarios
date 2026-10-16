import { PageHeader } from "@/components/ui";
import { NucleoForm } from "@/components/nucleos/NucleoForm";
import { atividadesApi, organizacoesApi, funcionariosApi } from "@/lib/api/services";

export default async function NovoNucleoPage() {
  const [atividadesRes, organizacoesRes, funcionariosRes] = await Promise.all([
    atividadesApi.list({ limit: 1000 }).catch(() => ({ data: [] })),
    organizacoesApi.list({ limit: 1000 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 1000, status: "ativo" }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo núcleo" description="Cadastro de núcleo / polo" />
      <NucleoForm
        organizacoes={organizacoesRes.data}
        atividades={atividadesRes.data}
        funcionarios={funcionariosRes.data}
        backHref="/nucleos"
      />
    </div>
  );
}
