"use client";

import Link from "next/link";
import { Package, AlertTriangle, ArrowRightLeft, FileText } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { estoqueNucleosApi, materiaisApi, movimentacoesEstoqueApi } from "@/lib/api/services";

export default function EstoquePage() {
  const { data: alertas } = useQuery(() => estoqueNucleosApi.listAlertas(), []);
  const { data: materiais } = useQuery(() => materiaisApi.list({ limit: 1 }), []);
  const { data: movimentacoes } = useQuery(
    () => movimentacoesEstoqueApi.list({ limit: 1 }),
    [],
  );

  const totalMateriais = materiais?.total ?? 0;
  const totalMovimentacoes = movimentacoes?.total ?? 0;
  const totalAlertas = alertas?.length ?? 0;

  const cards = [
    {
      href: "/estoque/materiais",
      icon: Package,
      label: "Materiais",
      valor: totalMateriais,
      descricao: "cadastrados",
      cor: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      href: "/estoque/movimentacoes",
      icon: ArrowRightLeft,
      label: "Movimentações",
      valor: totalMovimentacoes,
      descricao: "registradas",
      cor: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      href: "/estoque/termos",
      icon: FileText,
      label: "Termos de Entrega",
      valor: "—",
      descricao: "controle de retiradas",
      cor: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      href: "/estoque/nucleos",
      icon: AlertTriangle,
      label: "Alertas de Estoque",
      valor: totalAlertas,
      descricao: totalAlertas === 1 ? "item abaixo do mínimo" : "itens abaixo do mínimo",
      cor: totalAlertas > 0 ? "text-red-600" : "text-green-600",
      bg: totalAlertas > 0 ? "bg-red-50" : "bg-green-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Estoque"
        description="Controle de materiais consumíveis por núcleo"
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group block rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">{c.label}</span>
                <div className={`${c.bg} p-2 rounded-xl`}>
                  <Icon className={`h-4 w-4 ${c.cor}`} />
                </div>
              </div>
              <div className={`text-3xl font-bold tabular-nums ${c.cor}`}>{c.valor}</div>
              <div className="text-xs text-zinc-400 mt-1">{c.descricao}</div>
            </Link>
          );
        })}
      </div>

      {/* Alertas */}
      {totalAlertas > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-zinc-800">Alertas de Estoque Baixo</h2>
            <Badge tone="red">{totalAlertas}</Badge>
          </div>
          <div className="divide-y divide-zinc-100">
            {alertas?.map((item) => (
              <div
                key={`${item.materialId}-${item.nucleoId}`}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-zinc-800">
                    {item.material?.nome ?? item.materialId}
                  </span>
                  {item.nucleo && (
                    <span className="text-xs text-zinc-400 ml-2">· {item.nucleo.identificacao}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    Atual:{" "}
                    <strong className="text-red-600">{item.quantidadeAtual}</strong>
                    {item.material && (
                      <span className="text-zinc-400">
                        {" "}/ mín. {item.material.estoqueMinimo}
                      </span>
                    )}
                  </span>
                  <Link
                    href={`/estoque/nucleos/${item.nucleoId}`}
                    className="text-xs font-semibold text-sky-600 hover:underline"
                  >
                    Ver núcleo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ações rápidas */}
      <Card>
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-800">Ações Rápidas</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: "/estoque/materiais/novo", label: "Cadastrar Material" },
            { href: "/estoque/movimentacoes/nova", label: "Registrar Movimentação" },
            { href: "/estoque/termos/novo", label: "Novo Termo de Entrega" },
            { href: "/estoque/nucleos", label: "Ver Estoque por Núcleo" },
            { href: "/estoque/movimentacoes", label: "Histórico de Movimentações" },
            { href: "/estoque/termos", label: "Termos Pendentes" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
