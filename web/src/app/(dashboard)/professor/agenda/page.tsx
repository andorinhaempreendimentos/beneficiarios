import { turmasApi } from "@/lib/api/services";
import { AgendaView } from "./AgendaView";

export default async function AgendaPage() {
  const turmasRes = await turmasApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  return <AgendaView turmas={turmasRes.data} />;
}
