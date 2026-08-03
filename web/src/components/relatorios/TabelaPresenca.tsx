import { Badge, Card, CardHeader } from "@/components/ui";
import { beneficiarios } from "@/lib/mock/beneficiarios";
import { turmas } from "@/lib/mock/turmas";
import { nucleos } from "@/lib/mock/nucleos";
import type { FiltrosState } from "./FiltrosRelatorio";

interface Props { filtros: FiltrosState }

export function TabelaPresenca({ filtros }: Props) {
  const linhas = beneficiarios
    .filter((b) => {
      if (filtros.nucleoId && b.nucleoId !== filtros.nucleoId) return false;
      if (filtros.status && b.status !== filtros.status) return false;
      return true;
    })
    .flatMap((b) =>
      b.turmas
        .filter((vt) => !filtros.turmaId || vt.turmaId === filtros.turmaId)
        .map((vt) => {
          const turma = turmas.find((t) => t.id === vt.turmaId);
          const nucleo = nucleos.find((n) => n.id === b.nucleoId);
          // Presença simulada: mock estático baseado no status
          const presenca = vt.status === "Ativo" ? Math.floor(70 + Math.random() * 30) : Math.floor(10 + Math.random() * 40);
          return { b, vt, turma, nucleo, presenca };
        })
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Frequência / Presença</h3>
          <span className="text-xs text-zinc-400">{linhas.length} vínculo(s)</span>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3">Beneficiário</th>
              <th className="px-5 py-3">Turma</th>
              <th className="px-5 py-3">Núcleo</th>
              <th className="px-5 py-3">Status vínculo</th>
              <th className="px-5 py-3">Presença</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-400">Nenhum resultado.</td></tr>
            )}
            {linhas.map(({ b, vt, turma, nucleo, presenca }, i) => (
              <tr key={`${b.id}-${vt.turmaId}-${i}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-5 py-3 font-medium text-zinc-800">{b.nomeCompleto}</td>
                <td className="px-5 py-3 text-zinc-600">{turma?.nome ?? "—"}</td>
                <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? "—"}</td>
                <td className="px-5 py-3">
                  <Badge tone={vt.status === "Ativo" ? "green" : "zinc"}>{vt.status}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-zinc-100">
                      <div
                        className={`h-1.5 rounded-full ${presenca >= 75 ? "bg-green-500" : presenca >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${presenca}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${presenca >= 75 ? "text-green-700" : presenca >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {presenca}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
