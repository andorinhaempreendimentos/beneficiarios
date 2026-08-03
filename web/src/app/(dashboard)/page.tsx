import { Building2, ClipboardList, Dumbbell, Plus, UserCheck, UserPlus, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import { nucleos } from "@/lib/mock/nucleos";
import { beneficiarios } from "@/lib/mock/beneficiarios";
import { funcionarios } from "@/lib/mock/funcionarios";
import { atividades } from "@/lib/mock/atividades";
import { turmas } from "@/lib/mock/turmas";
import { formatarData } from "@/lib/utils";
import { statusBeneficiarioTone } from "@/lib/status";

export default function DashboardPage() {
  const nucleosAtivos = nucleos.filter((n) => n.emFuncionamento).length;
  const totalBeneficiarios = nucleos.reduce((acc, n) => acc + n.totalBeneficiarios, 0);
  const beneficiariosAtivos = nucleos.reduce((acc, n) => acc + n.beneficiariosAtivos, 0);
  const funcionariosAtivos = funcionarios.filter((f) => f.status === "contratado").length;
  const funcionariosLicenca = funcionarios.filter((f) =>
    f.status === "licenca_medica" || f.status === "licenca_maternidade" || f.status === "afastado_inss"
  ).length;

  const totalVagas = turmas.reduce((acc, t) => acc + t.vagasTotais, 0);
  const totalOcupadas = turmas.reduce((acc, t) => acc + t.qtdBeneficiarios, 0);
  const vagasLivres = totalVagas - totalOcupadas;
  const ocupacaoGlobal = totalVagas > 0 ? Math.round((totalOcupadas / totalVagas) * 100) : 0;

  const topNucleos = [...nucleos]
    .sort((a, b) => b.beneficiariosAtivos - a.beneficiariosAtivos)
    .slice(0, 5);

  const distribuicaoPorModalidade = atividades
    .map((a) => ({
      nome: a.nome,
      total: turmas.filter((t) => t.atividadeId === a.id).reduce((acc, t) => acc + t.qtdBeneficiarios, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const recentes = [...beneficiarios]
    .sort((a, b) => b.dataCadastro.localeCompare(a.dataCadastro))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-sky-400 px-8 py-6 text-white">
        <h1 className="text-2xl font-bold">Painel Geral</h1>
        <p className="mt-1 text-sm text-sky-100">Visão consolidada do projeto Andorinha</p>
      </div>

      {/* StatCards principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Beneficiários" value={totalBeneficiarios} icon={Users} tone="sky" />
        <StatCard label="Núcleos Ativos" value={nucleosAtivos} icon={Building2} tone="green" />
        <StatCard label="Funcionários Ativos" value={funcionariosAtivos} icon={UsersRound} tone="sky" />
        <StatCard label="Modalidades" value={atividades.length} icon={Dumbbell} tone="green" />
      </div>

      {/* Estatísticas detalhadas + ações rápidas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Beneficiários */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Beneficiários</h3>
            <Link href="/beneficiarios" className="text-xs text-sky-600 hover:underline">Ver todos</Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Ativos</p>
                <p className="text-2xl font-bold text-green-700">{beneficiariosAtivos}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
                <p className="text-xs text-zinc-500">Total cadastrado</p>
                <p className="text-2xl font-bold text-zinc-700">{totalBeneficiarios}</p>
              </div>
            </div>
            <Link
              href="/beneficiarios/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              <UserPlus className="h-4 w-4" />
              Novo beneficiário
            </Link>
          </CardBody>
        </Card>

        {/* Turmas e vagas */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Turmas e Vagas</h3>
            <Link href="/turmas" className="text-xs text-sky-600 hover:underline">Ver turmas</Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center">
                <p className="text-xs text-zinc-500">Turmas</p>
                <p className="text-2xl font-bold text-zinc-700">{turmas.length}</p>
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2.5 text-center">
                <p className="text-xs text-green-700">Vagas livres</p>
                <p className="text-2xl font-bold text-green-700">{vagasLivres}</p>
              </div>
              <div className="rounded-lg bg-sky-50 px-3 py-2.5 text-center">
                <p className="text-xs text-sky-700">Ocupação</p>
                <p className="text-2xl font-bold text-sky-700">{ocupacaoGlobal}%</p>
              </div>
            </div>
            {/* Barra de ocupação */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${ocupacaoGlobal}%` }}
              />
            </div>
            <Link
              href="/turmas/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              <Plus className="h-4 w-4" />
              Nova turma
            </Link>
          </CardBody>
        </Card>

        {/* Funcionários */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Funcionários</h3>
            <Link href="/funcionarios" className="text-xs text-sky-600 hover:underline">Ver todos</Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2.5">
                <p className="text-xs text-green-700">Contratados</p>
                <p className="text-2xl font-bold text-green-700">{funcionariosAtivos}</p>
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-2.5">
                <p className="text-xs text-amber-700">Em licença</p>
                <p className="text-2xl font-bold text-amber-700">{funcionariosLicenca}</p>
              </div>
            </div>
            <Link
              href="/funcionarios/novo"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              <UserCheck className="h-4 w-4" />
              Novo funcionário
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Ações rápidas</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { href: "/beneficiarios/novo",  label: "Novo beneficiário",  icon: UserPlus,      color: "sky"   },
              { href: "/funcionarios/novo",   label: "Novo funcionário",   icon: UserCheck,     color: "green" },
              { href: "/turmas/novo",         label: "Nova turma",         icon: Plus,          color: "sky"   },
              { href: "/inscricoes",          label: "Inscrições",         icon: ClipboardList, color: "amber" },
              { href: "/nucleos/novo",        label: "Novo núcleo",        icon: Building2,     color: "green" },
              { href: "/relatorios",          label: "Relatórios",         icon: Dumbbell,      color: "zinc"  },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center text-xs font-medium transition-colors ${
                  color === "sky"   ? "border-sky-200   bg-sky-50   text-sky-700   hover:bg-sky-100"   :
                  color === "green" ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" :
                  color === "amber" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" :
                                      "border-zinc-200  bg-zinc-50  text-zinc-600  hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Distribuição por modalidade */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Beneficiários por modalidade</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {distribuicaoPorModalidade.map((m) => {
              const pct = totalOcupadas > 0 ? Math.round((m.total / totalOcupadas) * 100) : 0;
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
            {topNucleos.map((n, i) => {
              const pct = beneficiariosAtivos > 0 ? Math.round((n.beneficiariosAtivos / beneficiariosAtivos) * 100) : 0;
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
              {recentes.map((b) => {
                const nucleo = nucleos.find((n) => n.id === b.nucleoId);
                const tone = statusBeneficiarioTone[b.status] ?? "zinc";
                return (
                  <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{b.nomeCompleto}</td>
                    <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? "—"}</td>
                    <td className="px-5 py-3"><Badge tone={tone}>{b.status}</Badge></td>
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

