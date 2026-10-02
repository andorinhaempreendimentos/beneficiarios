import { notFound } from "next/navigation";
import { nucleosApi, turmasApi, beneficiariosApi, categoriaTurmasApi } from "@/lib/api/services";
import { DetalhesNucleoView } from "@/components/nucleos/DetalhesNucleoView";

export default async function DetalhesNucleoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nucleo = await nucleosApi.get(id).catch(() => null);
  if (!nucleo) notFound();

  const [turmasRes, beneficiariosRes, categoriasRes] = await Promise.all([
    turmasApi.list({ nucleoId: nucleo.id, limit: 100 }).catch(() => ({ data: [] })),
    beneficiariosApi.list({ nucleoId: nucleo.id, limit: 100 }).catch(() => ({ data: [], total: 0 })),
    categoriaTurmasApi.list({ limit: 50 }).catch(() => ({ data: [] })),
  ]);

  return (
    <DetalhesNucleoView
      nucleo={nucleo}
      turmas={turmasRes.data}
      beneficiarios={beneficiariosRes.data}
      totalBeneficiarios={beneficiariosRes.total}
      categorias={categoriasRes.data}
    />
  );
}
