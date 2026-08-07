import { notFound, redirect } from "next/navigation";
import { PortalProfessor } from "@/components/professor/PortalProfessor";
import { funcionariosApi, turmasApi, nucleosApi } from "@/lib/api/services";

export default async function AreaProfessorPage() {
  const funcionarios = await funcionariosApi.list({ limit: 100 }).catch(() => ({ data: [] }));
  // Selecionar o primeiro professor responsavel como demonstracao
  const professor = funcionarios.data.find((f) => f.professorResponsavel) || funcionarios.data[0];

  if (!professor) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nenhum professor encontrado no sistema.
      </div>
    );
  }

  const turmasRes = await turmasApi.list({ limit: 100 }).catch(() => ({ data: [] }));
  const nucleosRes = await nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return (
    <PortalProfessor
      professor={professor}
      turmas={turmasRes.data}
      nucleos={nucleosRes.data}
    />
  );
}
