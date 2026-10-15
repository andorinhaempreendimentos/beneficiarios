import { NovoBeneficiarioView } from "@/components/beneficiarios/NovoBeneficiarioView";
import { nucleosApi, turmasApi } from "@/lib/api/services";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NovoBeneficiarioPage() {
  const [nucleosRes, turmasRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    turmasApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  return (
    <NovoBeneficiarioView
      nucleos={nucleosRes.data}
      turmas={turmasRes.data}
    />
  );
}
