import { notFound } from "next/navigation";
import { turmasApi, nucleosApi, atividadesApi, beneficiariosApi } from "@/lib/api/services";
import { DetalhesTurmaView } from "@/components/turmas/DetalhesTurmaView";

export default async function DetalhesTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await turmasApi.get(id).catch(() => null);
  if (!t) notFound();

  const [nucleo, atividade, matriculadosRes, todasTurmasRes, todosBeneficiariosRes] = await Promise.all([
    t.nucleoId ? nucleosApi.get(t.nucleoId).catch(() => null) : null,
    t.atividadeId ? atividadesApi.get(t.atividadeId).catch(() => null) : null,
    beneficiariosApi.list({ turmaId: t.id, limit: 200 }).catch(() => ({ data: [], total: 0, page: 1, limit: 200 })),
    turmasApi.list({ limit: 100 }).catch(() => ({ data: [], total: 0, page: 1, limit: 100 })),
    beneficiariosApi.list({ limit: 500 }).catch(() => ({ data: [], total: 0, page: 1, limit: 500 })),
  ]);

  const outrasTurmas = todasTurmasRes.data.filter((item) => item.id !== t.id);

  return (
    <DetalhesTurmaView
      turma={t}
      nucleo={nucleo}
      atividade={atividade}
      matriculados={matriculadosRes.data}
      qtdOcupadas={matriculadosRes.total}
      outrasTurmas={outrasTurmas}
      todosBeneficiarios={todosBeneficiariosRes.data}
    />
  );
}
