"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  ClipboardCheck,
  Package,
  GraduationCap,
  ArrowLeft,
  Plus,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  supervisoesApi,
  turmasApi,
  type NucleoApi,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

export default function CoordenadorNucleosPage() {
  const [busca, setBusca] = useState("");

  const hoje = useMemo(() => new Date(), []);
  const primeiroDiaMes = useMemo(() => {
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, [hoje]);

  const ultimoDiaMes = useMemo(() => {
    const y = hoje.getFullYear();
    const m = hoje.getMonth() + 1;
    const ultimo = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
  }, [hoje]);

  const nomeMesAtual = useMemo(() => {
    return hoje.toLocaleDateString("pt-BR", { month: "long" });
  }, [hoje]);

  const { data: meusNucleos, loading } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  const nucleoIds = useMemo(() => (meusNucleos ?? []).map((n) => n.id), [meusNucleos]);

  // Supervisões do mês atual
  const { data: supsMesData } = useQuery(
    () =>
      nucleoIds.length > 0
        ? supervisoesApi.list({
            nucleoIds,
            status: "finalizada",
            dataInicio: primeiroDiaMes,
            dataFim: ultimoDiaMes,
            limit: 100,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    [JSON.stringify(nucleoIds), primeiroDiaMes, ultimoDiaMes],
  );

  // Turmas dos núcleos
  const { data: turmasData } = useQuery(
    () =>
      nucleoIds.length > 0
        ? turmasApi.list({ nucleoIds, limit: 200 })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 200 }),
    [JSON.stringify(nucleoIds)],
  );

  const supervisoesMes = (supsMesData as any)?.data ?? [];
  const turmas = (turmasData as any)?.data ?? [];

  const nucleosFiltrados = useMemo(() => {
    if (!meusNucleos) return [];
    if (!busca.trim()) return meusNucleos;
    const b = busca.toLowerCase();
    return meusNucleos.filter(
      (n) =>
        n.identificacao.toLowerCase().includes(b) ||
        n.nomeLocal?.toLowerCase().includes(b) ||
        n.bairro?.toLowerCase().includes(b) ||
        n.cidade?.toLowerCase().includes(b) ||
        n.regiao?.toLowerCase().includes(b),
    );
  }, [meusNucleos, busca]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-400">Carregando núcleos atribuídos…</div>
      </div>
    );
  }

  if (!meusNucleos || meusNucleos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <AlertTriangle className="h-8 w-8 text-zinc-400" />
        </div>
        <p className="text-zinc-700 font-semibold text-lg">Nenhum núcleo atribuído</p>
        <p className="text-sm text-zinc-500 max-w-md">
          Não há núcleos esportivos cadastrados sob sua coordenação.
        </p>
        <LinkButton href="/coordenador" variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar ao Painel
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/coordenador"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Painel do Coordenador
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Meus Núcleos
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {meusNucleos.length} {meusNucleos.length === 1 ? "núcleo esportivo sob sua gestão" : "núcleos esportivos sob sua gestão"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LinkButton href="/supervisoes/nova" variant="primary">
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Supervisão
          </LinkButton>
        </div>
      </div>

      {/* Busca rápida */}
      {meusNucleos.length > 2 && (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome, bairro, região ou cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}

      {/* Grid de Núcleos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {nucleosFiltrados.map((n) => {
          const supNoMes = supervisoesMes.find((s: any) => s.nucleoId === n.id);
          const turmasNucleo = turmas.filter((t: any) => t.nucleoId === n.id);
          const totalAlunos = turmasNucleo.reduce(
            (acc: number, t: any) => acc + (t.totalInscritos ?? 0),
            0,
          );

          return (
            <Card key={n.id} className="flex flex-col justify-between hover:border-zinc-300 transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      {n.identificacao}
                    </h2>
                    {n.nomeLocal && (
                      <p className="text-xs text-zinc-500 mt-0.5">{n.nomeLocal}</p>
                    )}
                  </div>
                  {supNoMes ? (
                    <Badge tone="green" className="font-semibold shrink-0">
                      ✓ Supervisionado
                    </Badge>
                  ) : (
                    <Badge tone="amber" className="font-semibold shrink-0">
                      ⏳ Pendente no mês
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-600 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>
                    {[n.bairro, n.regiao, n.cidade, n.estado].filter(Boolean).join(" • ")}
                  </span>
                </div>

                {/* Métricas do Núcleo */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 bg-zinc-50/50 rounded-xl px-3 mb-4 text-center">
                  <div>
                    <span className="text-xs text-zinc-400 block">Turmas</span>
                    <span className="text-base font-bold text-zinc-900">
                      {turmasNucleo.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Beneficiários</span>
                    <span className="text-base font-bold text-zinc-900">
                      {totalAlunos}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Neste Mês</span>
                    <span className={`text-base font-bold ${supNoMes ? "text-emerald-700" : "text-amber-600"}`}>
                      {supNoMes ? "Feita" : "Pendente"}
                    </span>
                  </div>
                </div>

                {/* Endereço detalhado */}
                {n.endereco && (
                  <p className="text-[11px] text-zinc-400 truncate">
                    📍 {n.endereco} {n.numero ? `, nº ${n.numero}` : ""}
                  </p>
                )}
              </div>

              {/* Barra de Ações do Núcleo */}
              <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/70 rounded-b-2xl flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/coordenador/turmas?nucleoId=${n.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-sky-600 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Turmas
                  </Link>
                  <Link
                    href={`/coordenador/estoque?nucleoId=${n.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-sky-600 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <Package className="h-3.5 w-3.5" /> Estoque
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/supervisoes/nova?nucleoId=${n.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" /> Supervisionar
                  </Link>
                  <Link
                    href={`/nucleos/${n.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 px-2 py-1 transition-colors"
                  >
                    Detalhes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
