import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { funcionariosApi, nucleosApi } from "@/lib/api/services";

export default async function EditarFuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const funcionario = await funcionariosApi.get(id).catch(() => null);
  if (!funcionario) notFound();

  const nucleosRes = await nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Funcionário" description={funcionario.nomeCompleto} />
      <FuncionarioForm funcionario={funcionario} nucleos={nucleosRes.data} backHref={`/funcionarios/${id}`} />
    </div>
  );
}
