import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { getOrganizacaoById } from "@/lib/mock/organizacoes";
import { objetos } from "@/lib/mock/objetos";
import { statusOrganizacaoLabel, statusOrganizacaoTone } from "@/lib/status";
import { formatarData, formatarTelefone } from "@/lib/utils";

export default async function DetalhesOrganizacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOrganizacaoById(id);
  if (!o) notFound();

  const objeto = o.objetoId ? objetos.find((ob) => ob.id === o.objetoId) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={o.nome}
        description={`Cadastrada em ${formatarData(o.criadoEm)}`}
        actions={<LinkButton href={`/organizacoes/${o.id}/editar`} variant="outline">Editar</LinkButton>}
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Informações gerais</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">Status</p>
            <Badge tone={statusOrganizacaoTone[o.status]}>{statusOrganizacaoLabel[o.status]}</Badge>
          </div>
          <div>
            <p className="text-zinc-500">Tipo</p>
            <p className="text-zinc-800">{o.tipo}</p>
          </div>
          {o.cnpj && (
            <div>
              <p className="text-zinc-500">CNPJ</p>
              <p className="text-zinc-800">{o.cnpj}</p>
            </div>
          )}
          {o.nomeResponsavel && (
            <div>
              <p className="text-zinc-500">Responsável</p>
              <p className="text-zinc-800">{o.nomeResponsavel}</p>
            </div>
          )}
          {o.telefone && (
            <div>
              <p className="text-zinc-500">Telefone</p>
              <p className="text-zinc-800">{formatarTelefone(o.telefone)}</p>
            </div>
          )}
          {o.email && (
            <div>
              <p className="text-zinc-500">Email</p>
              <p className="text-zinc-800">{o.email}</p>
            </div>
          )}
          {objeto && (
            <div>
              <p className="text-zinc-500">Objeto vinculado</p>
              <p className="text-zinc-800">{objeto.nome}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {(o.endereco || o.cidade) && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Endereço</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {o.endereco && (
              <div>
                <p className="text-zinc-500">Logradouro</p>
                <p className="text-zinc-800">{o.endereco}</p>
              </div>
            )}
            {o.cep && (
              <div>
                <p className="text-zinc-500">CEP</p>
                <p className="text-zinc-800">{o.cep}</p>
              </div>
            )}
            {o.cidade && (
              <div>
                <p className="text-zinc-500">Cidade</p>
                <p className="text-zinc-800">{o.cidade}</p>
              </div>
            )}
            {o.estado && (
              <div>
                <p className="text-zinc-500">Estado</p>
                <p className="text-zinc-800">{o.estado}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
