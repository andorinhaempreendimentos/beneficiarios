import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { getObjetoById } from "@/lib/mock/objetos";
import { statusObjetoLabel, statusObjetoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

export default async function DetalhesObjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getObjetoById(id);
  if (!o) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={o.nome}
        description={`Cadastrado em ${formatarData(o.criadoEm)}`}
        actions={<LinkButton href={`/objetos/${o.id}/editar`} variant="outline">Editar</LinkButton>}
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Informações gerais</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">Status</p>
            <Badge tone={statusObjetoTone[o.status]}>{statusObjetoLabel[o.status]}</Badge>
          </div>
          <div>
            <p className="text-zinc-500">Tipo de duração</p>
            <p className="text-zinc-800">{o.tipoDuracao === "pontual" ? "Evento Pontual" : "Evento de Período"}</p>
          </div>
          {o.tipoDuracao === "pontual" && o.dataEvento && (
            <div>
              <p className="text-zinc-500">Data do evento</p>
              <p className="text-zinc-800">{formatarData(o.dataEvento)}</p>
            </div>
          )}
          {o.tipoDuracao === "periodo" && (
            <>
              <div>
                <p className="text-zinc-500">Início</p>
                <p className="text-zinc-800">{formatarData(o.dataInicio ?? "")}</p>
              </div>
              <div>
                <p className="text-zinc-500">Término</p>
                <p className="text-zinc-800">{formatarData(o.dataTermino ?? "")}</p>
              </div>
            </>
          )}
          {o.termoDeFomento && (
            <div>
              <p className="text-zinc-500">Termo de Fomento</p>
              <p className="text-zinc-800">{o.termoDeFomento}</p>
            </div>
          )}
          {o.codigoObjeto && (
            <div>
              <p className="text-zinc-500">Código do Objeto</p>
              <p className="text-zinc-800">{o.codigoObjeto}</p>
            </div>
          )}
          {o.codigoPrograma && (
            <div>
              <p className="text-zinc-500">Código do Programa</p>
              <p className="text-zinc-800">{o.codigoPrograma}</p>
            </div>
          )}
          {o.nomePrograma && (
            <div>
              <p className="text-zinc-500">Nome do Programa</p>
              <p className="text-zinc-800">{o.nomePrograma}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {o.descricao && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Descrição</h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-zinc-700">{o.descricao}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
