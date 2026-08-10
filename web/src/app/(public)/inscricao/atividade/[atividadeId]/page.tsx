import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { atividadesApi, turmasApi, nucleosApi } from "@/lib/api/services";
import { SelecionarTurma } from "@/components/inscricao-publica/SelecionarTurma";
import { InstrucoesInscricaoBanner } from "@/components/inscricao-publica/InstrucoesInscricaoBanner";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface InscricaoAtividadePageProps {
  params: Promise<{ atividadeId: string }>;
  searchParams?: Promise<{ nucleoId?: string }>;
}

export default async function InscricaoAtividadePage({ params, searchParams }: InscricaoAtividadePageProps) {
  const { atividadeId } = await params;
  const sParams = searchParams ? await searchParams : {};
  const nucleoIdParam = sParams.nucleoId;

  const atividade = await atividadesApi.get(atividadeId).catch(() => null);

  if (!atividade || atividade.disponivelPreInscricao === false) {
    redirect("/");
  }

  const [turmasRes, nucleosRes] = await Promise.all([
    turmasApi.list({ limit: 100, nucleoId: nucleoIdParam }).catch(() => ({ data: [] })),
    nucleosApi.list({ limit: 50 }).catch(() => ({ data: [] })),
  ]);

  let turmasDaAtividade = turmasRes.data.filter((t) => t.atividadeId === atividadeId);
  if (nucleoIdParam) {
    turmasDaAtividade = turmasDaAtividade.filter((t) => t.nucleoId === nucleoIdParam);
  }

  const nucleo = nucleosRes.data.find((n) => n.id === nucleoIdParam) ||
    nucleosRes.data.find((n) => turmasDaAtividade.some((t) => t.nucleoId === n.id)) ||
    nucleosRes.data[0];

  const breadcrumb = [
    nucleo?.identificacao || "Núcleo Esportivo",
    atividade.nome,
  ];

  return (
    <div className="flex flex-col gap-6">
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

      {/* Banner de Instruções e Informações do Núcleo */}
      <InstrucoesInscricaoBanner nucleo={nucleo} atividade={atividade} />

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-bold text-zinc-900">{atividade.nome}</h1>
        {(atividade.idadeMinima != null || atividade.idadeMaxima != null) && (
          <p className="mt-1 text-sm text-zinc-500">
            Faixa etária permitida:{" "}
            {atividade.idadeMinima != null && atividade.idadeMaxima != null
              ? `${atividade.idadeMinima} a ${atividade.idadeMaxima} anos`
              : atividade.idadeMinima != null
              ? `a partir de ${atividade.idadeMinima} anos`
              : `até ${atividade.idadeMaxima} anos`}
          </p>
        )}
      </div>

      <SelecionarTurma turmas={turmasDaAtividade as any} />
    </div>
  );
}
