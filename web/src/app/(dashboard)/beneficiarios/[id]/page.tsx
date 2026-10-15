import { notFound } from "next/navigation";
import { DetalhesBeneficiarioView } from "@/components/beneficiarios/DetalhesBeneficiarioView";
import { beneficiariosApi, nucleosApi, inscricoesApi } from "@/lib/api/services";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DetalhesBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await beneficiariosApi.get(id).catch(() => null);
  if (!b) notFound();

  const nucleo = b.nucleoId ? await nucleosApi.get(b.nucleoId).catch(() => null) : null;
  const inscricoesRes = await inscricoesApi.list({ beneficiarioId: b.id, limit: 100 }).catch(() => ({ data: [] }));
  const inscricoes = inscricoesRes.data;

  const nucleoNomeFinal = nucleo?.identificacao || b.nucleoNome || b.turmasInfo?.[0]?.nucleoNome || "Sem núcleo definido";
  const turmasDiretas = b.turmasInfo ?? [];

  return (
    <DetalhesBeneficiarioView
      beneficiario={b}
      nucleoNomeFinal={nucleoNomeFinal}
      turmasDiretas={turmasDiretas}
      inscricoes={inscricoes}
    />
  );
}
