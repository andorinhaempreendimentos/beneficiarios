"use client";

import { PageHeader } from "@/components/ui";
import { GrupoForm } from "@/components/turmas/GrupoForm";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import { formatarNomeGrupo } from "@/lib/utils";
import type { TurmaApi, NucleoApi, AtividadeApi, FuncionarioApi } from "@/lib/api/services";

export function EditarGrupoView({
  turma,
  nucleos,
  atividades,
  funcionarios,
}: {
  turma: TurmaApi;
  nucleos: NucleoApi[];
  atividades: AtividadeApi[];
  funcionarios: FuncionarioApi[];
}) {
  const { t } = useDicionario();
  const atividade = atividades.find((a) => a.id === turma.atividadeId);
  const termoGrupo = t("turma", "Grupo", false, atividade);
  const nomeAdaptado = formatarNomeGrupo(turma.nome, termoGrupo);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Editar ${termoGrupo}`} description={nomeAdaptado} />
      <GrupoForm
        turma={turma}
        nucleos={nucleos}
        atividades={atividades}
        funcionarios={funcionarios}
        backHref={`/turmas/${turma.id}`}
      />
    </div>
  );
}
