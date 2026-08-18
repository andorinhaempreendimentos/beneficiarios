"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { pendenciasGeraisApi, type PendenciaGeralApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

export default function DetalhesPendenciaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [resolvendoForm, setResolvendoForm] = useState(false);
  const [providencias, setProvidencias] = useState("");
  const [obsResolucao, setObsResolucao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: p, loading, refetch } = useQuery<PendenciaGeralApi>(
    () => pendenciasGeraisApi.get(id),
    [id],
  );

  async function resolver() {
    if (!providencias.trim()) { toast.error("Descreva as providências tomadas."); return; }
    setSalvando(true);
    try {
      // TODO: pegar usuário logado via session
      await pendenciasGeraisApi.resolver(id, {
        providencias: providencias.trim(),
        resolvidoPorId: p!.createdById, // fallback temporário
        observacoesResolucao: obsResolucao.trim() || undefined,
      });
      toast.success("Pendência resolvida.");
      setResolvendoForm(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao resolver.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-zinc-400">Carregando…</div>;
  if (!p) return <div className="py-16 text-center text-sm text-zinc-400">Pendência não encontrada.</div>;

  const gravidadeCor: Record<string, string> = {
    baixa: "text-zinc-600", media: "text-amber-600", alta: "text-orange-600", critica: "text-red-600",
  };
  const statusCor: Record<string, string> = {
    aberta: "text-red-600", em_andamento: "text-sky-600", resolvida: "text-green-600", cancelada: "text-zinc-400",
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={p.titulo}
        description={`Pendência · ${p.nucleo?.identificacao ?? ""}`}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/pendencias-gerais" variant="secondary">Voltar</LinkButton>
            {p.status !== "resolvida" && p.status !== "cancelada" && (
              <button
                type="button"
                onClick={() => setResolvendoForm(true)}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors cursor-pointer"
              >
                Marcar como resolvida
              </button>
            )}
          </div>
        }
      />

      <Card>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b border-zinc-100">
          <div>
            <p className="text-xs text-zinc-400">Status</p>
            <p className={`font-semibold capitalize ${statusCor[p.status] ?? "text-zinc-700"}`}>
              {p.status.replace("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Gravidade</p>
            <p className={`font-semibold capitalize ${gravidadeCor[p.gravidade] ?? "text-zinc-700"}`}>
              {p.gravidade}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Tipo</p>
            <p className="font-medium text-zinc-700 capitalize">{p.tipo}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Responsável</p>
            <p className="font-medium text-zinc-700">{p.responsavel?.nome ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Prazo</p>
            <p className="font-medium text-zinc-700">{p.prazo ? formatarData(p.prazo) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Criado em</p>
            <p className="font-medium text-zinc-700">{formatarData(p.criadoEm)}</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs text-zinc-400 mb-1">Descrição</p>
          <p className="text-sm text-zinc-700 whitespace-pre-line">{p.descricao}</p>
        </div>
        {p.providencias && (
          <div className="px-5 pb-5">
            <p className="text-xs text-zinc-400 mb-1">Providências tomadas</p>
            <p className="text-sm text-zinc-700 whitespace-pre-line">{p.providencias}</p>
          </div>
        )}
        {p.observacoesResolucao && (
          <div className="px-5 pb-5">
            <p className="text-xs text-zinc-400 mb-1">Observações da resolução</p>
            <p className="text-sm text-zinc-700 italic">{p.observacoesResolucao}</p>
          </div>
        )}
        {p.dataResolucao && (
          <div className="px-5 pb-5 text-xs text-green-600">
            Resolvida em {formatarData(p.dataResolucao)}
          </div>
        )}
      </Card>

      {/* Modal resolução */}
      {resolvendoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900 mb-4">Registrar resolução</h3>
            <div className="flex flex-col gap-4">
              <Field label="Providências tomadas" required>
                <textarea
                  value={providencias}
                  onChange={(e) => setProvidencias(e.target.value)}
                  placeholder="Descreva o que foi feito…"
                  rows={4}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </Field>
              <Field label="Observações adicionais">
                <textarea
                  value={obsResolucao}
                  onChange={(e) => setObsResolucao(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </Field>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setResolvendoForm(false)}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={resolver}
                disabled={salvando}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {salvando ? "Salvando…" : "Confirmar resolução"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
