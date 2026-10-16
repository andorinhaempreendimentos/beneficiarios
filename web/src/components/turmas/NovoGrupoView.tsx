"use client";

import { PageHeader } from "@/components/ui";
import { GrupoForm } from "@/components/turmas/GrupoForm";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import type { NucleoApi, AtividadeApi, FuncionarioApi } from "@/lib/api/services";

export function NovoGrupoView({
  nucleos,
  atividades,
  funcionarios,
  defaultNucleoId,
}: {
  nucleos: NucleoApi[];
  atividades: AtividadeApi[];
  funcionarios: FuncionarioApi[];
  defaultNucleoId?: string;
}) {
  const { t } = useDicionario();
  const termoGrupo = t("turma", "Grupo");
  const termoLocal = t("local", "Núcleo");
  const termoSessao = t("sessao", "Sessões", true);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Novo(a) ${termoGrupo}`}
        description={`Cadastro de ${termoGrupo.toLowerCase()} vinculado(a) a ${termoLocal.toLowerCase()} e grade de ${termoSessao.toLowerCase()}`}
      />
      <GrupoForm
        nucleos={nucleos}
        atividades={atividades}
        funcionarios={funcionarios}
        defaultNucleoId={defaultNucleoId}
        backHref="/turmas"
      />
    </div>
  );
}
