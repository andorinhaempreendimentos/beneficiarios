import { PageHeader } from "@/components/ui";
import { TurmaForm } from "@/components/turmas/TurmaForm";
import { nucleosApi, atividadesApi, funcionariosApi } from "@/lib/api/services";

export default async function NovaTurmaPage() {
  const [nucleosRes, atividadesRes, funcionariosRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 500 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova turma" description="Cadastro de turma vinculada a núcleo e atividade" />
      <TurmaForm
        nucleos={nucleosRes.data}
        atividades={atividadesRes.data}
        funcionarios={funcionariosRes.data}
        backHref="/turmas"
      />
    </div>
  );
}

