import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { AtividadeForm } from "@/components/atividades/AtividadeForm";
import { getAtividadeById } from "@/lib/mock/atividades";

export default async function EditarAtividadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const atividade = getAtividadeById(id);
  if (!atividade) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar atividade" description={atividade.nome} />
      <AtividadeForm atividade={atividade} backHref={`/atividades/${id}`} />
    </div>
  );
}
