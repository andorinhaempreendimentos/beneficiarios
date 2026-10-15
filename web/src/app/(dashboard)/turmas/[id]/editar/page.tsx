import { notFound } from "next/navigation";
import { EditarGrupoView } from "@/components/turmas/EditarGrupoView";
import { turmasApi, nucleosApi, atividadesApi, funcionariosApi } from "@/lib/api/services";

export default async function EditarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await turmasApi.get(id).catch(() => null);
  if (!t) notFound();

  const [nucleosRes, atividadesRes, funcionariosRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 500 }).catch(() => ({ data: [] })),
  ]);

  return (
    <EditarGrupoView
      turma={t}
      nucleos={nucleosRes.data}
      atividades={atividadesRes.data}
      funcionarios={funcionariosRes.data}
    />
  );
}
