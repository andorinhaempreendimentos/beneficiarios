import { Building2, Dumbbell, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { RadialChart } from "@/components/charts/RadialChart";
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
  const funcionariosAtivos = funcionarios.filter((f) => f.status === "contratado").length;

  const totalVagas = turmas.reduce((acc, t) => acc + t.vagasTotais, 0);
  const totalOcupadas = turmas.reduce((acc, t) => acc + t.qtdBeneficiarios, 0);
  const ocupacaoGlobal = totalVagas > 0 ? Math.round((totalOcupadas / totalVagas) * 100) : 0;

  const topNucleos = [...nucleos]
    .sort((a, b) => b.beneficiariosAtivos - a.beneficiariosAtivos)
    .slice(0, 5);

  const statusFunc = {
    contratado: funcionarios.filter((f) => f.status === "contratado").length,
    demitido: funcionarios.filter((f) => f.status === "demitido").length,
    licenca: funcionarios.filter((f) =>
      f.status === "licenca_medica" || f.status === "licenca_maternidade" || f.status === "afastado_inss"
    ).length,
    pendente: funcionarios.filter((f) => f.status === "pendente" || f.status === "voluntario").length,
  };

  const distribuicaoPorModalidade = atividades
    .map((a) => ({
      nome: a.nome,
      total: turmas.filter((t) => t.atividadeId === a.id).reduce((acc, t) => acc + t.qtdBeneficiarios, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recentes = [...beneficiarios]
    .sort((a, b) => b.dataCadastro.localeCompare(a.dataCadastro))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-sky-400 px-8 py-6 text-white">
        <h1 className="text-2xl font-bold">Painel Geral</h1>
        <p className="mt-1 text-sm text-sky-100">Visão consolidada do projeto Andorinha</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Beneficiários" value={totalBeneficiarios} icon={Users} tone="sky" />
        <StatCard label="Núcleos Ativos" value={nucleosAtivos} icon={Building2} tone="green" />
        <StatCard label="Funcionários Ativos" value={funcionariosAtivos} icon={UsersRound} tone="sky" />
        <StatCard label="Modalidades" value={atividades.length} icon={Dumbbell} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Ocupação Global</h3>
          </CardHeader>
          <CardBody className="flex justify-center">
            <RadialChart label="Ocupação" value={ocupacaoGlobal} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Beneficiários por Núcleo</h3>
          </CardHeader>
          <CardBody>
            <BarChart
              categories={topNucleos.map((n) => n.identificacao)}
              data={topNucleos.map((n) => n.beneficiariosAtivos)}
              horizontal
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Status Funcionários</h3>
          </CardHeader>
          <CardBody className="flex justify-center">
            <DonutChart
              labels={["Contratados", "Desligados", "Licença", "Pendente/Vol."]}
              series={[statusFunc.contratado, statusFunc.demitido, statusFunc.licenca, statusFunc.pendente]}
              colors={["#0284c7", "#dc2626", "#f59e0b", "#71717a"]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Distribuição por Modalidade</h3>
        </CardHeader>
        <CardBody>
          <BarChart
            categories={distribuicaoPorModalidade.map((m) => m.nome)}
            data={distribuicaoPorModalidade.map((m) => m.total)}
            color="#0d9488"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Cadastros Recentes</h3>
          <Link href="/beneficiarios" className="text-sm text-sky-600 hover:underline">
            Ver todos
          </Link>
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
                    <td className="px-5 py-3">
                      <Badge tone={tone}>{b.status}</Badge>
                    </td>
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
