"use client";

import { useState, useMemo } from "react";
import { Building2, ClipboardList, Dumbbell, FileBarChart, Link2, MapPin, Package, Plus, ShieldCheck, UserCheck, UserPlus, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  dashboardApi,
  nucleosApi,
  atividadesApi,
  turmasApi,
  organizacoesApi,
  objetosApi,
  type DashboardResumo,
  type NucleoApi,
  type AtividadeApi,
  type TurmaApi,
  type OrganizacaoApi,
  type ObjetoApi,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { statusBeneficiarioTone, statusBeneficiarioLabel, normalizarStatusBeneficiario } from "@/lib/status";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";
import { ModalLinksInscricao } from "@/components/inscricoes/ModalLinksInscricao";
import { normalizarNucleoLocalizacao } from "@/lib/location";
import { MapaPolos } from "@/components/dashboard/MapaPolos";

const VAZIO: DashboardResumo = {
  beneficiariosAtivos: 0, totalBeneficiarios: 0, nucleosAtivos: 0, totalNucleos: 0, totalObjetos: 0, totalOrganizacoes: 0, funcionariosAtivos: 0,
  funcionariosLicenca: 0, totalTurmas: 0, totalVagas: 0, totalOcupadas: 0, vagasLivres: 0,
  ocupacaoGlobal: 0, totalModalidades: 0, topNucleos: [], distribuicaoPorModalidade: [], recentes: [],
};

export default function DashboardPage() {
  const { estado, cidade, organizacaoId, nucleoId } = useLocationFilter();
  const [modalLinksOpen, setModalLinksOpen] = useState(false);

  const { data, loading } = useQuery<DashboardResumo>(() => dashboardApi.resumo(), []);
  const { data: nucleosRes } = useQuery(() => nucleosApi.list({ limit: 200 }), []);
  const { data: atividadesData } = useQuery(() => atividadesApi.list({ limit: 200 }), []);
  const { data: turmasData } = useQuery(() => turmasApi.list({ limit: 200 }), []);
  const { data: organizacoesData } = useQuery(() => organizacoesApi.list({ limit: 200 }), []);
  const { data: objetosData } = useQuery(() => objetosApi.list({ limit: 200 }), []);

  const rawNucleos = nucleosRes?.data ?? [];
  const atividades = atividadesData?.data ?? [];
  const turmas = turmasData?.data ?? [];
  const rRaw = data ?? VAZIO;

  // Filtrar resumos e dados conforme estado, cidade, organização e núcleo selecionados na sessão
  const { resumoFiltrado, nucleosMapeados } = useMemo(() => {
    const nucleosComUf = rawNucleos.map(normalizarNucleoLocalizacao);

    if (estado === "Todos" && cidade === "Todas" && organizacaoId === "Todas" && nucleoId === "Todos") {
      return { resumoFiltrado: rRaw, nucleosMapeados: nucleosComUf };
    }

    const nucleosFiltrados = nucleosComUf.filter((n) => {
      if (organizacaoId && organizacaoId !== "Todas" && n.organizacaoId !== organizacaoId) {
        return false;
      }
      if (nucleoId && nucleoId !== "Todos" && n.id !== nucleoId) {
        return false;
      }
      const bateEstado = estado === "Todos" || n.estadoUf === estado;
      const bateCidade = cidade === "Todas" || n.cidadeNome === cidade;
      return bateEstado && bateCidade;
    });

    const idsFiltrados = new Set(nucleosFiltrados.map((n) => n.id));
    const nomesFiltrados = new Set(nucleosFiltrados.map((n) => n.identificacao.toLowerCase()));

    const topNucleosFiltrados = rRaw.topNucleos.filter((tn) => idsFiltrados.has(tn.id));
    const recentesFiltrados = rRaw.recentes.filter(
      (rec) => rec.nucleo && nomesFiltrados.has(rec.nucleo.toLowerCase())
    );

    const totalBeneficiariosAtivosFiltrados = topNucleosFiltrados.reduce(
      (acc, n) => acc + (n.beneficiariosAtivos || 0),
      0
    );

    const nucleosAtivosCount = nucleosFiltrados.filter((n) => n.emFuncionamento !== false).length;
    const mapaNucleosFiltrados = (rRaw.mapaNucleos || []).filter((n) => idsFiltrados.has(n.id));

    const rFiltrado: DashboardResumo = {
      ...rRaw,
      nucleosAtivos: nucleosAtivosCount,
      totalNucleos: nucleosFiltrados.length,
      beneficiariosAtivos: totalBeneficiariosAtivosFiltrados,
      topNucleos: topNucleosFiltrados,
      recentes: recentesFiltrados,
      mapaNucleos: mapaNucleosFiltrados,
    };

    return { resumoFiltrado: rFiltrado, nucleosMapeados: nucleosComUf };
  }, [rawNucleos, rRaw, estado, cidade, organizacaoId, nucleoId]);

  const r = resumoFiltrado;

  return (
    <div className="flex flex-col gap-6">

      {loading && <div className="px-1 text-sm text-zinc-400">Carregando…</div>}

      {/* Mapa dos Polos */}
      <MapaPolos nucleos={r.mapaNucleos || []} atividades={atividades} />

      {/* Estatísticas detalhadas em ordem hierárquica */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">

        {/* 1. Objetos */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Package className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Objetos</h3>
            </div>
            <Link href="/objetos" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2.5 py-1.5 border border-emerald-200/40 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Cadastrados</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{r.totalObjetos}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-sky-50/80 px-2.5 py-1.5 border border-sky-200/40 dark:bg-sky-950/30 dark:border-sky-900/40">
                <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400">Vigentes</span>
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300">{r.totalObjetos}</span>
              </div>
            </div>
            <Link
              href="/objetos/novo"
              className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Novo objeto</span>
            </Link>
          </div>
        </div>

        {/* 2. Organizações */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Building2 className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Organizações</h3>
            </div>
            <Link href="/organizacoes" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2.5 py-1.5 border border-emerald-200/40 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Parceiras</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{r.totalOrganizacoes}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-100/80 px-2.5 py-1.5 border border-zinc-200/50 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Ativas</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{r.totalOrganizacoes}</span>
              </div>
            </div>
            <Link
              href="/organizacoes/novo"
              className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Nova organização</span>
            </Link>
          </div>
        </div>

        {/* 3. Núcleos */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <MapPin className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Núcleos</h3>
            </div>
            <Link href="/nucleos" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2.5 py-1.5 border border-emerald-200/40 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Em operação</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{r.nucleosAtivos}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-100/80 px-2.5 py-1.5 border border-zinc-200/50 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Total núcleos</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{r.totalNucleos}</span>
              </div>
            </div>
            <Link
              href="/nucleos/novo"
              className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Novo núcleo</span>
            </Link>
          </div>
        </div>

        {/* 4. Turmas e vagas */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <UsersRound className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Turmas e Vagas</h3>
            </div>
            <Link href="/turmas" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
              Ver turmas
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-3">
            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex items-center justify-between rounded-lg bg-zinc-100/80 px-2 py-1.5 border border-zinc-200/50 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">Turmas</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0 ml-1">{r.totalTurmas}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2 py-1.5 border border-emerald-200/40 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">Livres</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0 ml-1">{r.vagasLivres}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-sky-50/80 px-2 py-1.5 border border-sky-200/40 dark:bg-sky-950/30 dark:border-sky-900/40">
                <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400 truncate">Ocupação</span>
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300 shrink-0 ml-1">{r.ocupacaoGlobal}%</span>
              </div>
            </div>
            <Link
              href="/turmas/novo"
              className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Nova turma</span>
            </Link>
          </div>
        </div>

        {/* 5. Beneficiários */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <Users className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Beneficiários</h3>
            </div>
            <Link href="/beneficiarios" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2.5 py-1.5 border border-emerald-200/40 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Ativos</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{r.beneficiariosAtivos}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-100/80 px-2.5 py-1.5 border border-zinc-200/50 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Total</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{r.totalBeneficiarios}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/beneficiarios/novo"
                className="flex h-7 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50/70 px-2 text-[11px] font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
              >
                <UserPlus className="h-3 w-3" />
                <span>Novo</span>
              </Link>
              <button
                type="button"
                onClick={() => setModalLinksOpen(true)}
                className="flex h-7 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50/70 px-2 text-[11px] font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 cursor-pointer transition-colors"
              >
                <Link2 className="h-3 w-3" />
                <span>Links</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. Pessoal / Funcionários */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <UserCheck className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Pessoal</h3>
            </div>
            <Link href="/funcionarios" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2.5 py-1.5 border border-emerald-200/40 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Contratados</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{r.funcionariosAtivos}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50/80 px-2.5 py-1.5 border border-amber-200/40 dark:bg-amber-950/30 dark:border-amber-900/40">
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Em licença</span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{r.funcionariosLicenca}</span>
              </div>
            </div>
            <Link
              href="/funcionarios/novo"
              className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Novo funcionário</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Distribuição por modalidade */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Beneficiários por modalidade</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {r.distribuicaoPorModalidade.map((m) => {
              const pct = r.totalOcupadas > 0 ? Math.round((m.total / r.totalOcupadas) * 100) : 0;
              return (
                <div key={m.nome} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{m.nome}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.total} <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-sky-400 dark:bg-sky-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Top núcleos */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Top núcleos por beneficiários ativos</h3>
            <Link href="/nucleos" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">Ver todos</Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {r.topNucleos.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">Nenhum núcleo para a localização selecionada.</p>
            ) : (
              r.topNucleos.map((n, i) => {
                const pct = r.beneficiariosAtivos > 0 ? Math.round((n.beneficiariosAtivos / r.beneficiariosAtivos) * 100) : 0;
                return (
                  <div key={n.id} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-right text-xs font-bold text-zinc-400 dark:text-zinc-500">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">{n.identificacao}</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{n.beneficiariosAtivos}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-green-400 dark:bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* Cadastros recentes */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Cadastros recentes</h3>
          <Link href="/beneficiarios" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">Ver todos</Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Núcleo</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {r.recentes.map((b) => {
                const statusNorm = normalizarStatusBeneficiario(b.status);
                const tone = statusBeneficiarioTone[statusNorm];
                return (
                  <tr key={b.id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">{b.nomeCompleto}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{b.nucleo ?? "—"}</td>
                    <td className="px-5 py-3"><Badge tone={tone}>{statusBeneficiarioLabel[statusNorm]}</Badge></td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{formatarData(b.dataCadastro)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ModalLinksInscricao
        open={modalLinksOpen}
        onClose={() => setModalLinksOpen(false)}
        nucleos={rawNucleos}
        atividades={atividades}
        turmas={turmas}
        organizacoes={organizacoesData?.data ?? []}
        objetos={objetosData?.data ?? []}
      />
    </div>
  );
}
