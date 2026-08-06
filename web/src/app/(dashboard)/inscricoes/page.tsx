"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge, Card, PageHeader, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { inscricoesApi, nucleosApi, atividadesApi, turmasApi, type Paginated, type InscricaoApi, type NucleoApi, type AtividadeApi, type TurmaApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";
import { LinkRow } from "@/components/inscricoes/LinkRow";

const PER_PAGE = 20;
type StatusInscricao = "pendente" | "aprovada" | "reservada" | "cancelada";

const TONE: Record<StatusInscricao, "amber" | "green" | "sky" | "red"> = {
  pendente: "amber", aprovada: "green", reservada: "sky", cancelada: "red",
};
const LABEL: Record<StatusInscricao, string> = {
  pendente: "Pendente", aprovada: "Aprovada", reservada: "Fila de espera", cancelada: "Cancelada",
};
const STATUS_ORDER: StatusInscricao[] = ["pendente", "reservada", "aprovada", "cancelada"];

type Filtro = StatusInscricao | "todas";
const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "reservada", label: "Fila de espera" },
  { value: "aprovada", label: "Aprovadas" },
  { value: "cancelada", label: "Canceladas" },
];

export default function InscricoesPage() {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);

  const { data: pageData, loading, refetch } = useQuery<Paginated<InscricaoApi>>(
    () => inscricoesApi.list({ status: filtro !== "todas" ? filtro : undefined, page: pagina, limit: PER_PAGE }),
    [filtro, pagina],
  );
  const { data: pendData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "pendente", limit: 1 }), []);
  const { data: aprovData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "aprovada", limit: 1 }), []);
  const { data: filaData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "reservada", limit: 1 }), []);
  const { data: cancelData } = useQuery<Paginated<InscricaoApi>>(() => inscricoesApi.list({ status: "cancelada", limit: 1 }), []);

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ emFuncionamento: "true", limit: 200 }), []);
  const { data: atividadesData } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 200 }), []);
  const { data: turmasData } = useQuery<Paginated<TurmaApi>>(() => turmasApi.list({ limit: 200 }), []);

  const [actionId, setActionId] = useState<string | null>(null);

  async function handleAcao(id: string, acao: "aprovada" | "cancelada") {
    setActionId(id);
    try {
      if (acao === "aprovada") await inscricoesApi.aprovar(id);
      else await inscricoesApi.cancelar(id);
      refetch();
    } finally { setActionId(null); }
  }

  const lista = (pageData?.data ?? []).slice().sort(
    (a, b) => STATUS_ORDER.indexOf(a.status as StatusInscricao) - STATUS_ORDER.indexOf(b.status as StatusInscricao),
  );
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const nucleos = nucleosData?.data ?? [];
  const atividades = atividadesData?.data ?? [];
  const turmas = turmasData?.data ?? [];

  const counts: Record<StatusInscricao, number> = {
    pendente: pendData?.total ?? 0,
    aprovada: aprovData?.total ?? 0,
    reservada: filaData?.total ?? 0,
    cancelada: cancelData?.total ?? 0,
  };

  const pendentes = counts.pendente;

  const handleFiltro = useCallback((s: StatusInscricao) => {
    setFiltro((prev) => (prev === s ? "todas" : s));
    setPagina(1);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inscrições"
        description="Gerencie inscrições recebidas e gere links por núcleo, atividade ou turma"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["pendente", "aprovada", "fila_espera", "cancelada"] as StatusInscricao[]).map((s) => (
          <button key={s} type="button" onClick={() => handleFiltro(s)}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              filtro === s ? "border-sky-200 bg-sky-50 ring-1 ring-sky-300" : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <p className="text-2xl font-bold tabular-nums text-zinc-900">{counts[s]}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{LABEL[s]}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="border-b border-zinc-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-zinc-800">Links por núcleo</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Beneficiário escolhe atividade e turma</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {nucleos.map((n) => (
              <LinkRow key={n.id} label={n.identificacao} sub={[n.cidade, n.regiao].filter(Boolean).join(" · ")} path={`/inscricao/nucleo/${n.id}`} />
            ))}
          </div>
        </Card>
        <Card>
          <div className="border-b border-zinc-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-zinc-800">Links por atividade</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Beneficiário escolhe apenas a turma</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {atividades.map((a) => (
              <LinkRow key={a.id} label={a.nome} path={`/inscricao/atividade/${a.id}`} />
            ))}
          </div>
        </Card>
        <Card>
          <div className="border-b border-zinc-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-zinc-800">Links por turma</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Turma já pré-definida</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {turmas.map((t) => (
              <LinkRow key={t.id} label={t.nome} path={`/inscricao/turma/${t.id}`} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Inscrições recebidas</h3>
            {pendentes > 0 && <p className="mt-0.5 text-xs text-amber-600">{pendentes} aguardando análise</p>}
          </div>
          <div className="flex items-center gap-1">
            {FILTROS.map((f) => (
              <button key={f.value} type="button" onClick={() => { setFiltro(f.value); setPagina(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === f.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                  <th className="px-5 py-3">Beneficiário</th>
                  <th className="px-5 py-3">Turma</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => {
                  const turma = turmas.find((t) => t.id === i.turmaId) ?? i.turma;
                  return (
                    <tr key={i.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-medium text-zinc-900">
                          {i.beneficiario?.nomeCompleto ?? i.beneficiarioId}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/turmas/${i.turmaId}/inscricoes`} className="text-zinc-600 hover:text-sky-600 hover:underline transition-colors">
                          {turma?.nome ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">{formatarData(i.criadoEm)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={TONE[i.status as StatusInscricao] ?? "zinc"}>
                          {LABEL[i.status as StatusInscricao] ?? i.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {i.status === "pendente" && (
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" title="Aprovar" onClick={() => handleAcao(i.id, "aprovada")}
                              disabled={actionId === i.id}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-40">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button type="button" title="Recusar" onClick={() => handleAcao(i.id, "cancelada")}
                              disabled={actionId === i.id}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">Nenhuma inscrição encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
