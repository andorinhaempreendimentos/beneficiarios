import { PageHeader } from "@/components/ui";
import { NucleoForm } from "@/components/nucleos/NucleoForm";

export default function NovoNucleoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo núcleo" description="Cadastro de núcleo / polo" />
      <NucleoForm backHref="/nucleos" />
    </div>
  );
}
