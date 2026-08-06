import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { atividadesApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const TURNO_LABEL: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

export default async function DetalhesAtividadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await atividadesApi.get(id).catch(() => null);
  if (!a) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={a.nome}
        description={`Cadastrada em ${formatarData(a.criadoEm)}`}
        actions={<LinkButton href={`/atividades/${a.id}/editar`} variant="outline">Editar</LinkButton>}
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Configurações</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <p className="text-zinc-600">Disponível na pré-inscrição: {a.disponivelPreInscricao ? "Sim" : "Não"}</p>
          <div className="flex items-center gap-1 text-zinc-600">
            Turnos:
            {(a.turnos ?? []).map((t) => (
              <Badge key={t} tone="zinc">{TURNO_LABEL[t] ?? t}</Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Perguntas personalizadas</h3>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {a.perguntas.length === 0 && <p className="text-sm text-zinc-500">Nenhuma pergunta cadastrada.</p>}
          {a.perguntas.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2 text-sm">
              <span className="text-zinc-700">{p.pergunta}</span>
              <Badge tone={p.disponivelInscricao ? "green" : "zinc"}>
                {p.disponivelInscricao ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
