import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { NucleoForm } from "@/components/nucleos/NucleoForm";
import { nucleosApi, atividadesApi } from "@/lib/api/services";

export default async function EditarNucleoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [nucleo, atividadesRes] = await Promise.all([
    nucleosApi.get(id).catch(() => null),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);
  if (!nucleo) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar núcleo" description={nucleo.identificacao} />
      <NucleoForm nucleo={nucleo} atividades={atividadesRes.data} backHref={`/nucleos/${nucleo.id}`} />
    </div>
  );
}
