import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { nucleosApi } from "@/lib/api/services";
import { InscricaoNucleoSimplificadaWizard } from "@/components/inscricao-publica/InscricaoNucleoSimplificadaWizard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface InscricaoNucleoCadastroPageProps {
  params: Promise<{ nucleoId: string }>;
}

export default async function InscricaoNucleoCadastroPage({ params }: InscricaoNucleoCadastroPageProps) {
  const { nucleoId } = await params;
  const nucleo = await nucleosApi.get(nucleoId).catch(() => null);

  if (!nucleo || nucleo.emFuncionamento === false) redirect("/");

  const breadcrumb = ["Inscrição", nucleo.identificacao, "Cadastro de Beneficiários"];

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto w-full pb-8">
      <nav aria-label="Hierarquia da inscrição" className="px-2">
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

      <InscricaoNucleoSimplificadaWizard nucleo={nucleo} />
    </div>
  );
}
