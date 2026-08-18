import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardList, MapPin, Plus, Search, Users2, CalendarClock, Package, ClipboardCheck, AlertCircle } from "lucide-react";
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
import { nucleosApi, turmasApi, beneficiariosApi } from "@/lib/api/services";
import { calcularIdade, formatarData } from "@/lib/utils";
import { normalizarStatusBeneficiario } from "@/lib/status";

export default async function DetalhesNucleoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nucleo = await nucleosApi.get(id).catch(() => null);
  if (!nucleo) notFound();

  const [turmasRes, beneficiariosRes] = await Promise.all([
    turmasApi.list({ nucleoId: nucleo.id, limit: 100 }).catch(() => ({ data: [] })),
    beneficiariosApi.list({ nucleoId: nucleo.id, limit: 100 }).catch(() => ({ data: [], total: 0 })),
  ]);

  const turmasDoNucleo = turmasRes.data;
  const beneficiariosDoNucleo = beneficiariosRes.data;
  const totalBeneficiarios = beneficiariosRes.total;
  const statusNormalizados = beneficiariosDoNucleo.map((b) => normalizarStatusBeneficiario(b.status));
  const beneficiariosAtivos = statusNormalizados.filter((s) => s === "ativo").length;
  const beneficiariosPendentes = statusNormalizados.filter((s) => s === "pendente").length;
  const beneficiariosInativos = statusNormalizados.filter((s) => s === "inativo").length;

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
              <span>{totalBeneficiarios} beneficiários cadastrados</span>
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
              labels={["Ativos", "Pendentes", "Inativos"]}
              series={[beneficiariosAtivos, beneficiariosPendentes, beneficiariosInativos]}
              colors={["#16a34a", "#f59e0b", "#71717a"]}
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
                  <td className="px-5 py-3 text-zinc-500">{turma.id.substring(0, 8)}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{turma.nome}</td>
                  <td className="px-5 py-3 text-zinc-600 font-medium">
                    {(turma.responsaveisNomes && turma.responsaveisNomes.length > 0)
                      ? turma.responsaveisNomes.join(", ")
                      : (turma.responsaveis ?? []).join(", ") || "-"}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">-</td>
                  <td className="px-5 py-3 text-zinc-600">-</td>
                  <td className="px-5 py-3">
                    <Badge tone="sky">0/{turma.vagasTotais}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{turma.dataInicio ? formatarData(turma.dataInicio) : "-"}</td>
                  <td className="px-5 py-3 text-zinc-600">-</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/turmas/${turma.id}`} className="text-sky-600 hover:underline">Acessar</Link>
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
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {beneficiariosDoNucleo.map((b) => (
                <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500">{b.matricula ?? b.id.substring(0, 8)}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{b.nomeCompleto}</td>
                  <td className="px-5 py-3 text-zinc-600">{calcularIdade(b.dataNascimento)} anos</td>
                  <td className="px-5 py-3 text-zinc-600">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Acesso rápido: Estoque e Supervisões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/estoque/nucleos/${nucleo.id}`}
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-sky-300 hover:shadow-sm transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">Estoque</p>
            <p className="text-xs text-zinc-400">Materiais disponíveis</p>
          </div>
        </Link>
        <Link
          href={`/supervisoes?nucleoId=${nucleo.id}`}
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-sky-300 hover:shadow-sm transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors shrink-0">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">Supervisões</p>
            <p className="text-xs text-zinc-400">Visitas realizadas</p>
          </div>
        </Link>
        <Link
          href={`/pendencias-gerais?nucleoId=${nucleo.id}`}
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-red-300 hover:shadow-sm transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">Pendências</p>
            <p className="text-xs text-zinc-400">Ocorrências em aberto</p>
          </div>
        </Link>
      </div>
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
