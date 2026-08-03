import { CalendarDays, CheckCircle, Clock, Users, XCircle } from "lucide-react";
import Link from "next/link";
import type { Turma } from "@/lib/types";

interface SelecionarTurmaProps {
  turmas: Turma[];
  titulo?: string;
}

export function SelecionarTurma({ turmas, titulo = "Escolha uma turma" }: SelecionarTurmaProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{titulo}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Selecione a turma com o horário que melhor se encaixa na sua rotina.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {turmas.map((t) => {
          const vagasLivres = t.vagasTotais - t.qtdBeneficiarios;
          const cheia = vagasLivres <= 0;

          return (
            <Link
              key={t.id}
              href={`/inscricao/turma/${t.id}`}
              className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                cheia
                  ? "border-zinc-200 bg-zinc-50 opacity-70 pointer-events-none"
                  : "border-zinc-200 bg-white hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-zinc-900">{t.nome}</span>
                <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t.horario}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t.dias.join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {cheia ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-500">Vagas esgotadas</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      {vagasLivres} vaga{vagasLivres !== 1 ? "s" : ""} disponível
                    </span>
                    <Users className="ml-2 h-4 w-4 text-zinc-300" />
                    <span className="text-sm text-zinc-400">{t.qtdBeneficiarios}/{t.vagasTotais}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}

        {turmas.length === 0 && (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-400">
            Nenhuma turma disponível para esta atividade.
          </p>
        )}
      </div>
    </div>
  );
}
