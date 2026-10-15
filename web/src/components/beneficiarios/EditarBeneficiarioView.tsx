"use client";

import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import type { Beneficiario } from "@/lib/types";
import type { NucleoApi, TurmaApi } from "@/lib/api/services";

interface EditarBeneficiarioViewProps {
  beneficiario: Beneficiario;
  nucleos: NucleoApi[];
  turmas: TurmaApi[];
  id: string;
}

export function EditarBeneficiarioView({
  beneficiario,
  nucleos,
  turmas,
  id,
}: EditarBeneficiarioViewProps) {
  const { t } = useDicionario();
  const termoBeneficiario = t("termoBeneficiario", "Beneficiário");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar ${termoBeneficiario}`}
        description={beneficiario.nomeCompleto}
      />
      <BeneficiarioForm
        beneficiario={beneficiario}
        nucleos={nucleos}
        turmas={turmas}
        backHref={`/beneficiarios/${id}`}
      />
    </div>
  );
}
