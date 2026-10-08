import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InscricaoGrupoPage({
  params,
}: {
  params: Promise<{ grupoId: string }>;
}) {
  const { grupoId } = await params;
  redirect(`/inscricao/turma/${grupoId}`);
}
