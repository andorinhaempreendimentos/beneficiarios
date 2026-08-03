import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { EquipamentoForm } from "@/components/equipamentos/EquipamentoForm";
import { getEquipamentoById } from "@/lib/mock/equipamentos";

export default async function EditarEquipamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = getEquipamentoById(id);
  if (!e) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar equipamento" description={e.nome} />
      <EquipamentoForm equipamento={e} backHref={`/equipamentos/${e.id}`} />
    </div>
  );
}
