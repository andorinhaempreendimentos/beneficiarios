import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { turmasApi, inscricoesApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { statusInscricaoTone, statusInscricaoLabel } from "@/lib/status";
import type { StatusInscricao } from "@/lib/types";


export default async function TurmaInscricoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const turma = await turmasApi.get(id).catch(() => null);
  if (!turma) notFound();

  const inscricoesRes = await inscricoesApi.list({ turmaId: id, limit: 200 }).catch(() => ({ data: [] }));
  const lista = inscricoesRes.data;
  const pendentes = lista.filter((i) => i.status === "pendente").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Inscrições — ${turma.nome}`}
        description={`${lista.length} inscrição(ões) recebida(s) · ${pendentes} pendente(s)`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/inscricao/turma/${turma.id}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver link público
            </Link>
            <LinkButton href={`/turmas/${turma.id}`} variant="outline">
              Voltar à turma
            </LinkButton>
          </div>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Celular</th>
                <th className="px-5 py-3">CPF</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                    Nenhuma inscrição recebida para esta turma.
                  </td>
                </tr>
              )}
              {lista.map((i) => {
                const tone = statusInscricaoTone[i.status as StatusInscricao] ?? "zinc";
                return (
                  <tr key={i.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-800">{i.beneficiario?.nomeCompleto ?? i.beneficiarioId.substring(0, 8)}</td>
                    <td className="px-5 py-3 text-zinc-600">{i.beneficiario?.celular ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{i.beneficiario?.cpf ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{formatarData(i.criadoEm)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={tone}>{statusInscricaoLabel[i.status as StatusInscricao] ?? i.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/beneficiarios/${i.beneficiarioId}`} className="text-sky-600 hover:underline">Ver aluno</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
