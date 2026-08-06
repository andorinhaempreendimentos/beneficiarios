import { PageHeader } from "@/components/ui";
import { EquipamentoForm } from "@/components/equipamentos/EquipamentoForm";
import { nucleosApi, objetosApi } from "@/lib/api/services";

export default async function NovoEquipamentoPage() {
  const [nucleosRes, objetosRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    objetosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo equipamento" description="Cadastro de material ou equipamento" />
      <EquipamentoForm nucleos={nucleosRes.data} objetos={objetosRes.data} backHref="/equipamentos" />
    </div>
  );
}
