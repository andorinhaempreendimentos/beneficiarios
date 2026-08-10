import Link from "next/link";
import { CalendarDays, Clock, Users } from "lucide-react";
import type { Atividade, Turma } from "@/lib/types";

interface SelecionarAtividadeProps {
  atividades: Atividade[];
  turmas: Turma[];
  nucleoId: string;
}

export function SelecionarAtividade({ atividades, turmas, nucleoId }: SelecionarAtividadeProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Escolha uma atividade</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Selecione a modalidade em que deseja se inscrever.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {atividades.map((a) => {
          const turmasDaAtividade = turmas.filter((t) => t.atividadeId === a.id);
          const vagasDisponiveis = turmasDaAtividade.reduce(
            (acc, t) => acc + Math.max(0, Number(t.vagasTotais || 0) - Number(t.qtdBeneficiarios || 0)),
            0
          );

          const href = turmasDaAtividade.length === 1
            ? `/inscricao/turma/${turmasDaAtividade[0].id}`
            : `/inscricao/atividade/${a.id}${nucleoId ? `?nucleoId=${nucleoId}` : ""}`;

          return (
            <Link
              key={a.id}
              href={href}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-zinc-900">{a.nome}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${vagasDisponiveis > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : "Sem vagas"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                {(a.idadeMinima != null || a.idadeMaxima != null) && (
                  <span>
                    {a.idadeMinima != null && a.idadeMaxima != null
                      ? `${a.idadeMinima}–${a.idadeMaxima} anos`
                      : a.idadeMinima != null
                      ? `a partir de ${a.idadeMinima} anos`
                      : `até ${a.idadeMaxima} anos`}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {turmasDaAtividade.length} turma{turmasDaAtividade.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Grade de horários resumida */}
              <div className="flex flex-col gap-1">
                {turmasDaAtividade.map((t) => {
                  const diasTexto = Array.isArray(t.dias)
                    ? t.dias.join(", ")
                    : Array.isArray(t.slots) && t.slots.length > 0
                    ? Array.from(new Set(t.slots.map((s: any) => s.dia).filter(Boolean))).join(", ")
                    : "";

                  const horarioTexto = t.horario || (Array.isArray(t.slots) && t.slots.length > 0
                    ? `${t.slots[0].inicio || 8}h–${t.slots[0].fim || 10}h`
                    : "");

                  if (!diasTexto && !horarioTexto) return null;

                  return (
                    <div key={t.id} className="flex items-center gap-2 text-xs text-zinc-400">
                      {diasTexto && (
                        <>
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          <span>{diasTexto}</span>
                        </>
                      )}
                      {horarioTexto && (
                        <>
                          <Clock className="h-3 w-3 shrink-0 ml-1" />
                          <span>{horarioTexto}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}

        {atividades.length === 0 && (
          <p className="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-400">
            Nenhuma atividade disponível para inscrição neste núcleo.
          </p>
        )}
      </div>
    </div>
  );
}
