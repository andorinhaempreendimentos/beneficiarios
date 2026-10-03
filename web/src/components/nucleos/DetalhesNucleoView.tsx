"use client";

import Link from "next/link";
import { 
  ClipboardList, 
  MapPin, 
  Users2, 
  CalendarClock, 
  Package, 
  ClipboardCheck, 
  AlertCircle,
  GraduationCap,
  ArrowRight,
  Search,
  Plus
} from "lucide-react";
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
import { calcularIdade, formatarData } from "@/lib/utils";
import { GradeNucleoWidget } from "@/components/polo/GradeNucleoWidget";
import { normalizarStatusBeneficiario } from "@/lib/status";
import { useAuth } from "@/components/providers/AuthProvider";
import type { NucleoApi, TurmaApi, BeneficiarioApi } from "@/lib/api/services";

interface DetalhesNucleoViewProps {
  nucleo: NucleoApi;
  turmas: TurmaApi[];
  beneficiarios: BeneficiarioApi[];
  totalBeneficiarios: number;
  categorias: any[];
}

export function DetalhesNucleoView({
  nucleo,
  turmas,
  beneficiarios,
  totalBeneficiarios,
  categorias
}: DetalhesNucleoViewProps) {
  const { user } = useAuth();
  const isCoordenador = Boolean((user as any)?.isCoordenador);

  const statusNormalizados = beneficiarios.map((b) => normalizarStatusBeneficiario(b.status));
  const beneficiariosAtivos = statusNormalizados.filter((s) => s === "ativo").length;
  const beneficiariosPendentes = statusNormalizados.filter((s) => s === "pendente").length;
  const beneficiariosInativos = statusNormalizados.filter((s) => s === "inativo").length;

  const totalVagasTotais = turmas.reduce((acc, t) => acc + (t.vagasTotais || 0), 0);
  const totalVagasOcupadas = turmas.reduce((acc, t) => acc + (t.vagasOcupadas || 0), 0);

  // Professores do núcleo extraídos das turmas
  const professoresDoNucleo = Array.from(
    new Set(
      turmas.flatMap((t) => t.responsaveisNomes || []).filter(Boolean)
    )
  );

  if (isCoordenador) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
        {/* Cabeçalho do Coordenador (Sem botão de edição) */}
        <PageHeader
          title={nucleo.identificacao}
          description={nucleo.nomeLocal || `${nucleo.bairro}, ${nucleo.cidade}`}
        />

        {/* Resumo em cards superiores para o Coordenador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Beneficiários */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Beneficiários</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Users2 className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{totalBeneficiarios}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <span className="text-emerald-600 font-medium">{beneficiariosAtivos} ativos</span>
                <span>•</span>
                <span>{beneficiariosPendentes} pendentes</span>
              </div>
            </div>
          </div>

          {/* Card 2: Professores */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Professores</span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div>
              {professoresDoNucleo.length > 0 ? (
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {professoresDoNucleo[0]}
                  </p>
                  {professoresDoNucleo.length > 1 && (
                    <p className="text-xs text-zinc-500">
                      +{professoresDoNucleo.length - 1} outro(s): {professoresDoNucleo.slice(1).join(", ")}
                    </p>
                  )}
                  {professoresDoNucleo.length === 1 && (
                    <p className="text-xs text-zinc-500">Professor responsável</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-zinc-400 italic">Nenhum professor alocado</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Aguardando designação</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Turmas e Vagas */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Turmas</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <CalendarClock className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{turmas.length}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {totalVagasOcupadas} de {totalVagasTotais} vagas ocupadas
              </p>
            </div>
          </div>

          {/* Card 4: Localização */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Localização</span>
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {nucleo.bairro || nucleo.cidade}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                {nucleo.endereco}{nucleo.numero ? `, ${nucleo.numero}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Chamada Principal: Iniciar Supervisão no Núcleo */}
        <div className="rounded-2xl border-2 border-sky-500/20 bg-linear-to-r from-sky-500/10 via-indigo-500/5 to-transparent p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                Ação de Campo
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Pronto para vistoriar este núcleo?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Registre a presença do professor, assiduidade dos beneficiários e avaliação física dos materiais.
            </p>
          </div>
          <Link
            href={`/supervisoes/nova?nucleoId=${nucleo.id}`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <ClipboardCheck className="h-5 w-5" />
            <span>Iniciar uma supervisão neste núcleo</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grade de Aulas do Núcleo */}
        <GradeNucleoWidget turmas={turmas} categorias={categorias} />

        {/* Resumo de Turmas (somente leitura para o Coordenador) */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Turmas do Núcleo</h3>
            <span className="text-xs text-zinc-500">{turmas.length} turmas cadastradas</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Professores / Responsáveis</th>
                  <th className="px-5 py-3">Vagas</th>
                  <th className="px-5 py-3">Início</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-5 py-3 text-zinc-500">{turma.id.substring(0, 8)}</td>
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">{turma.nome}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300 font-medium">
                      {(turma.responsaveisNomes && turma.responsaveisNomes.length > 0)
                        ? turma.responsaveisNomes.join(", ")
                        : (turma.responsaveis ?? []).join(", ") || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="sky">{turma.vagasOcupadas}/{turma.vagasTotais}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{turma.dataInicio ? formatarData(turma.dataInicio) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Atalhos de campo: Estoque, Histórico de Supervisões e Pendências */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/estoque/nucleos/${nucleo.id}`}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xs transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 group-hover:bg-sky-100 transition-colors shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Estoque do Núcleo</p>
              <p className="text-xs text-zinc-400">Materiais e uniformes</p>
            </div>
          </Link>
          <Link
            href={`/supervisoes?nucleoId=${nucleo.id}`}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-xs transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:bg-violet-100 transition-colors shrink-0">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Supervisões Realizadas</p>
              <p className="text-xs text-zinc-400">Histórico de supervisões</p>
            </div>
          </Link>
          <Link
            href={`/pendencias-gerais?nucleoId=${nucleo.id}`}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-red-300 dark:hover:border-red-700 hover:shadow-xs transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 group-hover:bg-red-100 transition-colors shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Pendências</p>
              <p className="text-xs text-zinc-400">Ocorrências registradas</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Visualização de Administrador / Gestor Padrão
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

      <GradeNucleoWidget turmas={turmas} categorias={categorias} />

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
              {turmas.map((turma) => (
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
              {beneficiarios.map((b) => (
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
            <p className="text-xs text-zinc-400">Supervisões realizadas</p>
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
