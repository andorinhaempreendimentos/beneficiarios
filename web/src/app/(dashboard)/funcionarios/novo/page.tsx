import { PageHeader } from "@/components/ui";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { nucleosApi, funcoesApi } from "@/lib/api/services";

export default async function NovoFuncionarioPage() {
  const [nucleosRes, funcoes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    funcoesApi.list().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cadastrar Funcionário" description="Cadastro de pessoal (RH)" />
      <FuncionarioForm nucleos={nucleosRes.data} funcoes={funcoes} backHref="/funcionarios" />
    </div>
  );
}
