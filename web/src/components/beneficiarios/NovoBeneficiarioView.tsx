"use client";

import { PageHeader } from "@/components/ui";
import { BeneficiarioForm } from "@/components/beneficiarios/BeneficiarioForm";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import type { NucleoApi, TurmaApi } from "@/lib/api/services";

interface NovoBeneficiarioViewProps {
  nucleos: NucleoApi[];
  turmas: TurmaApi[];
}

export function NovoBeneficiarioView({ nucleos, turmas }: NovoBeneficiarioViewProps) {
  const { t } = useDicionario();
  const termoBeneficiario = t("termoBeneficiario", "Beneficiário");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Novo(a) ${termoBeneficiario}`}
        description={`Cadastro de ${termoBeneficiario.toLowerCase()}`}
      />
      <BeneficiarioForm
        nucleos={nucleos}
        turmas={turmas}
        backHref="/beneficiarios"
      />
    </div>
  );
}
