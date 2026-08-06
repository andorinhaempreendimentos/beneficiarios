import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { turmasApi, nucleosApi, atividadesApi, inscricoesApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

export default async function DetalhesTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await turmasApi.get(id).catch(() => null);
  if (!t) notFound();

  const [nucleo, atividade, inscricoesRes] = await Promise.all([
    t.nucleoId ? nucleosApi.get(t.nucleoId).catch(() => null) : null,
    t.atividadeId ? atividadesApi.get(t.atividadeId).catch(() => null) : null,
    inscricoesApi.list({ turmaId: t.id, limit: 200 }).catch(() => ({ total: 0 })),
  ]);

  const qtdOcupadas = inscricoesRes.total;
  const vagasLivres = Math.max(0, t.vagasTotais - qtdOcupadas);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.nome}
        description={t.dataInicio ? `Início: ${formatarData(t.dataInicio)}` : "Sem data de início"}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href={`/turmas/${t.id}/inscricoes`} variant="outline">Inscrições</LinkButton>
            <LinkButton href={`/turmas/${t.id}/presenca`} variant="outline">Lista de presença</LinkButton>
            <LinkButton href={`/turmas/${t.id}/editar`} variant="outline">Editar</LinkButton>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Informações gerais</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">Núcleo</p>
            <p className="text-zinc-800">{nucleo?.identificacao ?? "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500">Atividade</p>
            <p className="text-zinc-800">{atividade?.nome ?? "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500">Exclusiva</p>
            <Badge tone={t.exclusiva ? "amber" : "zinc"}>{t.exclusiva ? "Sim" : "Não"}</Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Vagas e responsáveis</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">Vagas totais</p>
            <p className="text-zinc-800">{t.vagasTotais}</p>
          </div>
          <div>
            <p className="text-zinc-500">Beneficiários matriculados</p>
            <p className="text-zinc-800">{qtdOcupadas}</p>
          </div>
          <div>
            <p className="text-zinc-500">Vagas disponíveis</p>
            <Badge tone={vagasLivres > 0 ? "green" : "red"}>{vagasLivres}</Badge>
          </div>
          <div>
            <p className="text-zinc-500">Responsável(is)</p>
            <p className="text-zinc-800">{(t.responsaveis ?? []).join(", ") || "-"}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
