import { MapPin } from "lucide-react";
import Link from "next/link";
import { nucleosApi } from "@/lib/api/services";
import { InstrucoesInscricaoBanner } from "@/components/inscricao-publica/InstrucoesInscricaoBanner";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InscricaoPage() {
  const nucleosRes = await nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  const nucleosDisponiveis = nucleosRes.data.filter(
    (n) => n.emFuncionamento !== false && n.disponivelPreInscricao !== false
  );

  // Agrupar por região
  const porRegiao = nucleosDisponiveis.reduce<Record<string, typeof nucleosDisponiveis>>((acc, n) => {
    const regiao = n.regiao || "Outras Regiões";
    if (!acc[regiao]) acc[regiao] = [];
    acc[regiao].push(n);
    return acc;
  }, {});

  const regioes = Object.keys(porRegiao).sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Inscrição Pública</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Escolha o núcleo mais próximo de você para iniciar a inscrição.
        </p>
      </div>

      <InstrucoesInscricaoBanner tipoLink="geral" etapaAtual={1} />

      <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-sky-700" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-sky-900">
            Núcleos disponíveis
          </h2>
        </div>
        <p className="text-xs text-sky-700/70">
          {nucleosDisponiveis.length} núcleo{nucleosDisponiveis.length !== 1 ? "s" : ""} com inscrições abertas.
        </p>
      </div>

      {regioes.map((regiao) => (
        <div key={regiao} className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-zinc-700 border-b border-zinc-200 pb-2">
            {regiao}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {porRegiao[regiao].map((n) => (
              <Link
                key={n.id}
                href={`/inscricao/nucleo/${n.id}`}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="flex flex-col gap-1">
                  <span className="inline-block w-fit rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                    Núcleo
                  </span>
                  <span className="font-medium text-zinc-900">{n.identificacao}</span>
                </div>
                {n.nomeLocal && (
                  <span className="text-xs text-zinc-500">{n.nomeLocal}</span>
                )}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{[n.bairro, n.cidade].filter(Boolean).join(", ")}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {nucleosDisponiveis.length === 0 && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-400">
          Nenhum núcleo disponível para inscrição no momento.
        </p>
      )}
    </div>
  );
}
