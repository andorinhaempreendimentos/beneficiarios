import { Users } from "lucide-react";
import Link from "next/link";

interface TurmaCheiaSectionProps {
  vagasTotal: number;
  turmaId: string;
}

function TurmaCheiaSection({ vagasTotal, turmaId }: TurmaCheiaSectionProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <Users className="h-8 w-8 text-zinc-500" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-900">Turma com vagas esgotadas</h1>
        <p className="text-zinc-500 max-w-md">
          Todas as {vagasTotal} vagas desta turma já estão ocupadas.
          Você pode entrar na fila de espera e será avisado se uma vaga for liberada.
        </p>
      </div>
      <form action={`/inscricao/confirmacao`} method="GET">
        <input type="hidden" name="turmaId" value={turmaId} />
        <input type="hidden" name="tipo" value="fila" />
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Entrar na fila de espera
        </button>
      </form>
      <Link href="#" className="text-sm text-zinc-500 hover:underline">
        Cancelar
      </Link>
    </div>
  );
}

export { TurmaCheiaSection };
