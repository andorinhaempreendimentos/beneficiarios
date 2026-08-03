import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ObjetoForm } from "@/components/objetos/ObjetoForm";
import { getObjetoById } from "@/lib/mock/objetos";

export default async function EditarObjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getObjetoById(id);
  if (!o) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar objeto" description={o.nome} />
      <ObjetoForm objeto={o} backHref={`/objetos/${o.id}`} />
    </div>
  );
}
