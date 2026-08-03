import { PageHeader } from "@/components/ui";
import { EquipamentoForm } from "@/components/equipamentos/EquipamentoForm";

export default function NovoEquipamentoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo equipamento" description="Cadastro de material ou equipamento" />
      <EquipamentoForm backHref="/equipamentos" />
    </div>
  );
}
