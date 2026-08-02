import Link from "next/link";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { atividades } from "@/lib/mock/atividades";
import { formatarData } from "@/lib/utils";

const TURNO_LABEL: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

export default function AtividadesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Atividades"
        description="Cursos e modalidades oferecidas"
        actions={<LinkButton href="/atividades/novo">Nova atividade</LinkButton>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-5 py-3"><input type="checkbox" /></th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Turnos</th>
                <th className="px-5 py-3">Turmas</th>
                <th className="px-5 py-3">Ativa na pré inscrição</th>
                <th className="px-5 py-3">Perguntas adicionais</th>
                <th className="px-5 py-3">Cadastrado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {atividades.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3"><input type="checkbox" /></td>
                  <td className="px-5 py-3 text-zinc-500">{a.id}</td>
                  <td className="px-5 py-3">
                    <Link href={`/atividades/${a.id}`} className="font-medium text-sky-600 hover:underline">
                      {a.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.turnos.map((t) => (
                        <Badge key={t} tone="zinc">{TURNO_LABEL[t]}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="sky">{a.qtdTurmas}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{a.disponivelPreInscricao ? "Sim" : "Não"}</td>
                  <td className="px-5 py-3 text-zinc-600">{a.perguntas.length}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(a.criadoEm)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/atividades/${a.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                    <span className="mx-1.5 text-zinc-300">|</span>
                    <Link href={`/atividades/${a.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
