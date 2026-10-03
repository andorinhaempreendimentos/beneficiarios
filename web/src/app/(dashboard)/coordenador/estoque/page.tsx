"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Card, PageHeader, Badge, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  estoqueNucleosApi,
  type EstoqueNucleoApi,
  type NucleoApi,
} from "@/lib/api/services";

function getNivelBadge(item: EstoqueNucleoApi): { tone: "green" | "amber" | "red"; label: string } {
  if (!item.material) return { tone: "zinc" as any, label: "—" };
  const min = Math.max(item.material.estoqueMinimo, 1);
  const pct = item.quantidadeAtual / min;
  if (pct >= 1.5) return { tone: "green", label: "Normal" };
  if (pct >= 1.0) return { tone: "amber", label: "Atenção" };
  return { tone: "red", label: "Crítico" };
}

export default function CoordenadorEstoquePage() {
  const [nucleoSelecionadoId, setNucleoSelecionadoId] = useState<string>("todos");

  // Núcleos atribuídos ao coordenador
  const { data: meusNucleos, loading: loadingNucleos } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  const todosNucleoIds = useMemo(() => {
    return (meusNucleos ?? []).map((n) => n.id);
  }, [meusNucleos]);

  const nucleoIdsFiltrados = useMemo(() => {
    if (!meusNucleos || meusNucleos.length === 0) return [];
    if (nucleoSelecionadoId === "todos") return todosNucleoIds;
    return [nucleoSelecionadoId];
  }, [meusNucleos, nucleoSelecionadoId, todosNucleoIds]);

  const nucleoAtivoUnico = useMemo(() => {
    if (nucleoSelecionadoId === "todos") return null;
    return (meusNucleos ?? []).find((n) => n.id === nucleoSelecionadoId) ?? null;
  }, [meusNucleos, nucleoSelecionadoId]);

  // Carregar estoque dos núcleos filtrados
  const { data: estoqueData, loading: loadingEstoque } = useQuery<EstoqueNucleoApi[]>(
    async () => {
      if (nucleoIdsFiltrados.length === 0) return [];
      const arrays = await Promise.all(
        nucleoIdsFiltrados.map((id) => estoqueNucleosApi.listByNucleo(id).catch(() => [])),
      );
      return arrays.flat();
    },
    [JSON.stringify(nucleoIdsFiltrados)],
  );

  const estoque = estoqueData ?? [];

  const itensCriticos = estoque.filter(
    (item) => item.material && item.quantidadeAtual < item.material.estoqueMinimo,
  );

  const itensNormais = estoque.filter(
    (item) => item.material && item.quantidadeAtual >= item.material.estoqueMinimo,
  );

  if (loadingNucleos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-400">Carregando estoque dos núcleos…</div>
      </div>
    );
  }

  if (!meusNucleos || meusNucleos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <AlertTriangle className="h-8 w-8 text-zinc-400" />
        </div>
        <p className="text-zinc-700 font-semibold text-lg">Nenhum núcleo atribuído</p>
        <p className="text-sm text-zinc-500 max-w-md">
          Não há núcleos vinculados ao seu perfil para visualização de estoque.
        </p>
        <LinkButton href="/coordenador" variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar ao Painel
        </LinkButton>
      </div>
    );
  }

  const linkNovaMovimentacao = nucleoAtivoUnico
    ? `/estoque/movimentacoes/nova?nucleoId=${nucleoAtivoUnico.id}`
    : `/estoque/movimentacoes/nova`;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/coordenador"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Painel do Coordenador
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Estoque dos Meus Núcleos
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Controle de saldo, uniformes e materiais consumíveis sob sua supervisão
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de núcleo */}
          {meusNucleos.length > 1 && (
            <select
              value={nucleoSelecionadoId}
              onChange={(e) => setNucleoSelecionadoId(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos os núcleos ({meusNucleos.length})</option>
              {meusNucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  📍 {n.identificacao}
                </option>
              ))}
            </select>
          )}

          <LinkButton href={linkNovaMovimentacao} variant="primary">
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Movimentação
          </LinkButton>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total de Itens Monitorados
              </p>
              <p className="text-3xl font-extrabold text-zinc-900 mt-2">
                {estoque.length}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Materiais cadastrados</p>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Estoque Regular (OK)
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">
                {itensNormais.length}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Dentro do estoque mínimo</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Estoque Crítico / Baixo
              </p>
              <p
                className={`text-3xl font-extrabold mt-2 ${
                  itensCriticos.length > 0 ? "text-red-600" : "text-zinc-800"
                }`}
              >
                {itensCriticos.length}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Abaixo do mínimo recomendado</p>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alerta de urgência se houver itens críticos */}
      {itensCriticos.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Atenção:</span> Há {itensCriticos.length}{" "}
            {itensCriticos.length === 1
              ? "material com saldo abaixo do estoque mínimo"
              : "materiais com saldo abaixo do estoque mínimo"}
            . Solicite reposição ou registre entrada de materiais para manter as aulas abastecidas.
          </div>
        </div>
      )}

      {/* Tabela de Materiais */}
      <Card>
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-600" />
            {nucleoAtivoUnico
              ? `Materiais no Núcleo: ${nucleoAtivoUnico.identificacao}`
              : "Materiais nos Núcleos Atribuídos"}
          </h2>
          <span className="text-xs text-zinc-400">
            {estoque.length} {estoque.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {loadingEstoque ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Carregando materiais…</div>
        ) : estoque.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">
            Nenhum material registrado no estoque deste(s) núcleo(s).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  {nucleoSelecionadoId === "todos" && <th className="px-5 py-3">Núcleo</th>}
                  <th className="px-5 py-3">Material</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-center">Quantidade Atual</th>
                  <th className="px-4 py-3 text-center">Estoque Mínimo</th>
                  <th className="px-4 py-3 text-center">Situação</th>
                  <th className="px-4 py-3">Localização</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {estoque.map((item) => {
                  const nivel = getNivelBadge(item);
                  const nucleoItem = meusNucleos.find((n) => n.id === item.nucleoId);

                  return (
                    <tr
                      key={`${item.materialId}-${item.nucleoId}`}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      {nucleoSelecionadoId === "todos" && (
                        <td className="px-5 py-3.5 font-medium text-zinc-700">
                          {nucleoItem?.identificacao || "Núcleo"}
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-semibold text-zinc-900">
                        {item.material?.nome ?? item.materialId}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500">
                        {item.material?.categoria ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            nivel.tone === "red" ? "text-red-600" : "text-zinc-900"
                          }`}
                        >
                          {item.quantidadeAtual}
                        </span>
                        <span className="text-[11px] text-zinc-400 ml-1">
                          {item.material?.unidadeMedida ?? "un"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-zinc-600">
                        {item.material?.estoqueMinimo ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge tone={nivel.tone} className="font-semibold">
                          {nivel.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500">
                        {item.localizacao || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/estoque/movimentacoes/nova?nucleoId=${item.nucleoId}&materialId=${item.materialId}`}
                          className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Movimentar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
