import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, MapPin, Phone, User, Calendar, Shield, Dumbbell, Building2, ChevronRight } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { beneficiariosApi, nucleosApi, inscricoesApi } from "@/lib/api/services";
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

  const nucleoNomeFinal = nucleo?.identificacao || b.nucleoNome || b.turmasInfo?.[0]?.nucleoNome || "Sem núcleo definido";

  // Agrupa todas as turmas vinculadas via beneficiario_turmas e via inscricoes
  const turmasDiretas = b.turmasInfo ?? [];
  const temAlgumaTurma = turmasDiretas.length > 0 || inscricoes.length > 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={b.nomeCompleto}
        description={`Matrícula ${b.matricula ?? b.id.substring(0, 8)}`}
        actions={
          <LinkButton href={`/beneficiarios/${b.id}/editar`} variant="primary" className="cursor-pointer">
            Editar Beneficiário
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card Principal: Dados Pessoais & Contato */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-lg">
                {b.nomeCompleto.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-base">{b.nomeCompleto}</p>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{calcularIdade(b.dataNascimento)} anos ({formatarData(b.dataNascimento)})</span>
                </p>
              </div>
            </div>
            <Badge tone={tone}>{statusBeneficiarioLabel[statusNorm]}</Badge>
          </CardHeader>

          <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 pt-4">
            <div className="flex items-center gap-2.5 text-zinc-700 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
              <Phone className="h-4 w-4 text-sky-600 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Celular</span>
                <span className="font-medium text-xs">{b.celular ?? "Não informado"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-zinc-700 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
              <Shield className="h-4 w-4 text-sky-600 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">CPF</span>
                <span className="font-medium text-xs">{b.cpf ?? "Não informado"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-zinc-700 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100 sm:col-span-2">
              <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Endereço</span>
                <span className="font-medium text-xs">
                  {b.logradouro
                    ? `${b.logradouro}, ${b.numero ?? "S/N"} - ${b.bairro ?? ""}, ${b.cidade ?? ""}/${b.estado ?? ""}`
                    : "Endereço não informado"}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card Núcleo Esportivo */}
        <Card className="shadow-xs flex flex-col justify-between">
          <CardHeader className="border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-600" />
              <span>Núcleo Esportivo</span>
            </h3>
          </CardHeader>
          <CardBody className="py-4">
            <div className="rounded-xl bg-violet-50/60 p-4 border border-violet-100 text-center">
              <span className="rounded-md bg-violet-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800 inline-block mb-1">
                Polo Atual
              </span>
              <p className="font-bold text-violet-950 text-base">{nucleoNomeFinal}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Card Turmas e Atividades Vinculadas */}
      <Card className="shadow-xs">
        <CardHeader className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-sky-600" />
            <span>Turmas e Atividades Atribuídas</span>
          </h3>
          <span className="text-xs font-semibold text-zinc-400">
            {turmasDiretas.length + inscricoes.length} vínculo(s)
          </span>
        </CardHeader>

        <CardBody className="flex flex-col gap-3 pt-4">
          {!temAlgumaTurma && (
            <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400">
              Nenhuma turma atribuída a este beneficiário no momento.
            </div>
          )}

          {/* Exibe vínculos diretos (beneficiario_turmas) */}
          {turmasDiretas.map((t, idx) => (
            <div
              key={`direta-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/30 p-3.5 transition-all hover:border-sky-200"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.nucleoNome && (
                    <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800">
                      {t.nucleoNome}
                    </span>
                  )}
                  {t.atividadeNome && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      {t.atividadeNome}
                    </span>
                  )}
                </div>
                <p className="font-bold text-zinc-900 text-sm">{t.turmaNome || "Turma Esportiva"}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="sky">Matriculado (Ativo)</Badge>
                {t.turmaId && (
                  <Link
                    href={`/turmas`}
                    className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    <span>Ver turma</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Exibe inscrições de turmas */}
          {inscricoes.map((ins) => (
            <div
              key={`inscricao-${ins.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition-all hover:border-zinc-300"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Inscrição
                  </span>
                  {ins.turma?.atividade?.nome && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      {ins.turma.atividade.nome}
                    </span>
                  )}
                </div>
                <p className="font-bold text-zinc-900 text-sm">{ins.turma?.nome ?? ins.turmaId}</p>
              </div>

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
