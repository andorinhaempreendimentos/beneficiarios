import { turmasApi } from "@/lib/api/services";
import { ChamadaView } from "./ChamadaView";

export default async function ChamadaPage() {
  const turmasRes = await turmasApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return <ChamadaView turmas={turmasRes.data} />;
}
