import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardList, MapPin, Plus, Search, Users2, CalendarClock } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { DonutChart } from "@/components/charts/DonutChart";
import { getNucleoById } from "@/lib/mock/nucleos";
import { getTurmasByNucleo } from "@/lib/mock/turmas";
import { getBeneficiariosByNucleo } from "@/lib/mock/beneficiarios";
import { calcularIdade, formatarData } from "@/lib/utils";

export default async function DetalhesNucleoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nucleo = getNucleoById(id);
  if (!nucleo) notFound();

  const turmasDoNucleo = getTurmasByNucleo(nucleo.id);
  const beneficiariosDoNucleo = getBeneficiariosByNucleo(nucleo.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={nucleo.identificacao}
        description={nucleo.nomeLocal}
        actions={<LinkButton href={`/nucleos/${nucleo.id}/editar`} variant="outline">Editar núcleo</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Detalhes do Núcleo</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-3 text-sm">
            <div className="flex items-start gap-2 text-zinc-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <span>
                {nucleo.endereco}, {nucleo.numero} - {nucleo.bairro}, {nucleo.cidade}
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600">
              <Users2 className="h-4 w-4 text-zinc-400" />
              <span>{nucleo.totalBeneficiarios} beneficiários cadastrados</span>
            </div>
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              Precisa de ajuda? Contate o suporte pelo canal interno de atendimento.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Beneficiários</h3>
          </CardHeader>
          <CardBody className="flex justify-center">
            <DonutChart
              labels={["Ativos", "Inativos"]}
              series={[nucleo.beneficiariosAtivos, nucleo.beneficiariosInativos]}
              colors={["#16a34a", "#dc2626"]}
              height={200}
            />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <WidgetCard icon={ClipboardList} title="Controle Interno" count={4} />
          <WidgetCard icon={CalendarClock} title="Eventos" count={2} />
          <WidgetCard icon={Users2} title="Pessoal" count={3} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Turmas</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Listar turmas</Button>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Cadastrar turma
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Responsáveis</th>
                <th className="px-5 py-3">Horário</th>
                <th className="px-5 py-3">Dias</th>
                <th className="px-5 py-3">Beneficiários</th>
                <th className="px-5 py-3">Início</th>
                <th className="px-5 py-3">Duração</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmasDoNucleo.map((turma) => (
                <tr key={turma.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500">{turma.id}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{turma.nome}</td>
                  <td className="px-5 py-3 text-zinc-600">{turma.responsaveis.join(", ")}</td>
                  <td className="px-5 py-3 text-zinc-600">{turma.horario}</td>
                  <td className="px-5 py-3 text-zinc-600">{turma.dias.join(", ")}</td>
                  <td className="px-5 py-3">
                    <Badge tone="sky">{turma.qtdBeneficiarios}/{turma.vagasTotais}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(turma.dataInicio)}</td>
                  <td className="px-5 py-3 text-zinc-600">{turma.duracao}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-sky-600 hover:underline">Acessar</button>
                    <span className="mx-1.5 text-zinc-300">|</span>
                    <button className="text-zinc-500 hover:underline">Exportar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Beneficiários</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input placeholder="Buscar ficha por CPF" className="pl-9" />
            </div>
            <Link href={`/nucleos/${nucleo.id}/beneficiarios`}>
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
            <Link href="/beneficiarios/novo">
              <Button size="sm"><Plus className="h-4 w-4" /> Cadastrar</Button>
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Idade</th>
                <th className="px-5 py-3">Atividades</th>
              </tr>
            </thead>
            <tbody>
              {beneficiariosDoNucleo.map((b) => (
                <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500">{b.matricula}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{b.nomeCompleto}</td>
                  <td className="px-5 py-3 text-zinc-600">{calcularIdade(b.dataNascimento)} anos</td>
                  <td className="px-5 py-3 text-zinc-600">
                    {b.turmas.length > 0
                      ? turmasDoNucleo.find((t) => t.id === b.turmas[0]?.turmaId)?.nome ?? "-"
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function WidgetCard({ icon: Icon, title, count }: { icon: typeof ClipboardList; title: string; count: number }) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700">{title}</p>
            <p className="text-xs text-zinc-500">{count} registros</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">Ver</Button>
      </CardBody>
    </Card>
  );
}
