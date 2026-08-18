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
  pendenciasGeraisApi,
  nucleosApi,
  type Paginated,
  type PendenciaGeralApi,
  type NucleoApi,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 20;
const EMPTY = { nucleoId: "", status: "", gravidade: "", tipo: "" };

const gravidadeTone: Record<string, "zinc" | "amber" | "amber" | "red"> = {
  baixa: "zinc",
  media: "amber",
  alta: "amber",
  critica: "red",
};

const statusTone: Record<string, "zinc" | "amber" | "sky" | "green" | "red"> = {
  aberta: "red",
  em_andamento: "sky",
  resolvida: "green",
  cancelada: "zinc",
};

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

export default function PendenciasGeraisPage() {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  const { data: pageData, loading, refetch } = useQuery<Paginated<PendenciaGeralApi>>(
    () => pendenciasGeraisApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(
    () => nucleosApi.list({ limit: 200 }),
    [],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const nucleos = nucleosData?.data ?? [];

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  // Agrupar por status para view kanban
  const abertas = resultado.filter((p) => p.status === "aberta");
  const emAndamento = resultado.filter((p) => p.status === "em_andamento");
  const resolvidas = resultado.filter((p) => p.status === "resolvida");

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Pendências"
        description="Ocorrências e pendências gerais dos núcleos"
        actions={
          <LinkButton href="/pendencias-gerais/nova">Nova pendência</LinkButton>
        }
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvida">Resolvida</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </Field>
        <Field label="Gravidade">
          <Select value={filtros.gravidade} onChange={(e) => setFiltros((f) => ({ ...f, gravidade: e.target.value }))}>
            <option value="">Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </Select>
        </Field>
        <Field label="Tipo">
          <Select value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
            <option value="">Todos</option>
            <option value="estrutura">Estrutura</option>
            <option value="material">Material</option>
            <option value="professor">Professor</option>
            <option value="beneficiario">Beneficiário</option>
            <option value="outro">Outro</option>
          </Select>
        </Field>
      </FilterBar>

      {loading && <div className="py-8 text-center text-sm text-zinc-400">Carregando…</div>}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Coluna: Abertas */}
          <KanbanColuna
            titulo="Abertas"
            tom="red"
            pendencias={abertas}
            total={abertas.length}
            statusTone={statusTone}
            statusLabel={statusLabel}
            gravidadeTone={gravidadeTone}
          />
          {/* Coluna: Em andamento */}
          <KanbanColuna
            titulo="Em andamento"
            tom="sky"
            pendencias={emAndamento}
            total={emAndamento.length}
            statusTone={statusTone}
            statusLabel={statusLabel}
            gravidadeTone={gravidadeTone}
          />
          {/* Coluna: Resolvidas */}
          <KanbanColuna
            titulo="Resolvidas"
            tom="green"
            pendencias={resolvidas}
            total={resolvidas.length}
            statusTone={statusTone}
            statusLabel={statusLabel}
            gravidadeTone={gravidadeTone}
          />
        </div>
      )}

      <div className="flex justify-center">
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      </div>
    </div>
  );
}

type KanbanProps = {
  titulo: string;
  tom: string;
  pendencias: PendenciaGeralApi[];
  total: number;
  statusTone: Record<string, string>;
  statusLabel: Record<string, string>;
  gravidadeTone: Record<string, string>;
};

function KanbanColuna({ titulo, tom, pendencias, total, statusTone, statusLabel, gravidadeTone }: KanbanProps) {
  const borderMap: Record<string, string> = {
    red: "border-red-300",
    sky: "border-sky-300",
    green: "border-green-300",
  };
  const bgMap: Record<string, string> = {
    red: "bg-red-50",
    sky: "bg-sky-50",
    green: "bg-green-50",
  };
  const textMap: Record<string, string> = {
    red: "text-red-700",
    sky: "text-sky-700",
    green: "text-green-700",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${borderMap[tom] ?? "border-zinc-200"} ${bgMap[tom] ?? "bg-zinc-50"}`}>
        <span className={`text-sm font-bold ${textMap[tom] ?? "text-zinc-700"}`}>{titulo}</span>
        <span className={`ml-auto text-xs font-semibold ${textMap[tom] ?? "text-zinc-500"}`}>{total}</span>
      </div>
      {pendencias.length === 0 && (
        <div className="py-6 text-center text-sm text-zinc-400">Nenhuma pendência.</div>
      )}
      {pendencias.map((p) => (
        <Link
          key={p.id}
          href={`/pendencias-gerais/${p.id}`}
          className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-sm font-semibold text-zinc-800 leading-snug">{p.titulo}</span>
            <Badge tone={(gravidadeTone[p.gravidade] as any) ?? "zinc"}>
              {p.gravidade}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{p.descricao}</p>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{p.nucleo?.identificacao ?? "—"}</span>
            {p.prazo && (
              <span className="text-amber-600 font-medium">
                Prazo: {formatarData(p.prazo)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
