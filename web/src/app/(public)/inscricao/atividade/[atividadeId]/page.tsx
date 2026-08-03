import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { atividades } from "@/lib/mock/atividades";
import { turmas } from "@/lib/mock/turmas";
import { organizacoes } from "@/lib/mock/organizacoes";
import { objetos } from "@/lib/mock/objetos";
import { SelecionarTurma } from "@/components/inscricao-publica/SelecionarTurma";

interface InscricaoAtividadePageProps {
  params: Promise<{ atividadeId: string }>;
}

export default async function InscricaoAtividadePage({ params }: InscricaoAtividadePageProps) {
  const { atividadeId } = await params;
  const atividade = atividades.find((a) => a.id === atividadeId);

  if (!atividade) redirect("/");

  const turmasDaAtividade = turmas.filter((t) => t.atividadeId === atividadeId);
  const organizacao = organizacoes.find((o) => o.objetoId != null);
  const objeto = organizacao ? objetos.find((obj) => obj.id === organizacao.objetoId) : undefined;

  const breadcrumb = [
    objeto?.nome ?? "—",
    organizacao?.nome ?? "—",
    atividade.nome,
  ];

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Hierarquia da inscrição">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-400">
          {breadcrumb.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
              <span className={i === breadcrumb.length - 1 ? "font-semibold text-zinc-700" : ""}>
                {item}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-bold text-zinc-900">{atividade.nome}</h1>
        {(atividade.idadeMinima != null || atividade.idadeMaxima != null) && (
          <p className="mt-1 text-sm text-zinc-500">
            Faixa etária:{" "}
            {atividade.idadeMinima != null && atividade.idadeMaxima != null
              ? `${atividade.idadeMinima} a ${atividade.idadeMaxima} anos`
              : atividade.idadeMinima != null
              ? `a partir de ${atividade.idadeMinima} anos`
              : `até ${atividade.idadeMaxima} anos`}
          </p>
        )}
      </div>

      <SelecionarTurma turmas={turmasDaAtividade} />
    </div>
  );
}
