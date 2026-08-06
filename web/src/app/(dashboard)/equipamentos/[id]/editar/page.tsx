import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { EquipamentoForm } from "@/components/equipamentos/EquipamentoForm";
import { equipamentosApi, nucleosApi, objetosApi } from "@/lib/api/services";

export default async function EditarEquipamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await equipamentosApi.get(id).catch(() => null);
  if (!e) notFound();

  const [nucleosRes, objetosRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    objetosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar equipamento" description={e.nome} />
      <EquipamentoForm equipamento={e} nucleos={nucleosRes.data} objetos={objetosRes.data} backHref={`/equipamentos/${e.id}`} />
    </div>
  );
}
