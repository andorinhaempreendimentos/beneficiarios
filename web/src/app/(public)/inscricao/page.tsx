import { nucleosApi, atividadesApi, turmasApi, configuracoesApi } from "@/lib/api/services";
import { InscricaoPublicaWizard } from "@/components/inscricao-publica/InscricaoPublicaWizard";
import type { GeolocalizacaoConfig } from "@/lib/geolocation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InscricaoPage() {
  const [nucleosRes, atividadesRes, turmasRes, geoConfigRes] = await Promise.all([
    nucleosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    atividadesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
    turmasApi.list({ limit: 500 }).catch(() => ({ data: [] })),
    configuracoesApi.get("geolocalizacao_inscricao").catch(() => null),
  ]);

  const nucleosDisponiveis = nucleosRes.data.filter(
    (n) => n.emFuncionamento !== false && n.disponivelPreInscricao !== false
  );

  const configGeo = (geoConfigRes?.valor as GeolocalizacaoConfig) || null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Inscrição Pública</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Escolha sua cidade, modalidade esportiva e o núcleo de atendimento com vagas abertas.
        </p>
      </div>

      <InscricaoPublicaWizard
        nucleos={nucleosDisponiveis}
        atividades={atividadesRes.data}
        turmas={turmasRes.data}
        configGeo={configGeo}
      />
    </div>
  );
}
