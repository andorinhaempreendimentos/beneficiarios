import { CalendarDays, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { turmas } from "@/lib/mock/turmas";
import { nucleos } from "@/lib/mock/nucleos";
import { atividades } from "@/lib/mock/atividades";
import { organizacoes } from "@/lib/mock/organizacoes";
import { objetos } from "@/lib/mock/objetos";
import { InscricaoPublicaForm } from "@/components/inscricao-publica/InscricaoPublicaForm";
import { TurmaCheiaSection } from "@/components/inscricao-publica/TurmaCheiaSection";

interface InscricaoTurmaPageProps {
  params: Promise<{ turmaId: string }>;
}

export default async function InscricaoTurmaPage({ params }: InscricaoTurmaPageProps) {
  const { turmaId } = await params;
  const turma = turmas.find((t) => t.id === turmaId);

  if (!turma) redirect("/");

  const nucleo = nucleos.find((n) => n.id === turma.nucleoId);
  const atividade = atividades.find((a) => a.id === turma.atividadeId);
  const organizacao = organizacoes.find((o) => o.objetoId != null);
  const objeto = organizacao ? objetos.find((obj) => obj.id === organizacao.objetoId) : undefined;
  const vagasLivres = turma.vagasTotais - turma.qtdBeneficiarios;
  const turmaCheia = vagasLivres <= 0;

  const breadcrumb = [
    objeto?.nome ?? "—",
    organizacao?.nome ?? "—",
    atividade?.nome ?? "—",
    turma.nome,
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
        <h1 className="text-xl font-bold text-zinc-900">{turma.nome}</h1>
        {nucleo && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{nucleo.identificacao}</span>
            {(nucleo.cidade || nucleo.regiao) && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {[nucleo.cidade, nucleo.regiao].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>{turma.horario}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600">
            <CalendarDays className="h-4 w-4 text-zinc-400" />
            <span>{turma.dias.join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Users className="h-4 w-4 text-zinc-400" />
            {turmaCheia ? (
              <span className="font-medium text-red-600">Vagas esgotadas</span>
            ) : (
              <span>
                <span className="font-medium text-green-700">{vagasLivres}</span>
                {" "}de {turma.vagasTotais} vagas disponíveis
              </span>
            )}
          </div>
        </div>
      </div>

      {turmaCheia ? (
        <TurmaCheiaSection vagasTotal={turma.vagasTotais} turmaId={turma.id} />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Formulário de Inscrição</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Preencha os dados abaixo para se inscrever. Campos marcados com{" "}
              <span className="text-red-500">*</span> são obrigatórios.
            </p>
          </div>
          <InscricaoPublicaForm turmaId={turmaId} />
        </>
      )}
    </div>
  );
}
