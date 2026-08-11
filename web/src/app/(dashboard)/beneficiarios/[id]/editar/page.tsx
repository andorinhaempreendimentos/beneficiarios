import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";
import { beneficiariosApi, nucleosApi, turmasApi } from "@/lib/api/services";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditarBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [beneficiario, nucleosRes, turmasRes] = await Promise.all([
    beneficiariosApi.get(id).catch(() => null),
    nucleosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
    turmasApi.list({ limit: 200 }).catch(() => ({ data: [] })),
  ]);

  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Beneficiário" description={beneficiario.nomeCompleto} />
      <BeneficiarioForm
        beneficiario={beneficiario as any}
        nucleos={nucleosRes.data}
        turmas={turmasRes.data}
        backHref={`/beneficiarios/${id}`}
      />
    </div>
  );
}
