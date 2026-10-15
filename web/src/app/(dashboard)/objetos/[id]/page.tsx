import { notFound } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { objetosApi } from "@/lib/api/services";
import { statusObjetoLabel, statusObjetoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import type { StatusObjeto } from "@/lib/types";

export default async function DetalhesObjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await objetosApi.get(id).catch(() => null);
  if (!o) notFound();

  const tone = statusObjetoTone[o.status as StatusObjeto] ?? "zinc";
  const label = statusObjetoLabel[o.status as StatusObjeto] ?? o.status;

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
            <Badge tone={tone}>{label}</Badge>
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

      {/* Metas Pactuadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Metas Pactuadas no Plano de Trabalho</h3>
          <span className="text-xs text-zinc-500">{o.metas?.length ?? 0} meta(s) pactuada(s)</span>
        </CardHeader>
        <CardBody className="p-0">
          {o.metas && o.metas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5">Dimensão / Entidade</th>
                    <th className="px-4 py-2.5">Indicador / Descrição</th>
                    <th className="px-4 py-2.5">Unidade de Medida</th>
                    <th className="px-4 py-2.5 text-right">Meta Prevista</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {o.metas.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2.5 text-xs font-medium text-zinc-600">
                        {m.entidadeId === "participantes" ? "Beneficiários / Alunos" :
                         m.entidadeId === "locais" ? "Locais / Núcleos / Polos" :
                         m.entidadeId === "sessoes" ? "Sessões / Aulas / Treinos" :
                         m.entidadeId === "turmas" ? "Turmas / Grupos Formados" :
                         m.entidadeId === "frequencia" ? "Frequência e Assiduidade" :
                         m.entidadeId === "vulnerabilidade" ? "Perfil Social / Vulnerabilidade" :
                         m.entidadeId === "eventos" ? "Eventos / Ações Coletivas" :
                         m.entidadeId === "reunioes" ? "Reuniões com Famílias" :
                         m.entidadeId}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-zinc-800 font-medium">
                        {m.titulo}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">
                        {m.unidade}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-zinc-900 text-right">
                        {m.valorEsperado.toLocaleString("pt-BR")}
                        {m.unidade.includes("%") && !String(m.valorEsperado).includes("%") ? "%" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-xs text-zinc-500">
              Nenhuma meta pactuada cadastrada para este objeto.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Cargos e Equipe Prevista */}
      {o.cargosPrevistos && o.cargosPrevistos.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Equipe e Cargos Previstos</h3>
            <span className="text-xs text-zinc-500">{o.cargosPrevistos.length} cargo(s)</span>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5">Função / Cargo</th>
                    <th className="px-4 py-2.5 text-center">Vagas</th>
                    <th className="px-4 py-2.5">Remuneração Mensal</th>
                    <th className="px-4 py-2.5">Carga Horária</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {o.cargosPrevistos.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2.5 text-sm font-medium text-zinc-800">{c.cargoNome}</td>
                      <td className="px-4 py-2.5 text-xs text-center font-semibold text-zinc-700">{c.quantidadePrevista}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600">
                        {c.remuneracaoMensal ? `R$ ${c.remuneracaoMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">{c.cargaHorariaSemanal ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
