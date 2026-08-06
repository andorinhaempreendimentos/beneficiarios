import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ObjetoForm } from "@/components/objetos/ObjetoForm";
import { objetosApi } from "@/lib/api/services";

export default async function EditarObjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await objetosApi.get(id).catch(() => null);
  if (!o) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar objeto" description={o.nome} />
      <ObjetoForm objeto={o} backHref={`/objetos/${o.id}`} />
    </div>
  );
}
