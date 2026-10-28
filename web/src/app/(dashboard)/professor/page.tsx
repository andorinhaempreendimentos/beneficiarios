import { ProfessorClientWrapper } from "@/components/professor/ProfessorClientWrapper";
import { funcionariosApi, nucleosApi } from "@/lib/api/services";

export default async function AreaProfessorPage() {
  const [funcionariosRes, nucleosRes] = await Promise.all([
    funcionariosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  // Professor = quem tem professorResponsavel=true OU funcao exatamente "Professor / Instrutor"
  const professores = funcionariosRes.data.filter(
    (f) =>
      f.professorResponsavel ||
      f.funcao === "Professor / Instrutor"
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
      turmas={[]}
      todosBeneficiarios={[]}
      initialProfessorId={listaProfessores[0].id}
    />
  );
}
