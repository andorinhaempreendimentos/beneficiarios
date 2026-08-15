import { notFound } from "next/navigation";
import { turmasApi, beneficiariosApi, funcionariosApi, execucoesAulaApi } from "@/lib/api/services";
import { ExecucaoAulaClient } from "@/components/professor/ExecucaoAulaClient";

export const dynamic = "force-dynamic";

interface AulaTurmaPageProps {
  params: Promise<{ turmaId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AulaTurmaPage({ params, searchParams }: AulaTurmaPageProps) {
  const { turmaId } = await params;
  const sp = await searchParams;
  const dataQuery = (typeof sp?.data === "string" ? sp.data : undefined) || new Date().toISOString().slice(0, 10);

  const [turma, beneficiariosRes, funcionariosRes, execucaoExistente] = await Promise.all([
    turmasApi.get(turmaId).catch(() => null),
    beneficiariosApi.list({ turmaId, limit: 200 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
    execucoesAulaApi.getExecucao(turmaId, dataQuery).catch(() => null),
  ]);

  if (!turma) {
    notFound();
  }

  const presencasIniciais = execucaoExistente
    ? await execucoesAulaApi.getPresencas(execucaoExistente.id).catch(() => [])
    : [];

  return (
    <ExecucaoAulaClient
      turma={turma}
      beneficiarios={beneficiariosRes.data}
      funcionarios={funcionariosRes.data}
      dataQuery={dataQuery}
      execucaoInicial={execucaoExistente}
      presencasIniciais={presencasIniciais}
    />
  );
}
