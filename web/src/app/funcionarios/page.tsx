import Link from "next/link";
import { UserCheck, UserX } from "lucide-react";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select, FilterBar, StatCard } from "@/components/ui";
import { funcionarios } from "@/lib/mock/funcionarios";
import { statusFuncionarioLabel, statusFuncionarioTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

export default function FuncionariosPage() {
  const admitidos = funcionarios.filter((f) => f.status === "contratado" || f.status === "voluntario");
  const desligados = funcionarios.filter((f) => f.status === "demitido");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Funcionários"
        description="Gestão de pessoal (RH)"
        actions={<LinkButton href="/funcionarios/novo">Cadastrar Novo Funcionário</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Admitidos" value={admitidos.length} tone="sky" icon={UserCheck} />
        <StatCard label="Desligados" value={desligados.length} tone="red" icon={UserX} />
      </div>

      <FilterBar>
        <Field label="Buscar">
          <Input placeholder="Nome ou CPF" />
        </Field>
        <Field label="Alocado em">
          <Select defaultValue="">
            <option value="">Todos</option>
            <option>Administração</option>
            <option>Múlti. núcleos</option>
          </Select>
        </Field>
        <Field label="Função">
          <Select defaultValue="">
            <option value="">Todas</option>
            <option>Articulador social</option>
            <option>Coordenador de núcleo</option>
            <option>Coordenador de projeto</option>
            <option>Coordenador de setor</option>
            <option>Instrutor</option>
            <option>Monitor</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select defaultValue="">
            <option value="">Todos</option>
            <option>Contratado</option>
            <option>Demitido</option>
          </Select>
        </Field>
        <Field label="Data de admissão de">
          <Input type="date" />
        </Field>
        <Field label="Até">
          <Input type="date" />
        </Field>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Matrícula</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">CPF</th>
                <th className="px-5 py-3">Função</th>
                <th className="px-5 py-3">Admissão</th>
                <th className="px-5 py-3">Alocação</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f) => (
                <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500">{f.matricula}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{f.nomeCompleto}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusFuncionarioTone[f.status]}>{statusFuncionarioLabel[f.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{f.cpfCnpj ?? "-"}</td>
                  <td className="px-5 py-3 text-zinc-600">{f.funcao}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(f.dataAdmissao)}</td>
                  <td className="px-5 py-3 text-zinc-600">{f.alocadoEm}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/funcionarios/${f.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                    <span className="mx-1.5 text-zinc-300">|</span>
                    <Link href={`/funcionarios/${f.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
