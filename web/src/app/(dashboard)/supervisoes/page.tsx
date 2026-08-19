"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Badge,
  Card,
  FilterBar,
  Field,
  Select,
  LinkButton,
  PageHeader,
  Pagination,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  supervisoesApi,
  nucleosApi,
  type Paginated,
  type SupervisaoApi,
  type NucleoApi,
} from "@/lib/api/services";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = { nucleoId: "", status: "", dataInicio: "", dataFim: "" };

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  finalizada: "Finalizada",
};
const statusTone: Record<string, "zinc" | "amber" | "green"> = {
  rascunho: "amber",
  finalizada: "green",
};

export default function SupervisoesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isCoordenador = Boolean((user as any)?.isCoordenador);

  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [removendo, setRemovendo] = useState<string | null>(null);

  // Núcleos do coordenador logado (se for coordenador)
  const { data: meusNucleos } = useQuery<NucleoApi[]>(
    () => isCoordenador ? coordenadoresApi.getMeusNucleos() : Promise.resolve([]),
    [isCoordenador],
  );
  const semNucleos = isCoordenador && meusNucleos != null && meusNucleos.length === 0;

  // Filtros de query: coordenador com 1 núcleo filtra direto; com vários filtra client-side
  const meusNucleosIds = (meusNucleos ?? []).map((n) => n.id);
  const filtroNucleoQuery = isCoordenador && meusNucleosIds.length === 1
    ? meusNucleosIds[0]
    : ativos.nucleoId;
  const queryParams = { ...ativos, nucleoId: filtroNucleoQuery, page: pagina, limit: PER_PAGE };

  const { data: pageData, loading, refetch } = useQuery<Paginated<SupervisaoApi>>(
    () => supervisoesApi.list(queryParams),
    [ativos, pagina, meusNucleos],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(
    () => nucleosApi.list({ limit: 200 }),
    [],
  );

  // Filtra client-side quando coordenador tem múltiplos núcleos
  const rawResultado = pageData?.data ?? [];
  const resultado = isCoordenador && meusNucleosIds.length > 1
    ? rawResultado.filter((s) => s.nucleoId != null && meusNucleosIds.includes(s.nucleoId))
    : rawResultado;
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const nucleosFiltro = isCoordenador ? (meusNucleos ?? []) : (nucleosData?.data ?? []);


  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);


  async function remover(id: string) {
    if (!confirm("Remover supervisão?")) return;
    setRemovendo(id);
    try {
      await supervisoesApi.remove(id);
      toast.success("Supervisão removida.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover.");
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Supervisões"
        description="Formulários de visita de supervisão aos núcleos"
        actions={
          semNucleos ? (
            <span className="text-sm text-zinc-400 italic">Sem núcleos atribuídos</span>
          ) : (
            <LinkButton href="/supervisoes/nova">Nova supervisão</LinkButton>
          )
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        {!isCoordenador && (
          <Field label="Núcleo">
            <Select
              value={filtros.nucleoId}
              onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}
            >
              <option value="">Todos</option>
              {nucleosFiltro.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Status">
          <Select
            value={filtros.status}
            onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="rascunho">Rascunho</option>
            <option value="finalizada">Finalizada</option>
          </Select>
        </Field>
        <Field label="Data início">
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </Field>
        <Field label="Data fim">
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </Field>
      </FilterBar>

      <Card>
        {loading && (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Núcleo</th>
                  <th className="px-5 py-3">Coordenador</th>
                  <th className="px-5 py-3">Entrada</th>
                  <th className="px-5 py-3">Beneficiários</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Nenhuma supervisão encontrada.
                    </td>
                  </tr>
                ) : (
                  resultado.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-3 font-medium text-zinc-800">
                        {formatarData(s.dataSupervisao)}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {s.nucleo?.identificacao ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {s.coordenador?.nome ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{s.horaEntrada}</td>
                      <td className="px-5 py-3 text-zinc-600">
                        {s.beneficiariosPresentes != null
                          ? `${s.beneficiariosPresentes}${s.beneficiariosEsperados != null ? ` / ${s.beneficiariosEsperados}` : ""}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone[s.status] ?? "zinc"}>
                          {statusLabel[s.status] ?? s.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/supervisoes/${s.id}`}
                          className="text-sky-600 hover:underline"
                        >
                          Detalhes
                        </Link>
                        {s.status === "rascunho" && (
                          <>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <Link
                              href={`/supervisoes/${s.id}/editar`}
                              className="text-zinc-500 hover:underline"
                            >
                              Editar
                            </Link>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <button
                              type="button"
                              onClick={() => remover(s.id)}
                              disabled={removendo === s.id}
                              className="text-red-500 hover:underline disabled:opacity-50 cursor-pointer"
                            >
                              {removendo === s.id ? "Removendo…" : "Remover"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </Card>
    </div>
  );
}
