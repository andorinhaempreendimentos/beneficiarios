import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";
import { getBeneficiarioById } from "@/lib/mock/beneficiarios";

export default async function EditarBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beneficiario = getBeneficiarioById(id);
  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Beneficiário" description={beneficiario.nomeCompleto} />
      <BeneficiarioForm beneficiario={beneficiario} backHref={`/beneficiarios/${id}`} />
    </div>
  );
}
