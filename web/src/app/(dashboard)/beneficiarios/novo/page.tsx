import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";
import { nucleosApi, turmasApi } from "@/lib/api/services";

export default async function NovoBeneficiarioPage() {
  const [nucleosRes, turmasRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    turmasApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo Beneficiário" description="Cadastro de beneficiário (aluno/atleta)" />
      <BeneficiarioForm
        nucleos={nucleosRes.data}
        turmas={turmasRes.data}
        backHref="/beneficiarios"
      />
    </div>
  );
}
