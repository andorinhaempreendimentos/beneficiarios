import { PageHeader } from "@/components/ui";
import { GrupoForm } from "@/components/turmas/GrupoForm";
import { nucleosApi, atividadesApi, funcionariosApi } from "@/lib/api/services";

export default async function NovaTurmaPage() {
  const [nucleosRes, atividadesRes, funcionariosRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 500 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo grupo" description="Cadastro de grupo vinculado a núcleo e grade de sessões" />
      <GrupoForm
        nucleos={nucleosRes.data}
        atividades={atividadesRes.data}
        funcionarios={funcionariosRes.data}
        backHref="/turmas"
      />
    </div>
  );
}
