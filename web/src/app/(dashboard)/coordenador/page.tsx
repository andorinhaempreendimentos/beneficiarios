"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, AlertCircle, Package, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  supervisoesApi,
  pendenciasGeraisApi,
  estoqueNucleosApi,
  type NucleoApi,
} from "@/lib/api/services";
import { Card, Badge, LinkButton } from "@/components/ui";
import { EstoqueAlertBadge } from "@/components/estoque/EstoqueAlertBadge";
import { formatarData } from "@/lib/utils";

const gravidadeTone: Record<string, "zinc" | "amber" | "red"> = {
  baixa: "zinc", media: "amber", alta: "amber", critica: "red",
};

export default function PainelCoordenadorPage() {
  const { user } = useAuth();
  const [nucleoSelecionado, setNucleoSelecionado] = useState<NucleoApi | null>(null);

  const { data: meusNucleos, loading: loadingNucleos } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  // Seleciona o primeiro núcleo por padrão
  const nucleo = nucleoSelecionado ?? meusNucleos?.[0] ?? null;

  const { data: supsData } = useQuery(
    () => nucleo ? supervisoesApi.list({ nucleoId: nucleo.id, limit: 5 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 5 }),
    [nucleo?.id],
  );
  const { data: pendsData } = useQuery(
    () => nucleo ? pendenciasGeraisApi.list({ nucleoId: nucleo.id, status: "aberta", limit: 5 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 5 }),
    [nucleo?.id],
  );
  const { data: estoqueData } = useQuery(
    () => nucleo ? estoqueNucleosApi.listByNucleo(nucleo.id) : Promise.resolve([]),
    [nucleo?.id],
  );

  const supervisoes = (supsData as any)?.data ?? [];
  const pendencias = (pendsData as any)?.data ?? [];
  const estoque = (estoqueData as any) ?? [];
  const alertasEstoque = estoque.filter((e: any) =>
    e.material && e.quantidadeAtual < e.material.estoqueMinimo
  );

  if (loadingNucleos) {
    return <div className="py-16 text-center text-sm text-zinc-400">Carregando…</div>;
  }

  if (!meusNucleos || meusNucleos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <AlertCircle className="h-8 w-8 text-zinc-400" />
        </div>
        <p className="text-zinc-600 font-medium">Nenhum núcleo atribuído</p>
        <p className="text-sm text-zinc-400">Entre em contato com o administrador para atribuir núcleos à sua conta.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Olá, {user?.nome?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Coordenador de Núcleo</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Seletor de núcleo */}
          {meusNucleos.length > 1 && (
            <select
              value={nucleo?.id ?? ""}
              onChange={(e) => {
                const n = meusNucleos.find((x) => x.id === e.target.value);
                setNucleoSelecionado(n ?? null);
              }}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {meusNucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </select>
          )}
          {meusNucleos.length === 1 && nucleo && (
            <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
              📍 {nucleo.identificacao}
            </span>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-5">
            <p className="text-xs text-zinc-400 mb-1">Supervisões este mês</p>
            <p className="text-3xl font-bold text-zinc-800">{supervisoes.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-zinc-400 mb-1">Pendências abertas</p>
            <p className="text-3xl font-bold text-red-600">{pendencias.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-zinc-400 mb-1">Alertas de estoque</p>
            <p className="text-3xl font-bold text-amber-600">{alertasEstoque.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supervisões recentes */}
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-violet-500" />
              Supervisões recentes
            </h2>
            <LinkButton href="/supervisoes/nova" variant="secondary">
              <Plus className="h-3.5 w-3.5 mr-1" />Nova
            </LinkButton>
          </div>
          <div className="divide-y divide-zinc-100">
            {supervisoes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-400 italic">Nenhuma supervisão registrada para este núcleo.</p>
            ) : supervisoes.map((s: any) => (
              <Link key={s.id} href={`/supervisoes/${s.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{formatarData(s.dataSupervisao)}</p>
                  <p className="text-xs text-zinc-400">{s.horaEntrada ?? "—"}</p>
                </div>
                <Badge tone={s.status === "finalizada" ? "green" : "amber"}>
                  {s.status === "finalizada" ? "Finalizada" : "Rascunho"}
                </Badge>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-zinc-100">
            <Link href={nucleo ? `/supervisoes?nucleoId=${nucleo.id}` : "/supervisoes"}
              className="text-xs text-sky-600 hover:underline font-medium">
              Ver todas as supervisões →
            </Link>
          </div>
        </Card>

        {/* Pendências em aberto */}
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Pendências em aberto
            </h2>
            <LinkButton href="/pendencias-gerais/nova" variant="secondary">
              <Plus className="h-3.5 w-3.5 mr-1" />Nova
            </LinkButton>
          </div>
          <div className="divide-y divide-zinc-100">
            {pendencias.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-400 italic">Nenhuma pendência em aberto. 🎉</p>
            ) : pendencias.map((p: any) => (
              <Link key={p.id} href={`/pendencias-gerais/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                <p className="text-sm font-medium text-zinc-800 truncate pr-3">{p.titulo}</p>
                <Badge tone={gravidadeTone[p.gravidade] ?? "zinc"}>{p.gravidade}</Badge>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-zinc-100">
            <Link href={nucleo ? `/pendencias-gerais?nucleoId=${nucleo.id}` : "/pendencias-gerais"}
              className="text-xs text-sky-600 hover:underline font-medium">
              Ver todas as pendências →
            </Link>
          </div>
        </Card>
      </div>

      {/* Alertas de estoque */}
      {alertasEstoque.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              Estoque abaixo do mínimo
            </h2>
            <LinkButton href={nucleo ? `/estoque/nucleos/${nucleo.id}` : "/estoque"} variant="secondary">
              Ver estoque
            </LinkButton>
          </div>
          <div className="divide-y divide-zinc-100">
            {alertasEstoque.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-zinc-800">{item.material?.nome ?? "—"}</p>
                <EstoqueAlertBadge item={item} showQty />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nova supervisão", href: "/supervisoes/nova", icon: ClipboardCheck, cor: "violet" },
          { label: "Nova pendência", href: "/pendencias-gerais/nova", icon: AlertCircle, cor: "red" },
          { label: "Ver estoque", href: nucleo ? `/estoque/nucleos/${nucleo.id}` : "/estoque", icon: Package, cor: "sky" },
          { label: "Relatório mensal", href: "/supervisoes/relatorio-mensal", icon: ClipboardCheck, cor: "green" },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-5 text-center hover:border-sky-300 hover:shadow-sm transition-all">
            <a.icon className="h-5 w-5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-700">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
