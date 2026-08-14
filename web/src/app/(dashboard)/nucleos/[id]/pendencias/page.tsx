import { notFound } from "next/navigation";
import { nucleosApi, execucoesAulaApi, turmasApi, funcionariosApi } from "@/lib/api/services";
import { AprovacaoPendenciasManager } from "@/components/nucleos/AprovacaoPendenciasManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const nucleo = await nucleosApi.get(id).catch(() => null);
  return {
    title: nucleo ? `Pendências - ${nucleo.identificacao} | Andorinha` : "Pendências | Andorinha",
  };
}

export default async function PendenciasNucleoPage({ params }: PageProps) {
  const { id } = await params;
  const nucleo = await nucleosApi.get(id).catch(() => null);

  if (!nucleo) {
    notFound();
  }

  const [pendencias, turmasRes, funcionariosRes] = await Promise.all([
    execucoesAulaApi.listPendencias({ nucleoId: id }).catch(() => []),
    turmasApi.list({ nucleoId: id, limit: 100 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
  ]);

  return (
    <AprovacaoPendenciasManager
      nucleo={nucleo}
      pendenciasIniciais={pendencias}
      turmas={turmasRes.data}
      funcionarios={funcionariosRes.data}
    />
  );
}
