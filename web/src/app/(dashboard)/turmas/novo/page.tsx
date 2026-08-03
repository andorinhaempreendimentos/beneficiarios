import { PageHeader } from "@/components/ui";
import { TurmaForm } from "@/components/turmas/TurmaForm";

export default function NovaTurmaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova turma" description="Cadastro de turma vinculada a núcleo e atividade" />
      <TurmaForm backHref="/turmas" />
    </div>
  );
}
