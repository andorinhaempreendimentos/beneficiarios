import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";

export default function NovoBeneficiarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo Beneficiário" description="Cadastro de beneficiário (aluno/atleta)" />
      <BeneficiarioForm backHref="/beneficiarios" />
    </div>
  );
}
