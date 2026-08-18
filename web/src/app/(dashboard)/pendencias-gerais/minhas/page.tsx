"use client";

import Link from "next/link";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { pendenciasGeraisApi, type Paginated, type PendenciaGeralApi } from "@/lib/api/services";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatarData } from "@/lib/utils";

const gravidadeTone: Record<string, "zinc" | "amber" | "red"> = {
  baixa: "zinc", media: "amber", alta: "amber", critica: "red",
};
const statusLabel: Record<string, string> = {
  aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida", cancelada: "Cancelada",
};
const statusTone: Record<string, "zinc" | "sky" | "green" | "red"> = {
  aberta: "red", em_andamento: "sky", resolvida: "green", cancelada: "zinc",
};

export default function MinhasPendenciasPage() {
  const { user } = useAuth();

  const { data: pageData, loading } = useQuery<Paginated<PendenciaGeralApi>>(
    () => pendenciasGeraisApi.list({ responsavelId: user?.id, limit: 50 }),
    [user?.id],
  );

  const pendencias = pageData?.data ?? [];
  const abertas = pendencias.filter((p) => p.status !== "resolvida" && p.status !== "cancelada");
  const resolvidas = pendencias.filter((p) => p.status === "resolvida" || p.status === "cancelada");

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Minhas Pendências"
        description="Pendências atribuídas a você"
        actions={<LinkButton href="/pendencias-gerais">Ver todas</LinkButton>}
      />

      {loading && <div className="py-8 text-center text-sm text-zinc-400">Carregando…</div>}

      {!loading && (
        <>
          {abertas.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-800">Em aberto ({abertas.length})</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {abertas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pendencias-gerais/${p.id}`}
                    className="flex items-start justify-between px-5 py-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-zinc-800">{p.titulo}</span>
                      <span className="text-xs text-zinc-400">{p.nucleo?.identificacao ?? "—"}</span>
                      {p.prazo && (
                        <span className="text-xs text-amber-600 font-medium">
                          Prazo: {formatarData(p.prazo)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={gravidadeTone[p.gravidade] ?? "zinc"}>{p.gravidade}</Badge>
                      <Badge tone={statusTone[p.status] ?? "zinc"}>{statusLabel[p.status] ?? p.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {abertas.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-400">
              Nenhuma pendência em aberto atribuída a você. 🎉
            </div>
          )}

          {resolvidas.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-500">Resolvidas ({resolvidas.length})</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {resolvidas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pendencias-gerais/${p.id}`}
                    className="flex items-start justify-between px-5 py-4 hover:bg-zinc-50 opacity-60 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-zinc-600 line-through">{p.titulo}</span>
                      <span className="text-xs text-zinc-400">{p.nucleo?.identificacao ?? "—"}</span>
                    </div>
                    <Badge tone="green">Resolvida</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
