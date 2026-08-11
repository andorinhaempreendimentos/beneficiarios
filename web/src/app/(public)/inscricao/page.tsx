import { nucleosApi } from "@/lib/api/services";
import { InstrucoesInscricaoBanner } from "@/components/inscricao-publica/InstrucoesInscricaoBanner";
import { SelecionarNucleoPorEstadoCidade } from "@/components/inscricao-publica/SelecionarNucleoPorEstadoCidade";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InscricaoPage() {
  const nucleosRes = await nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] }));

  const nucleosDisponiveis = nucleosRes.data.filter(
    (n) => n.emFuncionamento !== false && n.disponivelPreInscricao !== false
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Inscrição Pública</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Selecione seu estado, cidade e o núcleo onde deseja realizar a inscrição.
        </p>
      </div>

      <InstrucoesInscricaoBanner tipoLink="geral" etapaAtual={1} />

      <SelecionarNucleoPorEstadoCidade nucleos={nucleosDisponiveis} />
    </div>
  );
}
