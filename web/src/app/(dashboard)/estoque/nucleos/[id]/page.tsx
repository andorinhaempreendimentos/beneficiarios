"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { estoqueNucleosApi, nucleosApi, type EstoqueNucleoApi, type NucleoApi, type Paginated } from "@/lib/api/services";

const NIVEL_BADGE: (item: EstoqueNucleoApi) => "green" | "amber" | "red" = (item) => {
  if (!item.material) return "zinc" as any;
  const pct = item.quantidadeAtual / Math.max(item.material.estoqueMinimo, 1);
  if (pct >= 1.5) return "green";
  if (pct >= 1) return "amber";
  return "red";
};

export default function EstoqueNucleoPage() {
  const { id } = useParams<{ id: string }>();

  const { data: estoque, loading } = useQuery<EstoqueNucleoApi[]>(
    () => estoqueNucleosApi.listByNucleo(id),
    [id],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const nucleo = nucleosData?.data.find((n) => n.id === id);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={nucleo?.identificacao ?? "Estoque do Núcleo"}
        description="Materiais disponíveis neste núcleo"
        actions={
          <div className="flex gap-2">
            <LinkButton href="/estoque/nucleos" variant="secondary">Voltar</LinkButton>
            <LinkButton href={`/estoque/movimentacoes/nova?nucleoId=${id}`}>Registrar movimentação</LinkButton>
          </div>
        }
      />
      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                  <th className="px-5 py-3">Material</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Qtd Atual</th>
                  <th className="px-5 py-3">Est. Mínimo</th>
                  <th className="px-5 py-3">Nível</th>
                  <th className="px-5 py-3">Localização</th>
                </tr>
              </thead>
              <tbody>
                {(!estoque || estoque.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Nenhum material registrado neste núcleo.
                    </td>
                  </tr>
                ) : estoque.map((item) => (
                  <tr key={`${item.materialId}-${item.nucleoId}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-800">{item.material?.nome ?? item.materialId}</td>
                    <td className="px-5 py-3 text-zinc-500">{item.material?.categoria ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`font-bold tabular-nums ${item.material && item.quantidadeAtual < item.material.estoqueMinimo ? "text-red-600" : "text-zinc-800"}`}>
                        {item.quantidadeAtual}
                      </span>
                      <span className="text-xs text-zinc-400 ml-1">{item.material?.unidadeMedida}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{item.material?.estoqueMinimo ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={NIVEL_BADGE(item)}>
                        {NIVEL_BADGE(item) === "green" ? "OK" : NIVEL_BADGE(item) === "amber" ? "Atenção" : "Baixo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{item.localizacao ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
