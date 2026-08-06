import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { funcionariosApi, nucleosApi } from "@/lib/api/services";
import { statusFuncionarioLabel, statusFuncionarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";
import type { StatusFuncionario } from "@/lib/types";

export default async function DetalhesFuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await funcionariosApi.get(id).catch(() => null);
  if (!f) notFound();

  const nucleo = f.nucleoId ? await nucleosApi.get(f.nucleoId).catch(() => null) : null;
  const tone = statusFuncionarioTone[f.status as StatusFuncionario] ?? "zinc";
  const label = statusFuncionarioLabel[f.status as StatusFuncionario] ?? f.status;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={f.nomeCompleto}
        description={`Matrícula ${f.matricula ?? f.id.substring(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href={`/funcionarios/${f.id}/ponto`} variant="outline">Folha de ponto</LinkButton>
            <LinkButton href={`/funcionarios/${f.id}/editar`} variant="outline">Editar</LinkButton>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <User className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <p className="font-medium text-zinc-900">{f.nomeCompleto}</p>
            <p className="text-sm text-zinc-500">{f.funcao}</p>
          </div>
          <Badge tone={tone}>{label}</Badge>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <p className="text-zinc-600">CPF: {f.cpf ?? "-"}</p>
          <p className="text-zinc-600">Admissão: {f.dataAdmissao ? formatarData(f.dataAdmissao) : "-"}</p>
          <p className="text-zinc-600">Alocado em: {nucleo ? nucleo.identificacao : "Não alocado"}</p>
          <p className="text-zinc-600">Celular: {f.celular ?? "-"}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Jornada de trabalho</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {(f.jornada ?? []).map((d) => (
            <div key={d.dia} className="rounded-lg border border-zinc-100 px-3 py-2">
              <p className="font-medium text-zinc-700">{d.dia}</p>
              <p className="text-zinc-500">{d.trabalha ? `${d.entrada} - ${d.saida}` : "Não trabalha"}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
