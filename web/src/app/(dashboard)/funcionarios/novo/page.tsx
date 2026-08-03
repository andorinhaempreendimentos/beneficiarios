import { PageHeader } from "@/components/ui";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";

export default function NovoFuncionarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cadastrar Funcionário" description="Cadastro de pessoal (RH)" />
      <FuncionarioForm backHref="/funcionarios" />
    </div>
  );
}
