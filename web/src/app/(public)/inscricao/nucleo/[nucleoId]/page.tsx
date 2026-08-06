import { ChevronRight, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { nucleosApi, turmasApi, atividadesApi } from "@/lib/api/services";
import { SelecionarAtividade } from "@/components/inscricao-publica/SelecionarAtividade";

interface InscricaoNucleoPageProps {
  params: Promise<{ nucleoId: string }>;
}

export default async function InscricaoNucleoPage({ params }: InscricaoNucleoPageProps) {
  const { nucleoId } = await params;
  const nucleo = await nucleosApi.get(nucleoId).catch(() => null);

  if (!nucleo) redirect("/");

  const [turmasRes, atividadesRes] = await Promise.all([
    turmasApi.list({ nucleoId, limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);

  const turmasDoNucleo = turmasRes.data;
  const atividadesDoNucleo = atividadesRes.data.filter((a) =>
    turmasDoNucleo.some((t) => t.atividadeId === a.id)
  );

  const breadcrumb = ["Núcleo", nucleo.identificacao];

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
        <h1 className="text-xl font-bold text-zinc-900">{nucleo.identificacao}</h1>
        {nucleo.nomeLocal && (
          <p className="mt-1 text-sm text-zinc-500">{nucleo.nomeLocal}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{[nucleo.bairro, nucleo.cidade, nucleo.regiao].filter(Boolean).join(" · ")}</span>
        </div>
      </div>

      <SelecionarAtividade
        atividades={atividadesDoNucleo as any}
        turmas={turmasDoNucleo as any}
        nucleoId={nucleoId}
      />
    </div>
  );
}
