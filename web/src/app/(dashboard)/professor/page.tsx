import { ProfessorClientWrapper } from "@/components/professor/ProfessorClientWrapper";
import { funcionariosApi, turmasApi, nucleosApi, beneficiariosApi } from "@/lib/api/services";

export default async function AreaProfessorPage() {
  const [funcionariosRes, turmasRes, nucleosRes, todosBeneficiariosRes] = await Promise.all([
    funcionariosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
    turmasApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    beneficiariosApi.list({ limit: 500 }).catch(() => ({ data: [] })),
  ]);

  // Filtra funcionários com perfil ou função de professor/instrutor/monitor
  const professores = funcionariosRes.data.filter(
    (f) =>
      f.professorResponsavel ||
      f.funcao?.toLowerCase().includes("profess") ||
      f.funcao?.toLowerCase().includes("instrutor") ||
      f.funcao?.toLowerCase().includes("monitor") ||
      f.funcao?.toLowerCase().includes("coordenador")
  );

  const listaProfessores = professores.length > 0 ? professores : funcionariosRes.data;

  if (listaProfessores.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nenhum professor ou instrutor encontrado no sistema.
      </div>
    );
  }

  return (
    <ProfessorClientWrapper
      professores={listaProfessores}
      nucleos={nucleosRes.data}
      turmas={turmasRes.data}
      todosBeneficiarios={todosBeneficiariosRes.data}
      initialProfessorId={listaProfessores[0].id}
    />
  );
}
