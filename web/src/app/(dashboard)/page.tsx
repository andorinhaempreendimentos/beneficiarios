"use client";

import { useMemo } from "react";
import { Building2, ClipboardList, Dumbbell, FileBarChart, Plus, ShieldCheck, UserCheck, UserPlus, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { dashboardApi, nucleosApi, type DashboardResumo, type NucleoApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { statusBeneficiarioTone, statusBeneficiarioLabel, normalizarStatusBeneficiario } from "@/lib/status";
import { useLocationFilter } from "@/components/providers/LocationFilterProvider";

const VAZIO: DashboardResumo = {
  beneficiariosAtivos: 0, totalBeneficiarios: 0, nucleosAtivos: 0, totalNucleos: 0, totalObjetos: 0, totalOrganizacoes: 0, funcionariosAtivos: 0,
  funcionariosLicenca: 0, totalTurmas: 0, totalVagas: 0, totalOcupadas: 0, vagasLivres: 0,
  ocupacaoGlobal: 0, totalModalidades: 0, topNucleos: [], distribuicaoPorModalidade: [], recentes: [],
};

export default function DashboardPage() {
  const { estado, cidade } = useLocationFilter();

  const { data, loading } = useQuery<DashboardResumo>(() => dashboardApi.resumo(), []);
  const { data: nucleosRes } = useQuery(() => nucleosApi.list({ limit: 200 }), []);

  const rawNucleos = nucleosRes?.data ?? [];
  const rRaw = data ?? VAZIO;

  // Filtrar resumos e dados conforme estado e cidade selecionados na sessão
  const { resumoFiltrado, nucleosMapeados } = useMemo(() => {
    const nucleosComUf = rawNucleos.map((n) => {
      let estadoUf = (n as any).estado as string | undefined;
      if (!estadoUf) {
        if (n.cidade?.toLowerCase() === "palmas") estadoUf = "TO";
        else if (n.cidade?.toLowerCase() === "recife") estadoUf = "PE";
        else estadoUf = "TO";
      }
      return {
        ...n,
        estadoUf,
        cidadeNome: n.cidade || "Palmas",
      };
    });

    if (estado === "Todos" && cidade === "Todas") {
      return { resumoFiltrado: rRaw, nucleosMapeados: nucleosComUf };
    }

    const nucleosFiltrados = nucleosComUf.filter((n) => {
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

    const rFiltrado: DashboardResumo = {
      ...rRaw,
      nucleosAtivos: nucleosAtivosCount,
      totalNucleos: nucleosFiltrados.length,
      beneficiariosAtivos: totalBeneficiariosAtivosFiltrados,
      topNucleos: topNucleosFiltrados,
      recentes: recentesFiltrados,
    };

    return { resumoFiltrado: rFiltrado, nucleosMapeados: nucleosComUf };
  }, [rawNucleos, rRaw, estado, cidade]);

  const r = resumoFiltrado;

  return (
    <div className="flex flex-col gap-6">

      {/* Barra de Ações Rápidas no Topo */}
      <div className="-mt-6 -mx-4 sm:-mx-6 lg:-mx-8 flex flex-wrap items-center gap-0 border-b border-zinc-300 shadow-sm">
        {[
          { href: "/inscricoes", label: "Inscrições", icon: ClipboardList, bg: "bg-amber-600 hover:bg-amber-700 text-white" },
          { href: "/atividades", label: "Atividades", icon: Dumbbell, bg: "bg-sky-600 hover:bg-sky-700 text-white" },
          { href: "/relatorios", label: "Relatórios", icon: FileBarChart, bg: "bg-emerald-600 hover:bg-emerald-700 text-white" },
        ].map(({ href, label, icon: Icon, bg }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 items-center justify-center gap-3 ${bg} py-5 px-6 text-sm font-extrabold tracking-wide uppercase transition-all shadow-inner`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Fluxo de Hierarquia do Sistema */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs transition-colors">
        <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Hierarquia Operacional do Sistema</h2>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">Encadeamento sequencial</span>
        </div>

        <div className="grid grid-cols-2 gap-px sm:grid-cols-4 lg:grid-cols-7 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          {[
            { nivel: "1º", titulo: "Organização" },
            { nivel: "2º", titulo: "Objeto" },
            { nivel: "3º", titulo: "Coordenação" },
            { nivel: "4º", titulo: "Núcleos" },
            { nivel: "5º", titulo: "Professores" },
            { nivel: "6º", titulo: "Turmas" },
            { nivel: "7º", titulo: "Beneficiários" },
          ].map(({ nivel, titulo }, idx) => (
            <div
              key={nivel}
              className={`relative flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 px-4 py-3.5 text-zinc-900 dark:text-zinc-100 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none ${
                idx === 0 ? "rounded-l-xl lg:rounded-l-xl lg:rounded-r-none" :
                idx === 6 ? "rounded-r-xl lg:rounded-r-xl lg:rounded-l-none" : "rounded-none"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  {nivel}
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate tracking-tight">{titulo}</span>
              </div>
              {idx < 6 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 shadow-2xs">
                  ›
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Beneficiários ativos" value={r.beneficiariosAtivos} icon={Users} tone="sky" />
        <StatCard label="Núcleos em operação" value={r.nucleosAtivos} icon={Building2} tone="green" />
        <StatCard label="Funcionários" value={r.funcionariosAtivos} icon={UsersRound} tone="sky" />
        <StatCard label="Modalidades" value={r.totalModalidades} icon={Dumbbell} tone="green" />
      </div>

      {loading && <div className="px-1 text-sm text-zinc-400">Carregando…</div>}

      {/* Estatísticas detalhadas em ordem hierárquica */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* 1. Objetos */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Objetos</h3>
            <Link
              href="/objetos"
              className="inline-flex items-center rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/60 px-3 py-2.5">
                <p className="text-xs text-green-700 dark:text-green-300">Cadastrados</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{r.totalObjetos}</p>
              </div>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/60 px-3 py-2.5">
                <p className="text-xs text-sky-700 dark:text-sky-300">Vigentes</p>
                <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">{r.totalObjetos}</p>
              </div>
            </div>
            <Link
              href="/objetos/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo objeto
            </Link>
          </CardBody>
        </Card>

        {/* 2. Organizações */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Organizações</h3>
            <Link
              href="/organizacoes"
              className="inline-flex items-center rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors shadow-2xs"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/60 px-3 py-2.5">
                <p className="text-xs text-green-700 dark:text-green-300">Parceiras</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{r.totalOrganizacoes}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Ativas</p>
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">{r.totalOrganizacoes}</p>
              </div>
            </div>
            <Link
              href="/organizacoes/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Nova organização
            </Link>
          </CardBody>
        </Card>

        {/* 3. Núcleos */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Núcleos</h3>
            <Link
              href="/nucleos"
              className="inline-flex items-center rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/60 px-3 py-2.5">
                <p className="text-xs text-green-700 dark:text-green-300">Em operação</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{r.nucleosAtivos}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Total núcleos</p>
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">{r.totalNucleos}</p>
              </div>
            </div>
            <Link
              href="/nucleos/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Novo núcleo
            </Link>
          </CardBody>
        </Card>

        {/* 4. Turmas e vagas */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Turmas e Vagas</h3>
            <Link
              href="/turmas"
              className="inline-flex items-center rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors shadow-2xs"
            >
              Ver turmas
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2.5 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Turmas</p>
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">{r.totalTurmas}</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-950/60 px-3 py-2.5 text-center">
                <p className="text-xs text-green-700 dark:text-green-300">Vagas livres</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{r.vagasLivres}</p>
              </div>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/60 px-3 py-2.5 text-center">
                <p className="text-xs text-sky-700 dark:text-sky-300">Ocupação</p>
                <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">{r.ocupacaoGlobal}%</p>
              </div>
            </div>
            <Link
              href="/turmas/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova turma
            </Link>
          </CardBody>
        </Card>

        {/* 5. Beneficiários */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Beneficiários</h3>
            <Link
              href="/beneficiarios"
              className="inline-flex items-center rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/60 px-3 py-2.5">
                <p className="text-xs text-green-700 dark:text-green-300">Ativos</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{r.beneficiariosAtivos}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Total cadastrado</p>
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">{r.totalBeneficiarios}</p>
              </div>
            </div>
            <Link
              href="/beneficiarios/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Novo beneficiário
            </Link>
          </CardBody>
        </Card>

        {/* 6. Pessoal / Funcionários */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Pessoal</h3>
            <Link
              href="/funcionarios"
              className="inline-flex items-center rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/60 px-3 py-2.5">
                <p className="text-xs text-green-700 dark:text-green-300">Contratados</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{r.funcionariosAtivos}</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 px-3 py-2.5">
                <p className="text-xs text-amber-700 dark:text-amber-300">Em licença</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{r.funcionariosLicenca}</p>
              </div>
            </div>
            <Link
              href="/funcionarios/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Novo funcionário
            </Link>
          </CardBody>
        </Card>
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
    </div>
  );
}
