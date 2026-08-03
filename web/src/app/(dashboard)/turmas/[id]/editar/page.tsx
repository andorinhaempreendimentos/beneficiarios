import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { TurmaForm } from "@/components/turmas/TurmaForm";
import { getTurmaById } from "@/lib/mock/turmas";

export default async function EditarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = getTurmaById(id);
  if (!t) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar turma" description={t.nome} />
      <TurmaForm turma={t} backHref={`/turmas/${t.id}`} />
    </div>
  );
}
