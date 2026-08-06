import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { TurmaForm } from "@/components/turmas/TurmaForm";
import { turmasApi, nucleosApi, atividadesApi } from "@/lib/api/services";

export default async function EditarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await turmasApi.get(id).catch(() => null);
  if (!t) notFound();

  const [nucleosRes, atividadesRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar turma" description={t.nome} />
      <TurmaForm turma={t} nucleos={nucleosRes.data} atividades={atividadesRes.data} backHref={`/turmas/${t.id}`} />
    </div>
  );
}
