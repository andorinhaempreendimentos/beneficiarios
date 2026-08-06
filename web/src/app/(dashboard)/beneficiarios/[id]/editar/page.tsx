import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";
import { beneficiariosApi } from "@/lib/api/services";

export default async function EditarBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beneficiario = await beneficiariosApi.get(id).catch(() => null);
  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Beneficiário" description={beneficiario.nomeCompleto} />
      <BeneficiarioForm beneficiario={beneficiario as any} backHref={`/beneficiarios/${id}`} />
    </div>
  );
}
