"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { supervisoesApi, type SupervisaoApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const avaliacaoLabel: Record<string, string> = {
  otima: "Ótima", boa: "Boa", regular: "Regular", ruim: "Ruim", critica: "Crítica",
};
const avaliacaoTone: Record<string, "green" | "sky" | "amber" | "red" | "zinc"> = {
  otima: "green", boa: "sky", regular: "amber", ruim: "amber", critica: "red",
};

function AvaliacaoItem({ label, valor, obs }: { label: string; valor?: string | null; obs?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 w-32 shrink-0">{label}</span>
        <Badge tone={avaliacaoTone[valor] ?? "zinc"}>{avaliacaoLabel[valor] ?? valor}</Badge>
      </div>
      {obs && <p className="text-xs text-zinc-400 ml-32 italic">{obs}</p>}
    </div>
  );
}

export default function DetalhesSupervisaoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [finalizando, setFinalizando] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  const { data: sup, loading, refetch } = useQuery<SupervisaoApi>(
    () => supervisoesApi.get(id),
    [id],
  );

  async function finalizar() {
    if (!confirm("Finalizar esta supervisão? Não será possível editar depois.")) return;
    setFinalizando(true);
    try {
      await supervisoesApi.finalizar(id);
      toast.success("Supervisão finalizada.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao finalizar.");
    } finally {
      setFinalizando(false);
    }
  }

  async function remover() {
    if (!confirm("Remover esta supervisão?")) return;
    setRemovendo(true);
    try {
      await supervisoesApi.remove(id);
      toast.success("Supervisão removida.");
      router.push("/supervisoes");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover.");
      setRemovendo(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-zinc-400">Carregando…</div>;
  if (!sup) return <div className="py-16 text-center text-sm text-zinc-400">Supervisão não encontrada.</div>;

  const isFinalizada = sup.status === "finalizada";

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={`Supervisão — ${formatarData(sup.dataSupervisao)}`}
        description={sup.nucleo?.identificacao ?? ""}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/supervisoes" variant="secondary">Voltar</LinkButton>
            {!isFinalizada && (
              <>
                <LinkButton href={`/supervisoes/${id}/editar`} variant="secondary">Editar</LinkButton>
                <button
                  type="button"
                  onClick={finalizar}
                  disabled={finalizando}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {finalizando ? "Finalizando…" : "Finalizar"}
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Status */}
      <div className="flex items-center gap-3">
        <Badge tone={isFinalizada ? "green" : "amber"}>
          {isFinalizada ? "Finalizada" : "Rascunho"}
        </Badge>
        <span className="text-sm text-zinc-500">
          Coordenador: <strong className="text-zinc-700">{sup.coordenador?.nome ?? "—"}</strong>
        </span>
      </div>

      {/* Identificação */}
      <Card>
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-800">Identificação</h2>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-400">Data</p>
            <p className="font-medium text-zinc-800">{formatarData(sup.dataSupervisao)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Entrada</p>
            <p className="font-medium text-zinc-800">{sup.horaEntrada}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Saída</p>
            <p className="font-medium text-zinc-800">{sup.horaSaida ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Núcleo</p>
            <p className="font-medium text-zinc-800">{sup.nucleo?.identificacao ?? "—"}</p>
          </div>
        </div>
      </Card>

      {/* Presenças */}
      <Card>
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-800">Presenças</h2>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-400">Beneficiários presentes</p>
            <p className="font-medium text-zinc-800">{sup.beneficiariosPresentes ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Beneficiários esperados</p>
            <p className="font-medium text-zinc-800">{sup.beneficiariosEsperados ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Professor presente</p>
            <p className="font-medium text-zinc-800">
              {sup.professorPresente == null ? "—" : sup.professorPresente ? "Sim" : "Não"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Grade cumprida</p>
            <p className="font-medium text-zinc-800">
              {sup.gradeCumprida == null ? "—" : sup.gradeCumprida ? "Sim" : "Não"}
            </p>
          </div>
          {sup.gradeObservacoes && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-zinc-400">Obs. da grade</p>
              <p className="text-zinc-700 text-sm">{sup.gradeObservacoes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Avaliação */}
      {(sup.estruturaAvaliacao || sup.materiaisAvaliacao || sup.uniformesAvaliacao) && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800">Avaliação</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <AvaliacaoItem label="Estrutura" valor={sup.estruturaAvaliacao} obs={sup.estruturaObservacoes} />
            <AvaliacaoItem label="Materiais" valor={sup.materiaisAvaliacao} obs={sup.materiaisObservacoes} />
            <AvaliacaoItem label="Uniformes" valor={sup.uniformesAvaliacao} obs={sup.uniformesObservacoes} />
          </div>
        </Card>
      )}

      {/* Observações gerais */}
      {sup.observacoesGerais && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800">Observações Gerais</h2>
          </div>
          <p className="p-5 text-sm text-zinc-700 whitespace-pre-line">{sup.observacoesGerais}</p>
        </Card>
      )}

      {/* Fotos */}
      {sup.fotos && sup.fotos.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800">Fotos ({sup.fotos.length})</h2>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {sup.fotos.map((f) => (
              <div key={f.id} className="flex flex-col gap-1">
                <img
                  src={f.url}
                  alt={f.legenda ?? f.categoria}
                  className="rounded-xl object-cover aspect-square w-full border border-zinc-200"
                />
                {f.legenda && (
                  <p className="text-xs text-zinc-400 text-center">{f.legenda}</p>
                )}
                <Badge tone="zinc">{f.categoria}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ação de remover (somente rascunho) */}
      {!isFinalizada && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={remover}
            disabled={removendo}
            className="text-xs text-red-500 hover:underline disabled:opacity-50 cursor-pointer"
          >
            {removendo ? "Removendo…" : "Remover supervisão"}
          </button>
        </div>
      )}
    </div>
  );
}
