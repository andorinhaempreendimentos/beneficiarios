import { Badge, Card, CardHeader } from "@/components/ui";
import { beneficiarios } from "@/lib/mock/beneficiarios";
import { turmas } from "@/lib/mock/turmas";
import { nucleos } from "@/lib/mock/nucleos";
import { atividades } from "@/lib/mock/atividades";
import { formatarData, calcularIdade } from "@/lib/utils";
import type { FiltrosState } from "./FiltrosRelatorio";
import type { StatusBeneficiario } from "@/lib/types";

const TONE: Record<StatusBeneficiario, "green" | "amber" | "sky" | "zinc" | "red"> = {
  "Aprovado": "green",
  "Aguardando seletiva": "amber",
  "Novo cadastro": "sky",
  "Comparecer a sede": "amber",
  "Fila de espera": "zinc",
  "Desistente": "red",
};

interface Props { filtros: FiltrosState }

export function TabelaParticipacao({ filtros }: Props) {
  const linhas = beneficiarios
    .filter((b) => {
      if (filtros.nucleoId && b.nucleoId !== filtros.nucleoId) return false;
      if (filtros.status && b.status !== filtros.status) return false;
      if (filtros.turmaId && !b.turmas.some((t) => t.turmaId === filtros.turmaId)) return false;
      if (filtros.atividadeId) {
        const turmasAtiv = turmas.filter((t) => t.atividadeId === filtros.atividadeId).map((t) => t.id);
        if (!b.turmas.some((t) => turmasAtiv.includes(t.turmaId))) return false;
      }
      return true;
    })
    .map((b) => {
      const nucleo = nucleos.find((n) => n.id === b.nucleoId);
      const vinculosAtivos = b.turmas.filter((vt) => vt.status === "Ativo");
      const turmasNomes = vinculosAtivos.map((vt) => {
        const t = turmas.find((tt) => tt.id === vt.turmaId);
        const a = t ? atividades.find((at) => at.id === t.atividadeId) : undefined;
        return a?.nome ?? t?.nome ?? "—";
      });
      return { b, nucleo, turmasNomes };
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Participação de Beneficiários</h3>
          <span className="text-xs text-zinc-400">{linhas.length} registro(s)</span>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">CPF</th>
              <th className="px-5 py-3">Idade</th>
              <th className="px-5 py-3">Núcleo</th>
              <th className="px-5 py-3">Atividade(s)</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Matrícula</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-zinc-400">Nenhum resultado com os filtros selecionados.</td></tr>
            )}
            {linhas.map(({ b, nucleo, turmasNomes }) => (
              <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-5 py-3 font-medium text-zinc-800">{b.nomeCompleto}</td>
                <td className="px-5 py-3 text-zinc-500">{b.cpf ?? "—"}</td>
                <td className="px-5 py-3 text-zinc-600">{calcularIdade(b.dataNascimento)}</td>
                <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? "—"}</td>
                <td className="px-5 py-3 text-zinc-600">{turmasNomes.join(", ") || "—"}</td>
                <td className="px-5 py-3"><Badge tone={TONE[b.status]}>{b.status}</Badge></td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-400">{b.matricula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
