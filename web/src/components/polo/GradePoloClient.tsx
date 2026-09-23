"use client";

import { useState, useMemo } from "react";
import { Card, CardBody, Field, PageHeader, Select } from "@/components/ui";
import {
  turmasApi,
  type NucleoApi,
  type AtividadeApi,
  type CategoriaTurmaApi,
  type TurmaApi,
} from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Mapa de cores por sigla de categoria
const CATEGORIA_CORES: Record<string, { bg: string; border: string; text: string }> = {
  S6:  { bg: "bg-sky-500",    border: "border-sky-600",    text: "text-white" },
  S8:  { bg: "bg-emerald-500",border: "border-emerald-600",text: "text-white" },
  S10: { bg: "bg-amber-500",  border: "border-amber-600",  text: "text-white" },
  S12: { bg: "bg-orange-500", border: "border-orange-600", text: "text-white" },
  S14: { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
  S16: { bg: "bg-pink-500",   border: "border-pink-600",   text: "text-white" },
  S17: { bg: "bg-rose-500",   border: "border-rose-600",   text: "text-white" },
};
const COR_INTERNA = { bg: "bg-zinc-300", border: "border-zinc-400", text: "text-zinc-700" };
const COR_PADRAO  = { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-white" };

const DIAS = [
  { key: "Seg", label: "Segunda",  num: 1 },
  { key: "Ter", label: "Terça",    num: 2 },
  { key: "Qua", label: "Quarta",   num: 3 },
  { key: "Qui", label: "Quinta",   num: 4 },
  { key: "Sex", label: "Sexta",    num: 5 },
  { key: "Sáb", label: "Sábado",   num: 6 },
  { key: "Dom", label: "Domingo",  num: 0 },
];

const DIA_NUM_TO_KEY: Record<number, string> = {
  0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb",
};

const HORAS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h–21h

function formatH(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

interface Slot {
  turmaId: string;
  turmaNome: string;
  dia: string;
  inicio: number;
  fim: number;
  sigla?: string;
  usoInterno?: boolean;
}

interface GradePoloClientProps {
  nucleos: NucleoApi[];
  atividades: AtividadeApi[];
  categorias: CategoriaTurmaApi[];
}

export function GradePoloClient({ nucleos, atividades, categorias }: GradePoloClientProps) {
  const [nucleoId, setNucleoId] = useState("");
  const [atividadeId, setAtividadeId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const { data: turmasRaw, loading } = useQuery<TurmaApi[]>(
    () =>
      nucleoId
        ? turmasApi
            .list({ nucleoId, atividadeId: atividadeId || undefined, limit: 200 })
            .then((r) => r.data)
        : Promise.resolve([]),
    [nucleoId, atividadeId]
  );

  const turmasFiltradas = useMemo(() => {
    if (!turmasRaw) return [];
    return turmasRaw.filter(
      (t) => !categoriaId || t.categoriaId === categoriaId
    );
  }, [turmasRaw, categoriaId]);

  // Montar slots a partir das turmas filtradas
  const slots: Slot[] = useMemo(() => {
    return turmasFiltradas.flatMap((t) =>
      (t.slots ?? []).map((s: any) => ({
        turmaId: t.id,
        turmaNome: t.nome,
        dia: typeof s.dia === "number" ? DIA_NUM_TO_KEY[s.dia] : s.dia,
        inicio: s.inicio,
        fim: s.fim,
        sigla: t.categoria?.sigla,
        usoInterno: t.atividade?.usoInterno ?? false,
      }))
    );
  }, [turmasFiltradas]);

  // Agrupar slots por dia + hora de início para renderizar
  function getSlotsAt(dia: string, hora: number): Slot[] {
    return slots.filter((s) => s.dia === dia && s.inicio === hora);
  }

  function isSlotCovered(dia: string, hora: number): boolean {
    return slots.some((s) => s.dia === dia && hora > s.inicio && hora < s.fim);
  }

  function corSlot(slot: Slot) {
    if (slot.usoInterno) return COR_INTERNA;
    if (slot.sigla && CATEGORIA_CORES[slot.sigla]) return CATEGORIA_CORES[slot.sigla];
    return COR_PADRAO;
  }

  const diasComSlots = useMemo(() => {
    const set = new Set(slots.map((s) => s.dia));
    return DIAS.filter((d) => set.has(d.key));
  }, [slots]);

  const horasVisiveis = useMemo(() => {
    if (slots.length === 0) return HORAS;
    const min = Math.max(6, Math.min(...slots.map((s) => s.inicio)) - 1);
    const max = Math.min(22, Math.max(...slots.map((s) => s.fim)) + 1);
    return HORAS.filter((h) => h >= min && h <= max);
  }, [slots]);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Grade Semanal"
        description="Visualização consolidada dos horários por polo"
        actions={
          <Link
            href="/nucleos"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Núcleos
          </Link>
        }
      />

      {/* Filtros */}
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Núcleo" required>
            <Select value={nucleoId} onChange={(e) => { setNucleoId(e.target.value); setAtividadeId(""); setCategoriaId(""); }}>
              <option value="">Selecione um núcleo</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>

          <Field label="Atividade">
            <Select value={atividadeId} onChange={(e) => setAtividadeId(e.target.value)} disabled={!nucleoId}>
              <option value="">Todas as atividades</option>
              {atividades.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </Select>
          </Field>

          <Field label="Categoria">
            <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} disabled={!nucleoId}>
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {/* Legenda */}
      {turmasFiltradas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {turmasFiltradas.map((t) => {
            const sigla = t.categoria?.sigla;
            const interno = t.atividade?.usoInterno;
            const cor = interno ? COR_INTERNA : sigla && CATEGORIA_CORES[sigla] ? CATEGORIA_CORES[sigla] : COR_PADRAO;
            return (
              <span
                key={t.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor.bg} ${cor.text}`}
              >
                {sigla && <span className="opacity-80">{sigla}</span>}
                {t.nome}
              </span>
            );
          })}
        </div>
      )}

      {/* Grade */}
      {!nucleoId ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center text-sm text-zinc-400">
          Selecione um núcleo para ver a grade semanal
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-400">
          Carregando...
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center text-sm text-zinc-400">
          Nenhum horário encontrado com esses filtros
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white select-none">
          <div
            className="flex"
            style={{ minWidth: `${56 + diasComSlots.length * 120}px` }}
          >
            {/* Coluna de horas */}
            <div className="flex flex-col shrink-0">
              <div className="h-10 w-14 border-b border-zinc-100" />
              {horasVisiveis.map((h) => (
                <div key={h} className="flex h-12 w-14 items-start justify-end pr-2 pt-1">
                  <span className="text-[11px] text-zinc-400">{formatH(h)}</span>
                </div>
              ))}
            </div>

            {/* Colunas de dias */}
            {diasComSlots.map(({ key, label }) => (
              <div key={key} className="flex flex-1 flex-col border-l border-zinc-100">
                <div className="flex h-10 items-center justify-center border-b border-zinc-100 bg-zinc-50">
                  <span className="text-xs font-semibold text-zinc-600">{label}</span>
                </div>
                <div className="relative">
                  {horasVisiveis.map((hora) => {
                    const slotsNaHora = getSlotsAt(key, hora);
                    const covered = isSlotCovered(key, hora);
                    return (
                      <div
                        key={hora}
                        className={`relative h-12 border-b border-zinc-100 ${covered ? "" : "hover:bg-zinc-50"}`}
                      >
                        {slotsNaHora.map((slot, idx) => {
                          const cor = corSlot(slot);
                          const totalNaHora = slotsNaHora.length;
                          const width = `calc(${100 / totalNaHora}% - 4px)`;
                          const left = `calc(${(idx * 100) / totalNaHora}% + 2px)`;
                          return (
                            <div
                              key={`${slot.turmaId}-${idx}`}
                              className={`absolute z-10 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-tight overflow-hidden ${cor.bg} ${cor.border} ${cor.text}`}
                              style={{
                                top: 2,
                                left,
                                width,
                                height: `calc(${(slot.fim - slot.inicio) * 48}px - 4px)`,
                              }}
                            >
                              <div className="truncate">{slot.turmaNome}</div>
                              <div className="text-[10px] font-normal opacity-80">
                                {formatH(slot.inicio)}–{formatH(slot.fim)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
