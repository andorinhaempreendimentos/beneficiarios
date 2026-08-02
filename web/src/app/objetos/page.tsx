import Link from "next/link";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { objetos } from "@/lib/mock/objetos";
import { statusObjetoLabel, statusObjetoTone } from "@/lib/status";
import { formatarData } from "@/lib/utils";

export default function ObjetosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Objetos"
        description="Projetos e eventos cadastrados"
        actions={<LinkButton href="/objetos/novo">Novo objeto</LinkButton>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-5 py-3"><input type="checkbox" /></th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Período / Data</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Termo de Fomento</th>
                <th className="px-5 py-3">Cadastrado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {objetos.map((o) => (
                <tr key={o.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3"><input type="checkbox" /></td>
                  <td className="px-5 py-3">
                    <Link href={`/objetos/${o.id}`} className="font-medium text-sky-600 hover:underline">
                      {o.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">
                    {o.tipoDuracao === "pontual" ? "Evento Pontual" : "Período"}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">
                    {o.tipoDuracao === "pontual"
                      ? formatarData(o.dataEvento ?? "")
                      : `${formatarData(o.dataInicio ?? "")} — ${formatarData(o.dataTermino ?? "")}`}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusObjetoTone[o.status]}>{statusObjetoLabel[o.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{o.termoDeFomento ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatarData(o.criadoEm)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/objetos/${o.id}`} className="text-sky-600 hover:underline">Detalhes</Link>
                    <span className="mx-1.5 text-zinc-300">|</span>
                    <Link href={`/objetos/${o.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
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
