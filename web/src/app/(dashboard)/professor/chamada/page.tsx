import { turmasApi, funcionariosApi } from "@/lib/api/services";
import { ChamadaView } from "./ChamadaView";

export default async function ChamadaPage() {
  const [turmasRes, funcionariosRes] = await Promise.all([
    turmasApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    funcionariosApi.list({ limit: 200 }).catch(() => ({ data: [] })),
  ]);

  return <ChamadaView turmas={turmasRes.data} funcionarios={funcionariosRes.data} />;
}
