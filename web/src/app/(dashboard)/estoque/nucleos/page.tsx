"use client";

import Link from "next/link";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { estoqueNucleosApi, nucleosApi, type EstoqueNucleoApi, type NucleoApi, type Paginated } from "@/lib/api/services";

export default function EstoqueNucleosPage() {
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const nucleos = nucleosData?.data ?? [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Estoque por Núcleo"
        description="Visão geral de materiais disponíveis em cada núcleo"
        actions={<LinkButton href="/estoque">Voltar ao estoque</LinkButton>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nucleos.length === 0 && (
          <p className="col-span-full text-center text-sm text-zinc-400 py-8">Nenhum núcleo encontrado.</p>
        )}
        {nucleos.map((nucleo) => (
          <NucleoEstoqueCard key={nucleo.id} nucleo={nucleo} />
        ))}
      </div>
    </div>
  );
}

function NucleoEstoqueCard({ nucleo }: { nucleo: NucleoApi }) {
  const { data: estoque, loading } = useQuery<EstoqueNucleoApi[]>(
    () => estoqueNucleosApi.listByNucleo(nucleo.id),
    [nucleo.id],
  );

  const alertas = (estoque ?? []).filter(
    (e) => e.material && e.quantidadeAtual < e.material.estoqueMinimo,
  );

  return (
    <Link
      href={`/estoque/nucleos/${nucleo.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800">{nucleo.identificacao}</h3>
        {alertas.length > 0 && (
          <Badge tone="red">{alertas.length} alerta{alertas.length > 1 ? "s" : ""}</Badge>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-zinc-400">Carregando…</p>
      ) : (
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span><strong className="text-zinc-700">{estoque?.length ?? 0}</strong> itens</span>
          {alertas.length > 0 ? (
            <span className="text-red-500 font-medium">Estoque baixo</span>
          ) : (
            <span className="text-green-600">Estoque OK</span>
          )}
        </div>
      )}
    </Link>
  );
}
