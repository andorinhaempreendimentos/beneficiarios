import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { getTurmaById } from "@/lib/mock/turmas";
import { getInscricoesByTurma } from "@/lib/mock/inscricoes";
import { formatarData } from "@/lib/utils";
import type { StatusInscricao } from "@/lib/mock/inscricoes";

const TONE: Record<StatusInscricao, "amber" | "green" | "sky" | "red"> = {
  pendente: "amber",
  aprovada: "green",
  fila_espera: "sky",
  cancelada: "red",
};

const LABEL: Record<StatusInscricao, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  fila_espera: "Fila de espera",
  cancelada: "Cancelada",
};

export default async function TurmaInscricoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const turma = getTurmaById(id);
  if (!turma) notFound();

  const lista = getInscricoesByTurma(id);
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
              {lista.map((i) => (
                <tr key={i.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-800">{i.nomeCompleto}</td>
                  <td className="px-5 py-3 text-zinc-600">{i.celular}</td>
                  <td className="px-5 py-3 text-zinc-600">{i.cpf ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(i.dataInscricao)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={TONE[i.status]}>{LABEL[i.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {i.status === "pendente" && (
                      <>
                        <button type="button" className="text-green-600 hover:underline">Aprovar</button>
                        <span className="mx-1.5 text-zinc-300">|</span>
                        <button type="button" className="text-red-500 hover:underline">Recusar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
