"use client";

import { Badge, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { GestaoMatriculasRoster } from "@/components/turmas/GestaoMatriculasRoster";
import { formatarData, formatarNomeGrupo } from "@/lib/utils";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import type { TurmaApi, NucleoApi, AtividadeApi, BeneficiarioApi } from "@/lib/api/services";

interface DetalhesTurmaViewProps {
  turma: TurmaApi;
  nucleo: NucleoApi | null;
  atividade: AtividadeApi | null;
  matriculados: BeneficiarioApi[];
  qtdOcupadas: number;
  outrasTurmas: TurmaApi[];
  todosBeneficiarios: BeneficiarioApi[];
}

export function DetalhesTurmaView({
  turma,
  nucleo,
  atividade,
  matriculados,
  qtdOcupadas,
  outrasTurmas,
  todosBeneficiarios,
}: DetalhesTurmaViewProps) {
  const { t } = useDicionario();

  const termoGrupo = t("turma", "Grupo", false, atividade);
  const termoResponsavel = t("instrutor", "Responsável", false, atividade);
  const termoResponsavelPlural = t("instrutor", "Responsáveis", true, atividade);
  const termoParticipantePlural = t("beneficiario", "Beneficiários", true, atividade);
  const termoLocal = t("local", "Núcleo");
  const termoAtividade = t("atividade", "Atividade");
  const nomeAdaptado = formatarNomeGrupo(turma.nome, termoGrupo);

  const usoInterno = turma.tipo === "operacional" || (atividade?.usoInterno ?? false);
  const vagasLivres = Math.max(0, turma.vagasTotais - qtdOcupadas);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={nomeAdaptado}
        description={turma.dataInicio ? `Início: ${formatarData(turma.dataInicio)}` : "Sem data de início"}
        actions={
          <div className="flex items-center gap-2">
            {!usoInterno && (
              <>
                <LinkButton href={`/turmas/${turma.id}/inscricoes`} variant="outline">
                  Inscrições
                </LinkButton>
                <LinkButton href={`/turmas/${turma.id}/presenca`} variant="outline">
                  Lista de presença
                </LinkButton>
              </>
            )}
            <LinkButton href={`/turmas/${turma.id}/editar`} variant="outline">
              Editar
            </LinkButton>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Informações gerais</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">{termoLocal}</p>
            <p className="text-zinc-800">{nucleo?.identificacao ?? "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500">{termoAtividade}</p>
            <p className="text-zinc-800">
              {atividade?.nome ?? "—"}
              {usoInterno && <span className="ml-2 text-xs text-zinc-400">(uso interno)</span>}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Tipo</p>
            <Badge tone={turma.tipo === "operacional" ? "zinc" : "sky"}>
              {turma.tipo === "operacional" ? "Operacional" : "Regular"}
            </Badge>
          </div>
          {turma.tipo !== "operacional" && (turma.idadeMinima != null || turma.idadeMaxima != null) && (
            <div>
              <p className="text-zinc-500">Idade Permitida</p>
              <p className="text-zinc-800">
                {turma.idadeMinima} a {turma.idadeMaxima} anos
              </p>
            </div>
          )}
          <div>
            <p className="text-zinc-500">Exclusiva</p>
            <Badge tone={turma.exclusiva ? "amber" : "zinc"}>{turma.exclusiva ? "Sim" : "Não"}</Badge>
          </div>
        </CardBody>
      </Card>

      {!usoInterno && (
        <>
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-zinc-700">
                Vagas e {termoResponsavelPlural.toLowerCase()}
              </h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-zinc-500">Vagas totais</p>
                <p className="text-zinc-800">{turma.vagasTotais}</p>
              </div>
              <div>
                <p className="text-zinc-500">{termoParticipantePlural} matriculados</p>
                <p className="text-zinc-800">{qtdOcupadas}</p>
              </div>
              <div>
                <p className="text-zinc-500">Vagas disponíveis</p>
                <Badge tone={vagasLivres > 0 ? "green" : "red"}>{vagasLivres}</Badge>
              </div>
              <div>
                <p className="text-zinc-500">{termoResponsavelPlural}</p>
                <p className="text-zinc-800">
                  {turma.responsaveisNomes && turma.responsaveisNomes.length > 0
                    ? turma.responsaveisNomes.join(", ")
                    : (turma.responsaveis ?? []).join(", ") || "-"}
                </p>
              </div>
            </CardBody>
          </Card>

          <GestaoMatriculasRoster
            turmaAtual={turma}
            matriculadosIniciais={matriculados}
            outrasTurmas={outrasTurmas}
            todosBeneficiarios={todosBeneficiarios}
          />
        </>
      )}

      {usoInterno && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">{termoResponsavelPlural}</h3>
          </CardHeader>
          <CardBody className="text-sm">
            <p className="text-zinc-800">
              {turma.responsaveisNomes && turma.responsaveisNomes.length > 0
                ? turma.responsaveisNomes.join(", ")
                : (turma.responsaveis ?? []).join(", ") || "-"}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
