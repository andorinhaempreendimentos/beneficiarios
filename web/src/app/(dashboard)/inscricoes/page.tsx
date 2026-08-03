import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { inscricoes } from "@/lib/mock/inscricoes";
import { turmas } from "@/lib/mock/turmas";
import { atividades } from "@/lib/mock/atividades";
import { nucleos } from "@/lib/mock/nucleos";
import { formatarData } from "@/lib/utils";
import type { StatusInscricao } from "@/lib/mock/inscricoes";
import { LinkRow } from "@/components/inscricoes/LinkRow";

const TONE: Record<StatusInscricao, "amber" | "green" | "sky" | "red"> = {
  pendente: "amber",
  aprovada: "green",
  fila_espera: "sky",
  cancelada: "red",
};

const LABEL: Record<StatusInscricao, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  fila_espera: "Fila de espera",
  cancelada: "Cancelada",
};

export default function InscricoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inscrições"
        description="Inscrições públicas recebidas e links de inscrição por tipo"
      />

      {/* Links por tipo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Por núcleo */}
        <Card>
          <div className="border-b border-zinc-200 px-5 py-3">
            <h3 className="text-sm font-medium text-zinc-700">Por núcleo</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Beneficiário escolhe atividade e turma</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {nucleos.filter((n) => n.emFuncionamento).map((n) => (
              <LinkRow
                key={n.id}
                label={n.identificacao}
                tipo={[n.cidade, n.regiao].filter(Boolean).join(" · ")}
                path={`/inscricao/nucleo/${n.id}`}
              />
            ))}
          </div>
        </Card>

        {/* Por atividade */}
        <Card>
          <div className="border-b border-zinc-200 px-5 py-3">
            <h3 className="text-sm font-medium text-zinc-700">Por atividade</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Beneficiário escolhe apenas a turma</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {atividades.map((a) => (
              <LinkRow
                key={a.id}
                label={a.nome}
                tipo="Atividade"
                path={`/inscricao/atividade/${a.id}`}
              />
            ))}
          </div>
        </Card>

        {/* Por turma */}
        <Card>
          <div className="border-b border-zinc-200 px-5 py-3">
            <h3 className="text-sm font-medium text-zinc-700">Por turma</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Turma já pré-definida</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {turmas.map((t) => (
              <LinkRow
                key={t.id}
                label={t.nome}
                tipo="Turma"
                path={`/inscricao/turma/${t.id}`}
              />
            ))}
          </div>
        </Card>

      </div>

      {/* Tabela de inscrições recebidas */}
      <Card>
        <div className="border-b border-zinc-200 px-5 py-3">
          <h3 className="text-sm font-medium text-zinc-700">Inscrições recebidas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Turma</th>
                <th className="px-5 py-3">Celular</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((i) => {
                const turma = turmas.find((t) => t.id === i.turmaId);
                return (
                  <tr key={i.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-800">{i.nomeCompleto}</td>
                    <td className="px-5 py-3 text-zinc-600">
                      <Link href={`/turmas/${i.turmaId}/inscricoes`} className="hover:underline">
                        {turma?.nome ?? "—"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{i.celular}</td>
                    <td className="px-5 py-3 text-zinc-600">{formatarData(i.dataInscricao)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={TONE[i.status]}>{LABEL[i.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {i.status === "pendente" && (
                        <>
                          <button type="button" className="text-green-600 hover:underline">Aprovar</button>
                          <span className="mx-1.5 text-zinc-300">|</span>
                          <button type="button" className="text-red-500 hover:underline">Recusar</button>
                        </>
                      )}
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
