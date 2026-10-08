import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { GrupoForm } from "@/components/turmas/GrupoForm";
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
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar grupo" description={t.nome} />
      <GrupoForm
        turma={t}
        nucleos={nucleosRes.data}
        atividades={atividadesRes.data}
        funcionarios={funcionariosRes.data}
        backHref={`/turmas/${t.id}`}
      />
    </div>
  );
}
