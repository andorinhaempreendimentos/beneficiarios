import { PageHeader } from "@/components/ui";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { perfisApi } from "@/lib/api/services";

export default async function NovoUsuarioPage() {
  const perfisRes = await perfisApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo Usuário" description="Criar acesso ao sistema" />
      <UsuarioForm perfis={perfisRes.data} backHref="/usuarios" />
    </div>
  );
}
