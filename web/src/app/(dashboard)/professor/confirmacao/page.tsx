import { funcionariosApi, turmasApi, nucleosApi } from "@/lib/api/services";
import { ConfirmacaoView } from "./ConfirmacaoView";

export default async function ConfirmacaoPage() {
  const funcionarios = await funcionariosApi.list({ limit: 100 }).catch(() => ({ data: [] }));
  const professor = funcionarios.data.find((f) => f.professorResponsavel) || funcionarios.data[0];

  return <ConfirmacaoView professor={professor} />;
}
