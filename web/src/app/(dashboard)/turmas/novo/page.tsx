import { PageHeader } from "@/components/ui";
import { TurmaForm } from "@/components/turmas/TurmaForm";
import { nucleosApi, atividadesApi } from "@/lib/api/services";

export default async function NovaTurmaPage() {
  const [nucleosRes, atividadesRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nova turma" description="Cadastro de turma vinculada a núcleo e atividade" />
      <TurmaForm nucleos={nucleosRes.data} atividades={atividadesRes.data} backHref="/turmas" />
    </div>
  );
}
