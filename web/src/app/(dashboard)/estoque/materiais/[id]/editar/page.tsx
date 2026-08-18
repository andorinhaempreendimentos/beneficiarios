"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@/lib/hooks/useQuery";
import { materiaisApi } from "@/lib/api/services";
import { MaterialForm } from "@/components/estoque/MaterialForm";
import { PageHeader } from "@/components/ui";

export default function EditarMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const { data: material, loading } = useQuery(
    () => materiaisApi.get(id),
    [id],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader title="Editar Material" description="Carregando…" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader title="Material não encontrado" description="" />
      </div>
    );
  }

  return <MaterialForm material={material} />;
}
