import { PageHeader } from "@/components/ui";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { nucleosApi } from "@/lib/api/services";

export default async function NovoFuncionarioPage() {
  const nucleosRes = await nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cadastrar Funcionário" description="Cadastro de pessoal (RH)" />
      <FuncionarioForm nucleos={nucleosRes.data} backHref="/funcionarios" />
    </div>
  );
}
