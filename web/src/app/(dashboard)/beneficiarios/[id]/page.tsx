import { notFound } from "next/navigation";
import { Mail, MapPin, Phone, User } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { beneficiariosApi, nucleosApi, inscricoesApi, turmasApi } from "@/lib/api/services";
import {
  statusBeneficiarioTone,
  statusBeneficiarioLabel,
  normalizarStatusBeneficiario,
  statusInscricaoTone,
  statusInscricaoLabel,
} from "@/lib/status";
import { calcularIdade, formatarData } from "@/lib/utils";
import type { StatusInscricao } from "@/lib/types";

export default async function DetalhesBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await beneficiariosApi.get(id).catch(() => null);
  if (!b) notFound();

  const nucleo = b.nucleoId ? await nucleosApi.get(b.nucleoId).catch(() => null) : null;
  const inscricoesRes = await inscricoesApi.list({ beneficiarioId: b.id, limit: 100 }).catch(() => ({ data: [] }));
  const inscricoes = inscricoesRes.data;

  const statusNorm = normalizarStatusBeneficiario(b.status);
  const tone = statusBeneficiarioTone[statusNorm];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={b.nomeCompleto}
        description={`Matrícula ${b.matricula ?? b.id.substring(0, 8)}`}
        actions={<LinkButton href={`/beneficiarios/${b.id}/editar`} variant="outline">Editar</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <User className="h-6 w-6 text-zinc-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-900">{b.nomeCompleto}</p>
              <p className="text-sm text-zinc-500">{calcularIdade(b.dataNascimento)} anos - {formatarData(b.dataNascimento)}</p>
            </div>
            <Badge tone={tone}>{statusBeneficiarioLabel[statusNorm]}</Badge>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-zinc-600">
              <Phone className="h-4 w-4 text-zinc-400" /> {b.celular ?? "-"}
            </div>
            <div className="flex items-center gap-2 text-zinc-600">
              <Mail className="h-4 w-4 text-zinc-400" /> "-"
            </div>
            <div className="flex items-center gap-2 text-zinc-600 sm:col-span-2">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {b.logradouro ? `${b.logradouro}, ${b.numero ?? 'S/N'} - ${b.bairro ?? ''}, ${b.cidade ?? ''}/${b.estado ?? ''}` : "Endereço não informado"}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Núcleo</h3>
          </CardHeader>
          <CardBody className="text-sm text-zinc-600">
            {nucleo ? nucleo.identificacao : "Sem núcleo definido"}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Turmas vinculadas</h3>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {inscricoes.length === 0 && <p className="text-sm text-zinc-500">Nenhuma turma vinculada.</p>}
          {inscricoes.map((ins) => (
            <div key={ins.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2 text-sm">
              <span className="font-medium text-zinc-800">{ins.turma?.nome ?? ins.turmaId}</span>
              <Badge tone={statusInscricaoTone[ins.status as StatusInscricao] ?? "zinc"}>
                {statusInscricaoLabel[ins.status as StatusInscricao] ?? ins.status}
              </Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
