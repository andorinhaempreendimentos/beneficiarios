import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { getFuncionarioById } from "@/lib/mock/funcionarios";

export default async function EditarFuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const funcionario = getFuncionarioById(id);
  if (!funcionario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Funcionário" description={funcionario.nomeCompleto} />
      <FuncionarioForm funcionario={funcionario} backHref={`/funcionarios/${id}`} />
    </div>
  );
}
