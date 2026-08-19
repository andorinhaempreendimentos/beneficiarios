"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { MapPin, Plus, X, ClipboardCheck } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, LinkButton, Badge } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi, type CoordenadorApi } from "@/lib/api/coordenadores";
import { nucleosApi, supervisoesApi, type NucleoApi, type Paginated } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

export default function DetalheCoordenadorPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [vinculando, setVinculando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [nucleoSelecionado, setNucleoSelecionado] = useState("");

  const { data: coord, loading, refetch } = useQuery<CoordenadorApi>(
    () => coordenadoresApi.get(id),
    [id],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(
    () => nucleosApi.list({ limit: 200 }),
    [],
  );
  const { data: supsData } = useQuery(
    () => supervisoesApi.list({ coordenadorId: id, limit: 10 }),
    [id],
  );

  const todosNucleos = nucleosData?.data ?? [];
  const nucleosAtribuidos = coord?.nucleos ?? [];
  const nucleosIds = new Set(nucleosAtribuidos.map((n) => n.id));
  const nucleosDisponiveis = todosNucleos.filter((n) => !nucleosIds.has(n.id));
  const supervisoes = (supsData as any)?.data ?? [];

  async function vincular() {
    if (!nucleoSelecionado) return;
    setVinculando(true);
    try {
      await coordenadoresApi.vincular(id, nucleoSelecionado);
      toast.success("Núcleo atribuído.");
      setNucleoSelecionado("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atribuir núcleo.");
    } finally {
      setVinculando(false);
    }
  }

  async function desvincular(nucleoId: string) {
    if (!confirm("Remover este núcleo do coordenador?")) return;
    setRemovendo(nucleoId);
    try {
      await coordenadoresApi.desvincular(id, nucleoId);
      toast.success("Núcleo removido.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover núcleo.");
    } finally {
      setRemovendo(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-zinc-400">Carregando…</div>;
  if (!coord) return <div className="py-16 text-center text-sm text-zinc-400">Coordenador não encontrado.</div>;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={coord.nomeCompleto}
        description="Coordenador de Núcleo"
        actions={<LinkButton href="/coordenadores" variant="secondary">Voltar</LinkButton>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: núcleos */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">Núcleos atribuídos</h2>
              <span className="text-xs text-zinc-400">{nucleosAtribuidos.length} núcleo(s)</span>
            </div>

            {/* Lista de núcleos */}
            <div className="divide-y divide-zinc-100">
              {nucleosAtribuidos.length === 0 ? (
                <p className="px-5 py-6 text-sm text-zinc-400 italic">Nenhum núcleo atribuído ainda.</p>
              ) : nucleosAtribuidos.map((n) => (
                <div key={n.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{n.identificacao}</p>
                      {n.nomeLocal && <p className="text-xs text-zinc-400">{n.nomeLocal}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => desvincular(n.id)}
                    disabled={removendo === n.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar núcleo */}
            {nucleosDisponiveis.length > 0 && (
              <div className="px-5 py-4 border-t border-zinc-100 flex items-center gap-3">
                <select
                  value={nucleoSelecionado}
                  onChange={(e) => setNucleoSelecionado(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Selecione um núcleo para adicionar…</option>
                  {nucleosDisponiveis.map((n) => (
                    <option key={n.id} value={n.id}>{n.identificacao}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={vincular}
                  disabled={!nucleoSelecionado || vinculando}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {vinculando ? "Adicionando…" : "Adicionar"}
                </button>
              </div>
            )}
          </Card>

          {/* Supervisões recentes */}
          <Card>
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">Supervisões recentes</h2>
              <LinkButton href={`/supervisoes?coordenadorId=${id}`} variant="secondary">
                Ver todas
              </LinkButton>
            </div>
            <div className="divide-y divide-zinc-100">
              {supervisoes.length === 0 ? (
                <p className="px-5 py-6 text-sm text-zinc-400 italic">Nenhuma supervisão registrada.</p>
              ) : supervisoes.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-4 w-4 text-zinc-300 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{s.nucleo?.identificacao ?? "—"}</p>
                      <p className="text-xs text-zinc-400">{formatarData(s.dataSupervisao)}</p>
                    </div>
                  </div>
                  <Badge tone={s.status === "finalizada" ? "green" : "amber"}>
                    {s.status === "finalizada" ? "Finalizada" : "Rascunho"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna direita: dados */}
        <div>
          <Card>
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-800">Dados</h2>
            </div>
            <div className="p-5 flex flex-col gap-3 text-sm">
              {coord.email && (
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">E-mail</p>
                  <p className="text-zinc-700">{coord.email}</p>
                </div>
              )}
              {coord.celular && (
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Celular</p>
                  <p className="text-zinc-700">{coord.celular}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Status</p>
                <Badge tone={coord.status === "ativo" ? "green" : "zinc"}>{coord.status}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
