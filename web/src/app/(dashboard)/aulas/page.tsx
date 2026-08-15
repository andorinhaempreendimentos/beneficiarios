"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Users,
  CalendarDays,
  Eye,
} from "lucide-react";
import {
  Badge,
  Card,
  FilterBar,
  Field,
  Input,
  Select,
  PageHeader,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  execucoesAulaApi,
  turmasApi,
  funcionariosApi,
  type ExecucaoAulaApi,
  type Paginated,
  type TurmaApi,
  type FuncionarioApi,
} from "@/lib/api/services";
import { getDataHojeBrasil } from "@/lib/dateUtils";

const STATUS_MAP: Record<string, { label: string; tone: string; icon: React.ElementType }> = {
  em_andamento: { label: "Em Andamento", tone: "sky", icon: Play },
  concluida: { label: "Concluída", tone: "emerald", icon: CheckCircle2 },
  pendente_aprovacao: { label: "Pendente", tone: "amber", icon: AlertTriangle },
  encerrada_automaticamente: { label: "Auto-Encerrada", tone: "amber", icon: Clock },
  rejeitada: { label: "Rejeitada", tone: "red", icon: Square },
};

function formatHora(isoOrTime?: string): string {
  if (!isoOrTime) return "—";
  if (isoOrTime.includes("T")) {
    try {
      const d = new Date(isoOrTime);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    } catch { return isoOrTime.slice(0, 5); }
  }
  if (isoOrTime.length >= 16 && isoOrTime.includes(" ")) {
    try {
      const d = new Date(isoOrTime.replace(" ", "T"));
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    } catch { /* fallthrough */ }
  }
  return isoOrTime.slice(0, 5);
}

function formatData(dateStr?: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function calcDuracao(inicio?: string, fim?: string): string {
  if (!inicio || !fim) return "—";
  try {
    const a = new Date(inicio.includes("T") ? inicio : inicio.replace(" ", "T"));
    const b = new Date(fim.includes("T") ? fim : fim.replace(" ", "T"));
    const diffMin = Math.round((b.getTime() - a.getTime()) / 60000);
    if (diffMin < 0) return "—";
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return h > 0 ? `${h}h${m > 0 ? `${String(m).padStart(2, "0")}min` : ""}` : `${m}min`;
  } catch { return "—"; }
}

const EMPTY = { turmaId: "", professorId: "", status: "", data: "" };

export default function AulasAdminPage() {
  const [filtros, setFiltros] = useState(EMPTY);
  const [ativos, setAtivos] = useState(EMPTY);

  useEffect(() => {
    const t = setTimeout(() => setAtivos(filtros), 300);
    return () => clearTimeout(t);
  }, [filtros]);

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (ativos.turmaId) p.turmaId = ativos.turmaId;
    if (ativos.professorId) p.professorId = ativos.professorId;
    if (ativos.status) p.status = ativos.status;
    if (ativos.data) p.data = ativos.data;
    return p;
  }, [ativos]);

  const { data: aulas, loading } = useQuery<ExecucaoAulaApi[]>(
    () => execucoesAulaApi.listAll(queryParams),
    [queryParams]
  );
  const { data: turmasRes } = useQuery<Paginated<TurmaApi>>(
    () => turmasApi.list({ limit: 300 }),
    []
  );
  const { data: funcsRes } = useQuery<Paginated<FuncionarioApi>>(
    () => funcionariosApi.list({ limit: 300 }),
    []
  );

  const turmas = turmasRes?.data ?? [];
  const funcionarios = funcsRes?.data ?? [];
  const resultado = aulas ?? [];

  const turmaMap = useMemo(() => {
    const m = new Map<string, TurmaApi>();
    for (const t of turmas) m.set(t.id, t);
    return m;
  }, [turmas]);

  const funcMap = useMemo(() => {
    const m = new Map<string, FuncionarioApi>();
    for (const f of funcionarios) m.set(f.id, f);
    return m;
  }, [funcionarios]);

  const stats = useMemo(() => {
    const hoje = getDataHojeBrasil();
    return {
      total: resultado.length,
      emAndamento: resultado.filter((a) => a.status === "em_andamento").length,
      concluidasHoje: resultado.filter((a) => a.status === "concluida" && a.data === hoje).length,
      pendentes: resultado.filter((a) => a.statusAprovacao === "pendente_aprovacao").length,
    };
  }, [resultado]);

  const limpar = () => { setFiltros(EMPTY); setAtivos(EMPTY); };

  // Professores únicos para o filtro
  const professoresUnicos = useMemo(() => {
    const ids = new Set(resultado.map((a) => a.professorId).filter(Boolean));
    return Array.from(ids).map((id) => funcMap.get(id!)).filter(Boolean) as FuncionarioApi[];
  }, [resultado, funcMap]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Aulas"
        description="Painel de acompanhamento de todas as execuções de aula do sistema"
      />

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total de Aulas</span>
          <span className="text-2xl font-black text-zinc-900">{stats.total}</span>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider flex items-center gap-1">
            <Play className="h-3 w-3" /> Em Andamento
          </span>
          <span className="text-2xl font-black text-sky-700">{stats.emAndamento}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Concluídas Hoje
          </span>
          <span className="text-2xl font-black text-emerald-700">{stats.concluidasHoje}</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Pendentes Aprovação
          </span>
          <span className="text-2xl font-black text-amber-700">{stats.pendentes}</span>
        </div>
      </div>

      {/* FILTROS */}
      <FilterBar onClear={limpar}>
        <Field label="Turma">
          <Select value={filtros.turmaId} onChange={(e) => setFiltros((f) => ({ ...f, turmaId: e.target.value }))}>
            <option value="">Todas</option>
            {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </Select>
        </Field>
        <Field label="Professor">
          <Select value={filtros.professorId} onChange={(e) => setFiltros((f) => ({ ...f, professorId: e.target.value }))}>
            <option value="">Todos</option>
            {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="pendente_aprovacao">Pendente Aprovação</option>
            <option value="encerrada_automaticamente">Auto-Encerrada</option>
            <option value="rejeitada">Rejeitada</option>
          </Select>
        </Field>
        <Field label="Data">
          <Input
            type="date"
            value={filtros.data}
            onChange={(e) => setFiltros((f) => ({ ...f, data: e.target.value }))}
          />
        </Field>
      </FilterBar>

      {/* TABELA */}
      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Turma</th>
                  <th className="px-4 py-3">Professor</th>
                  <th className="px-4 py-3 text-center">Horário</th>
                  <th className="px-4 py-3 text-center">Duração</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Foto</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Nenhuma aula encontrada.
                    </td>
                  </tr>
                ) : (
                  resultado.map((a) => {
                    const turma = turmaMap.get(a.turmaId);
                    const prof = a.professorId ? funcMap.get(a.professorId) : null;
                    const st = STATUS_MAP[a.status] || STATUS_MAP.em_andamento;
                    const StIcon = st.icon;

                    return (
                      <tr key={a.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="font-medium text-zinc-900">{formatData(a.data)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-zinc-900">{turma?.nome ?? a.turmaId.slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {prof?.nomeCompleto ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span className="font-mono text-zinc-700">
                              {formatHora(a.horaInicioReal)}
                            </span>
                            <span className="text-zinc-300">→</span>
                            <span className="font-mono text-zinc-700">
                              {formatHora(a.horaFimReal)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs text-zinc-600">
                            {calcDuracao(a.horaInicioReal, a.horaFimReal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge tone={st.tone as any}>
                            <StIcon className="h-3 w-3 mr-1 inline" />
                            {st.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.fotoComprovanteUrl ? (
                            <Camera className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-zinc-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/professor/aula/${a.turmaId}?data=${a.data}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
