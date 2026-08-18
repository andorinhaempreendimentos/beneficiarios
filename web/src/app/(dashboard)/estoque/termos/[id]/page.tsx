"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { termosEntregaApi, type TermoEntregaApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  pendente: "Pendente", entregue: "Entregue", devolvido: "Devolvido", atrasado: "Atrasado",
};
const statusTone: Record<string, "amber" | "sky" | "green" | "red"> = {
  pendente: "amber", entregue: "sky", devolvido: "green", atrasado: "red",
};

export default function DetalheTermoPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [devolvendo, setDevolvendo] = useState(false);

  const { data: termo, loading, refetch } = useQuery<TermoEntregaApi>(
    () => termosEntregaApi.get(id),
    [id],
  );

  async function devolver() {
    if (!confirm("Registrar devolução deste termo?")) return;
    setDevolvendo(true);
    try {
      await termosEntregaApi.devolver(id);
      toast.success("Devolução registrada.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar devolução.");
    } finally {
      setDevolvendo(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-zinc-400">Carregando…</div>;
  if (!termo) return <div className="py-16 text-center text-sm text-zinc-400">Termo não encontrado.</div>;

  const podeDevolver = termo.status === "entregue" || termo.status === "atrasado";

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Termo de Entrega"
        description={`Entrega em ${formatarData(termo.dataEntrega)}`}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/estoque/termos" variant="secondary">Voltar</LinkButton>
            {podeDevolver && (
              <button
                type="button"
                onClick={devolver}
                disabled={devolvendo}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {devolvendo ? "Registrando…" : "Registrar devolução"}
              </button>
            )}
          </div>
        }
      />

      <Card>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Status</p>
            <Badge tone={statusTone[termo.status] ?? "zinc"}>{statusLabel[termo.status] ?? termo.status}</Badge>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Tipo de recebedor</p>
            <p className="font-medium text-zinc-800 capitalize">{termo.recebedorTipo}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Data de entrega</p>
            <p className="font-medium text-zinc-800">{formatarData(termo.dataEntrega)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Devolução prevista</p>
            <p className="font-medium text-zinc-800">
              {termo.dataDevolucaoPrev ? formatarData(termo.dataDevolucaoPrev) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Devolução realizada</p>
            <p className={`font-medium ${termo.dataDevolucaoReal ? "text-green-700" : "text-zinc-400"}`}>
              {termo.dataDevolucaoReal ? formatarData(termo.dataDevolucaoReal) : "—"}
            </p>
          </div>
          {termo.observacoes && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs text-zinc-400 mb-1">Observações</p>
              <p className="text-zinc-700">{termo.observacoes}</p>
            </div>
          )}
          {termo.assinaturaUrl && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs text-zinc-400 mb-2">Assinatura</p>
              <img
                src={termo.assinaturaUrl}
                alt="Assinatura"
                className="max-h-32 rounded-lg border border-zinc-200"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
