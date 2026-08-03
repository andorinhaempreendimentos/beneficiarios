import { PageHeader } from "@/components/ui";
import { PerfilForm } from "@/components/usuarios/PerfilForm";

export default function NovoPerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo Perfil" description="Definir permissões por módulo" />
      <PerfilForm backHref="/usuarios/perfis" />
    </div>
  );
}
