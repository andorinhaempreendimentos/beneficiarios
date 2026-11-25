import { notFound } from "next/navigation";
import { areaProfessorApi, turmasApi, beneficiariosApi, funcionariosApi, execucoesSessaoApi } from "@/lib/api/services";
import { ExecucaoSessaoClient } from "@/components/professor/ExecucaoSessaoClient";
import { getDataHojeBrasil } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

interface AulaTurmaPageProps {
  params: Promise<{ turmaId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AulaTurmaPage({ params, searchParams }: AulaTurmaPageProps) {
  const { turmaId } = await params;
  const sp = await searchParams;
  const dataQuery = (typeof sp?.data === "string" ? sp.data : undefined) || getDataHojeBrasil();

  const [turma, slotsAdicionais] = await Promise.all([
    turmasApi.get(turmaId).catch(() => null),
    areaProfessorApi.getHorariosAdicionaisTurma(turmaId).catch(() => []),
  ]);
  if (!turma) {
    notFound();
  }

  if (slotsAdicionais.length > 0) {
    const existentes = turma.slots ?? [];
    const idsExistentes = new Set(existentes.map((s) => s.id).filter(Boolean));
    turma.slots = [
      ...existentes,
      ...slotsAdicionais.filter((s) => !s.id || !idsExistentes.has(s.id)),
    ];
  }

  const nucleoId = turma.nucleoId || turma.nucleo?.id;

  const [beneficiariosRes, beneficiariosPolo, funcionariosRes, execucaoExistente] = await Promise.all([
    beneficiariosApi.list({ turmaId, limit: 200 }).catch(() => ({ data: [] })),
    nucleoId
      ? beneficiariosApi.listAll({ nucleoId }).catch(() => [])
      : Promise.resolve([]),
    funcionariosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
    execucoesSessaoApi.getExecucao(turmaId, dataQuery).catch(() => null),
  ]);

  const presencasIniciais = execucaoExistente
    ? await execucoesSessaoApi.getPresencas(execucaoExistente.id).catch(() => [])
    : [];

  const autoStart = sp?.autoStart === "true";

  return (
    <ExecucaoSessaoClient
      turma={turma}
      beneficiarios={beneficiariosRes.data}
      beneficiariosPolo={beneficiariosPolo}
      funcionarios={funcionariosRes.data}
      dataQuery={dataQuery}
      execucaoInicial={execucaoExistente}
      presencasIniciais={presencasIniciais}
      autoStart={autoStart}
    />
  );
}
