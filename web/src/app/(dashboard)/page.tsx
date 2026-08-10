"use client";

import { Building2, ClipboardList, Dumbbell, FileBarChart, Plus, ShieldCheck, UserCheck, UserPlus, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { dashboardApi, type DashboardResumo } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { statusBeneficiarioTone, statusBeneficiarioLabel, normalizarStatusBeneficiario } from "@/lib/status";

const VAZIO: DashboardResumo = {
  beneficiariosAtivos: 0, totalBeneficiarios: 0, nucleosAtivos: 0, totalNucleos: 0, totalObjetos: 0, totalOrganizacoes: 0, funcionariosAtivos: 0,
  funcionariosLicenca: 0, totalTurmas: 0, totalVagas: 0, totalOcupadas: 0, vagasLivres: 0,
  ocupacaoGlobal: 0, totalModalidades: 0, topNucleos: [], distribuicaoPorModalidade: [], recentes: [],
};

export default function DashboardPage() {
  const { data, loading } = useQuery<DashboardResumo>(() => dashboardApi.resumo(), []);
  const r = data ?? VAZIO;

  return (
    <div className="flex flex-col gap-6">

      {/* Barra de Ações Rápidas no Topo — Colada ao topo, sem curvas, com padding amplo e cores executivas */}
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

      {/* Fluxo de Hierarquia do Sistema — Minimalista sem ícones/emojis */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
        <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">Hierarquia Operacional do Sistema</h2>
          <span className="text-[11px] font-semibold text-zinc-400">Encadeamento sequencial</span>
        </div>

        {/* Trilha de Encaixe Interligada Neutra (Sem Cores/Ícones) */}
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4 lg:grid-cols-7 bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
          {[
            { nivel: "1º", titulo: "Organização" },
            { nivel: "2º", titulo: "Objeto" },
            { nivel: "3º", titulo: "Coordenação" },
            { nivel: "4º", titulo: "Núcleos (20)" },
            { nivel: "5º", titulo: "Professores (20)" },
            { nivel: "6º", titulo: "Turmas (40)" },
            { nivel: "7º", titulo: "Beneficiários" },
          ].map(({ nivel, titulo }, idx) => (
            <div
              key={nivel}
              className={`relative flex items-center justify-between gap-2 bg-white px-4 py-3.5 text-zinc-900 transition-all hover:bg-zinc-100 select-none ${
                idx === 0 ? "rounded-l-xl lg:rounded-l-xl lg:rounded-r-none" :
                idx === 6 ? "rounded-r-xl lg:rounded-r-xl lg:rounded-l-none" : "rounded-none"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-300 text-zinc-700">
                  {nivel}
                </span>
                <span className="text-xs font-bold text-zinc-800 truncate tracking-tight">{titulo}</span>
              </div>
              {idx < 6 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600 border border-zinc-300 shadow-2xs">
                  ›
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Métricas principais — 4 colunas, sem hero redundante */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Beneficiários ativos" value={r.beneficiariosAtivos} icon={Users} tone="sky" />
        <StatCard label="Núcleos em operação" value={r.nucleosAtivos} icon={Building2} tone="green" />
        <StatCard label="Funcionários" value={r.funcionariosAtivos} icon={UsersRound} tone="sky" />
        <StatCard label="Modalidades" value={r.totalModalidades} icon={Dumbbell} tone="green" />
      </div>

      {loading && <div className="px-1 text-sm text-zinc-400">Carregando…</div>}

      {/* Estatísticas detalhadas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Beneficiários */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Beneficiários</h3>
            <Link
              href="/beneficiarios"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Ativos</p>
                <p className="text-2xl font-bold text-green-700">{r.beneficiariosAtivos}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
                <p className="text-xs text-zinc-500">Total cadastrado</p>
                <p className="text-2xl font-bold text-zinc-700">{r.totalBeneficiarios}</p>
              </div>
            </div>
            <Link
              href="/beneficiarios/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Novo beneficiário
            </Link>
          </CardBody>
        </Card>

        {/* Turmas e vagas */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Turmas e Vagas</h3>
            <Link
              href="/turmas"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-2xs"
            >
              Ver turmas
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center">
                <p className="text-xs text-zinc-500">Turmas</p>
                <p className="text-2xl font-bold text-zinc-700">{r.totalTurmas}</p>
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2.5 text-center">
                <p className="text-xs text-green-700">Vagas livres</p>
                <p className="text-2xl font-bold text-green-700">{r.vagasLivres}</p>
              </div>
              <div className="rounded-lg bg-sky-50 px-3 py-2.5 text-center">
                <p className="text-xs text-sky-700">Ocupação</p>
                <p className="text-2xl font-bold text-sky-700">{r.ocupacaoGlobal}%</p>
              </div>
            </div>
            <Link
              href="/turmas/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova turma
            </Link>
          </CardBody>
        </Card>

        {/* Funcionários */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Pessoal</h3>
            <Link
              href="/funcionarios"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Contratados</p>
                <p className="text-2xl font-bold text-green-700">{r.funcionariosAtivos}</p>
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-2.5">
                <p className="text-xs text-amber-700">Em licença</p>
                <p className="text-2xl font-bold text-amber-700">{r.funcionariosLicenca}</p>
              </div>
            </div>
            <Link
              href="/funcionarios/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Novo funcionário
            </Link>
          </CardBody>
        </Card>

        {/* Objetos */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Objetos</h3>
            <Link
              href="/objetos"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Cadastrados</p>
                <p className="text-2xl font-bold text-green-700">{r.totalObjetos}</p>
              </div>
              <div className="rounded-lg bg-sky-50 px-3 py-2.5">
                <p className="text-xs text-sky-700">Vigentes</p>
                <p className="text-2xl font-bold text-sky-700">{r.totalObjetos}</p>
              </div>
            </div>
            <Link
              href="/objetos/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo objeto
            </Link>
          </CardBody>
        </Card>

        {/* Organizações */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Organizações</h3>
            <Link
              href="/organizacoes"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-2xs"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Parceiras</p>
                <p className="text-2xl font-bold text-green-700">{r.totalOrganizacoes}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
                <p className="text-xs text-zinc-500">Ativas</p>
                <p className="text-2xl font-bold text-zinc-700">{r.totalOrganizacoes}</p>
              </div>
            </div>
            <Link
              href="/organizacoes/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Nova organização
            </Link>
          </CardBody>
        </Card>

        {/* Núcleos */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Núcleos</h3>
            <Link
              href="/nucleos"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-2xs"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Em operação</p>
                <p className="text-2xl font-bold text-green-700">{r.nucleosAtivos}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
                <p className="text-xs text-zinc-500">Total núcleos</p>
                <p className="text-2xl font-bold text-zinc-700">{r.totalNucleos}</p>
              </div>
            </div>
            <Link
              href="/nucleos/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Novo núcleo
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Distribuição por modalidade */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Beneficiários por modalidade</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {r.distribuicaoPorModalidade.map((m) => {
              const pct = r.totalOcupadas > 0 ? Math.round((m.total / r.totalOcupadas) * 100) : 0;
              return (
                <div key={m.nome} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700">{m.nome}</span>
                    <span className="font-medium text-zinc-900">{m.total} <span className="text-xs font-normal text-zinc-400">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Top núcleos */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Top núcleos por beneficiários ativos</h3>
            <Link href="/nucleos" className="text-xs text-sky-600 hover:underline">Ver todos</Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {r.topNucleos.map((n, i) => {
              const pct = r.beneficiariosAtivos > 0 ? Math.round((n.beneficiariosAtivos / r.beneficiariosAtivos) * 100) : 0;
              return (
                <div key={n.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs font-bold text-zinc-400">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700">{n.identificacao}</span>
                      <span className="font-medium text-zinc-900">{n.beneficiariosAtivos}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-green-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Cadastros recentes */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Cadastros recentes</h3>
          <Link href="/beneficiarios" className="text-sm text-sky-600 hover:underline">Ver todos</Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                  <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{b.nomeCompleto}</td>
                    <td className="px-5 py-3 text-zinc-600">{b.nucleo ?? "—"}</td>
                    <td className="px-5 py-3"><Badge tone={tone}>{statusBeneficiarioLabel[statusNorm]}</Badge></td>
                    <td className="px-5 py-3 text-zinc-600">{formatarData(b.dataCadastro)}</td>
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

