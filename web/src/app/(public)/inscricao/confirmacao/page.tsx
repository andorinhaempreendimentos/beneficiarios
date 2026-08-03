import { CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface ConfirmacaoPageProps {
  searchParams: { turmaId?: string; tipo?: "aprovada" | "pendente" | "fila" };
}

export default function ConfirmacaoPage({ searchParams }: ConfirmacaoPageProps) {
  const tipo = searchParams.tipo ?? "aprovada";

  if (tipo === "fila") {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-zinc-900">Você está na fila de espera</h1>
          <p className="text-zinc-500 max-w-md">
            As vagas desta turma estão esgotadas no momento. Você foi adicionado à fila de espera
            e será notificado assim que uma vaga for liberada.
          </p>
        </div>
        <div className="w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Guarde o comprovante desta inscrição. Caso não seja contatado em 30 dias, a inscrição
          será cancelada automaticamente.
        </div>
        <Link href="#" className="text-sm text-sky-600 hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const aprovada = tipo === "aprovada";

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${aprovada ? "bg-green-100" : "bg-sky-100"}`}>
        <CheckCircle className={`h-8 w-8 ${aprovada ? "text-green-600" : "text-sky-600"}`} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-900">
          {aprovada ? "Inscrição confirmada!" : "Inscrição recebida!"}
        </h1>
        <p className="text-zinc-500 max-w-md">
          {aprovada
            ? "Sua inscrição foi aprovada automaticamente. Compareça no local e horário da sua turma."
            : "Sua inscrição foi recebida e está aguardando aprovação. Você será notificado em breve."}
        </p>
      </div>

      <div className={`w-full max-w-sm rounded-xl border p-4 text-sm ${aprovada ? "border-green-200 bg-green-50 text-green-800" : "border-sky-200 bg-sky-50 text-sky-800"}`}>
        {aprovada
          ? "Inscrição aprovada. Apresente este comprovante no primeiro dia de atividade."
          : "Status: Pendente de aprovação. Acompanhe por e-mail ou celular."}
      </div>

      <Link href="#" className="text-sm text-sky-600 hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
