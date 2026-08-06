import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { equipamentosApi, nucleosApi, objetosApi } from "@/lib/api/services";
import { conservacaoLabel, conservacaoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import { FotosRecebimento } from "@/components/equipamentos/FotosRecebimento";
import type { ConservacaoEquipamento } from "@/lib/types";

export default async function DetalhesEquipamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await equipamentosApi.get(id).catch(() => null);
  if (!e) notFound();

  const nucleo = e.nucleoId ? await nucleosApi.get(e.nucleoId).catch(() => null) : null;
  const objeto = e.objetoId ? await objetosApi.get(e.objetoId).catch(() => null) : null;
  const tone = conservacaoTone[e.conservacao as ConservacaoEquipamento] ?? "zinc";
  const label = conservacaoLabel[e.conservacao as ConservacaoEquipamento] ?? e.conservacao;

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
            <Badge tone={tone}>{label}</Badge>
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
