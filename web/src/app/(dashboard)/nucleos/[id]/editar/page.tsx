import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { NucleoForm } from "@/components/nucleos/NucleoForm";
import { nucleosApi } from "@/lib/api/services";

export default async function EditarNucleoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nucleo = await nucleosApi.get(id).catch(() => null);
  if (!nucleo) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar núcleo" description={nucleo.identificacao} />
      <NucleoForm nucleo={nucleo} backHref={`/nucleos/${nucleo.id}`} />
    </div>
  );
}
