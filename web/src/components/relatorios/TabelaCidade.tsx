"use client";

import { Card, CardHeader } from "@/components/ui";
import { beneficiariosApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { normalizarStatusBeneficiario } from "@/lib/status";
import type { FiltrosState } from "./FiltrosRelatorio";

interface Props { filtros: FiltrosState }

export function TabelaCidade({ filtros }: Props) {
  const { data: res } = useQuery(() => beneficiariosApi.list({ limit: 200 }), []);
  const beneficiarios = res?.data ?? [];

  const filtrados = beneficiarios.filter((b) => {
    if (filtros.nucleoId && b.nucleoId !== filtros.nucleoId) return false;
    if (filtros.status && normalizarStatusBeneficiario(b.status) !== filtros.status) return false;
    return true;
  });

  const porCidade = filtrados.reduce<Record<string, { estado: string; total: number; ativos: number; pcd: number }>>((acc, b) => {
    const key = b.cidade ?? "Não informada";
    const estado = b.estado ?? "UF";
    if (!acc[key]) acc[key] = { estado, total: 0, ativos: 0, pcd: 0 };
    acc[key].total++;
    if (normalizarStatusBeneficiario(b.status) === "ativo") acc[key].ativos++;
    if (b.pcd) acc[key].pcd++;
    return acc;
  }, {});

  const linhas = Object.entries(porCidade).sort((a, b) => b[1].total - a[1].total);
  const total = filtrados.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Beneficiários por Cidade</h3>
          <span className="text-xs text-zinc-400">{total} total · {linhas.length} cidade(s)</span>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3">Cidade</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Ativos</th>
              <th className="px-5 py-3">PCD</th>
              <th className="px-5 py-3">% do total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Nenhum resultado.</td></tr>
            )}
            {linhas.map(([cidade, dados]) => {
              const pct = total > 0 ? Math.round((dados.total / total) * 100) : 0;
              return (
                <tr key={cidade} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-800">{cidade}</td>
                  <td className="px-5 py-3 text-zinc-500">{dados.estado}</td>
                  <td className="px-5 py-3 font-medium text-zinc-700">{dados.total}</td>
                  <td className="px-5 py-3 text-green-700">{dados.ativos}</td>
                  <td className="px-5 py-3 text-sky-600">{dados.pcd}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-zinc-100">
                        <div className="h-1.5 rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
