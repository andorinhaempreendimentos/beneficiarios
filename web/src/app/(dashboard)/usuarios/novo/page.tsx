import { PageHeader } from "@/components/ui";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";

export default function NovoUsuarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo Usuário" description="Criar acesso ao sistema" />
      <UsuarioForm backHref="/usuarios" />
    </div>
  );
}
