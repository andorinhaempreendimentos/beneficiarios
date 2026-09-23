import { nucleosApi, atividadesApi, categoriaTurmasApi } from "@/lib/api/services";
import { GradePoloClient } from "@/components/polo/GradePoloClient";

export default async function GradeSemanalPage() {
  const [nucleosRes, atividadesRes, categoriasRes] = await Promise.all([
    nucleosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    categoriaTurmasApi.list({ limit: 50 }).catch(() => ({ data: [] })),
  ]);

  return (
    <GradePoloClient
      nucleos={nucleosRes.data}
      atividades={atividadesRes.data}
      categorias={categoriasRes.data}
    />
  );
}
