import { NovoGrupoView } from "@/components/turmas/NovoGrupoView";
import { nucleosApi, atividadesApi, funcionariosApi } from "@/lib/api/services";

export default async function NovaTurmaPage() {
  const [nucleosRes, atividadesRes, funcionariosRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 500 }).catch(() => ({ data: [] })),
  ]);

  return (
    <NovoGrupoView
      nucleos={nucleosRes.data}
      atividades={atividadesRes.data}
      funcionarios={funcionariosRes.data}
    />
  );
}
