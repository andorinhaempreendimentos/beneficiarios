import { PageHeader } from "@/components/ui";
import { ObjetoForm } from "@/components/objetos/ObjetoForm";

export default function NovoObjetoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo objeto" description="Cadastro de projeto ou evento" />
      <ObjetoForm backHref="/objetos" />
    </div>
  );
}
