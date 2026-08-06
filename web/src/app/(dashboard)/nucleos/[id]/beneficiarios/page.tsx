import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select, FilterBar, StatCard } from "@/components/ui";
import { nucleosApi, beneficiariosApi, turmasApi } from "@/lib/api/services";
import { statusBeneficiarioTone } from "@/lib/status";
import { calcularIdade } from "@/lib/utils";
import { Users } from "lucide-react";
import type { StatusBeneficiario } from "@/lib/types";

export default async function BeneficiariosDoNucleoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nucleo = await nucleosApi.get(id).catch(() => null);
  if (!nucleo) notFound();

  const [beneficiariosRes, turmasRes] = await Promise.all([
    beneficiariosApi.list({ nucleoId: nucleo.id, limit: 100 }).catch(() => ({ data: [], total: 0 })),
    turmasApi.list({ nucleoId: nucleo.id, limit: 100 }).catch(() => ({ data: [] })),
  ]);

  const beneficiariosDoNucleo = beneficiariosRes.data;
  const turmasDoNucleo = turmasRes.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Beneficiários - ${nucleo.identificacao}`}
        actions={<LinkButton href="/beneficiarios/novo">Novo Beneficiário</LinkButton>}
      />

      <StatCard
        label="Beneficiários ativos"
        value={beneficiariosDoNucleo.filter((b) => b.status === "Aprovado").length}
        tone="green"
        icon={Users}
      />

      <FilterBar>
        <Field label="Nome">
          <Input placeholder="Buscar por nome" />
        </Field>
        <Field label="Matrícula">
          <Input placeholder="0000-0000" />
        </Field>
        <Field label="CPF">
          <Input placeholder="000.000.000-00" />
        </Field>
        <Field label="Data de nascimento">
          <Input type="date" />
        </Field>
        <Field label="Status">
          <Select defaultValue="">
            <option value="">Todos</option>
            <option>Novo cadastro</option>
            <option>Comparecer a sede</option>
            <option>Aguardando seletiva</option>
            <option>Fila de espera</option>
            <option>Desistente</option>
            <option>Aprovado</option>
          </Select>
        </Field>
        <Field label="Atividade">
          <Select defaultValue="">
            <option value="">Todas</option>
            <option>Futebol</option>
            <option>Futsal</option>
            <option>Funcional</option>
            <option>Karatê</option>
            <option>Jiu-Jitsu</option>
          </Select>
        </Field>
        <Field label="Tipo de matrícula">
          <Select defaultValue="">
            <option value="">Todos</option>
            <option>Online</option>
            <option>Interna</option>
          </Select>
        </Field>
        <Field label="Idade mínima">
          <Input type="number" min={0} />
        </Field>
        <Field label="Idade máxima">
          <Input type="number" min={0} />
        </Field>
        <Field label="Data de início">
          <Input type="date" />
        </Field>
        <Field label="Data de fim">
          <Input type="date" />
        </Field>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Matrícula</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Idade</th>
                <th className="px-5 py-3">Atividades</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {beneficiariosDoNucleo.map((b) => {
                const tone = statusBeneficiarioTone[b.status as StatusBeneficiario] ?? "zinc";
                return (
                  <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-500">{b.matricula ?? b.id.substring(0, 8)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={tone}>{b.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900">{b.nomeCompleto}</span>
                        <Badge tone={b.tipoMatricula === "online" ? "sky" : "violet"}>{b.tipoMatricula}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{calcularIdade(b.dataNascimento)} anos</td>
                    <td className="px-5 py-3 text-zinc-600">-</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/beneficiarios/${b.id}`} className="text-sky-600 hover:underline">Acessar</Link>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <Link href={`/beneficiarios/${b.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                    </td>
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
