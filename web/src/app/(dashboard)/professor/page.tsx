import { notFound, redirect } from "next/navigation";
import { DashboardProfessorHub } from "@/components/professor/DashboardProfessorHub";
import { funcionariosApi, turmasApi, nucleosApi, beneficiariosApi } from "@/lib/api/services";

export default async function AreaProfessorPage() {
  const funcionarios = await funcionariosApi.list({ limit: 100 }).catch(() => ({ data: [] }));
  const professor = funcionarios.data.find((f) => f.professorResponsavel) || funcionarios.data[0];

  if (!professor) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nenhum professor encontrado no sistema.
      </div>
    );
  }

  const [turmasRes, nucleosRes, todosBeneficiariosRes] = await Promise.all([
    turmasApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    beneficiariosApi.list({ limit: 500 }).catch(() => ({ data: [] })),
  ]);

  const nucleo = nucleosRes.data.find((n) => n.id === professor.nucleoId);

  return (
    <DashboardProfessorHub
      professor={professor}
      nucleo={nucleo}
      turmas={turmasRes.data}
      todosBeneficiarios={todosBeneficiariosRes.data}
    />
  );
}
