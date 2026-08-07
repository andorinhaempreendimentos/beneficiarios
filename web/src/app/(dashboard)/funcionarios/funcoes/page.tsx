import { PageHeader } from "@/components/ui";
import { FuncoesManager } from "@/components/funcionarios/FuncoesManager";
import { funcoesApi } from "@/lib/api/services";

export default async function FuncoesPage() {
  const funcoes = await funcoesApi.list().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Funções de Pessoal"
        description="Gestão e cadastro de cargos / funções para a equipe de funcionários"
      />
      <FuncoesManager inicialFuncoes={funcoes} />
    </div>
  );
}
