import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { getEquipamentoById } from "@/lib/mock/equipamentos";
import { nucleos } from "@/lib/mock/nucleos";
import { objetos } from "@/lib/mock/objetos";
import { conservacaoLabel, conservacaoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import { FotosRecebimento } from "@/components/equipamentos/FotosRecebimento";

export default async function DetalhesEquipamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = getEquipamentoById(id);
  if (!e) notFound();

  const nucleo = e.nucleoId ? nucleos.find((n) => n.id === e.nucleoId) : null;
  const objeto = e.objetoId ? objetos.find((o) => o.id === e.objetoId) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={e.nome}
        description={`Cadastrado em ${formatarData(e.criadoEm)}`}
        actions={<LinkButton href={`/equipamentos/${e.id}/editar`} variant="outline">Editar</LinkButton>}
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Informações gerais</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">Categoria</p>
            <p className="text-zinc-800">{e.categoria}</p>
          </div>
          <div>
            <p className="text-zinc-500">Quantidade</p>
            <p className="text-zinc-800">{e.quantidade}</p>
          </div>
          <div>
            <p className="text-zinc-500">Conservação</p>
            <Badge tone={conservacaoTone[e.conservacao]}>{conservacaoLabel[e.conservacao]}</Badge>
          </div>
          {nucleo && (
            <div>
              <p className="text-zinc-500">Núcleo</p>
              <p className="text-zinc-800">{nucleo.identificacao}</p>
            </div>
          )}
          {objeto && (
            <div>
              <p className="text-zinc-500">Objeto vinculado</p>
              <p className="text-zinc-800">{objeto.nome}</p>
            </div>
          )}
          {e.valorUnitario != null && (
            <div>
              <p className="text-zinc-500">Valor unitário</p>
              <p className="text-zinc-800">R$ {e.valorUnitario.toFixed(2).replace(".", ",")}</p>
            </div>
          )}
          {e.notaFiscal && (
            <div>
              <p className="text-zinc-500">Nota Fiscal</p>
              <p className="text-zinc-800">{e.notaFiscal}</p>
            </div>
          )}
          {e.dataAquisicao && (
            <div>
              <p className="text-zinc-500">Data de aquisição</p>
              <p className="text-zinc-800">{formatarData(e.dataAquisicao)}</p>
            </div>
          )}
          {e.observacao && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-zinc-500">Observação</p>
              <p className="text-zinc-800">{e.observacao}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <FotosRecebimento />
    </div>
  );
}
