import { PageHeader } from "@/components/ui";
import { AtividadeForm } from "@/components/atividades/AtividadeForm";

export default function NovaAtividadePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova atividade" description="Cadastro de atividade / modalidade" />
      <AtividadeForm backHref="/atividades" />
    </div>
  );
}
