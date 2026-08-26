"use client";

import { Card, CardBody, CardHeader, Field, Select } from "@/components/ui";
import { objetosApi, nucleosApi, atividadesApi, turmasApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { STATUS_BENEFICIARIO_OPCOES } from "@/lib/status";

export interface FiltrosState {
  objetoId?: string;
  nucleoId: string;
  atividadeId: string;
  turmaId: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}

interface FiltrosRelatorioProps {
  filtros: FiltrosState;
  onChange: (f: FiltrosState) => void;
}

export function FiltrosRelatorio({ filtros, onChange }: FiltrosRelatorioProps) {
  const { data: objetosRes } = useQuery(() => objetosApi.list({ limit: 50 }), []);
  const { data: nucleosRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const { data: atividadesRes } = useQuery(() => atividadesApi.list({ limit: 100 }), []);
  const { data: turmasRes } = useQuery(() => turmasApi.list({ limit: 100 }), []);

  const objetos = objetosRes?.data ?? [];
  const nucleos = nucleosRes?.data ?? [];
  const atividades = atividadesRes?.data ?? [];
  const turmas = turmasRes?.data ?? [];

  function set(key: keyof FiltrosState, value: string) {
    onChange({ ...filtros, [key]: value });
  }

  const turmasFiltradas = filtros.nucleoId
    ? turmas.filter((t) => t.nucleoId === filtros.nucleoId)
    : turmas;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-zinc-700">Filtros</h3>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Field label="Objeto / Parceria">
          <Select value={filtros.objetoId || ""} onChange={(e) => set("objetoId", e.target.value)}>
            <option value="">Todos os Projetos</option>
            {objetos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} {o.termoDeFomento ? `(${o.termoDeFomento})` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => set("nucleoId", e.target.value)}>
            <option value="">Todos</option>
            {nucleos.map((n) => (
              <option key={n.id} value={n.id}>{n.identificacao}</option>
            ))}
          </Select>
        </Field>

        <Field label="Atividade">
          <Select value={filtros.atividadeId} onChange={(e) => set("atividadeId", e.target.value)}>
            <option value="">Todas</option>
            {atividades.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </Select>
        </Field>

        <Field label="Turma">
          <Select value={filtros.turmaId} onChange={(e) => set("turmaId", e.target.value)}>
            <option value="">Todas</option>
            {turmasFiltradas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </Select>
        </Field>

        <Field label="Status do beneficiário">
          <Select value={filtros.status} onChange={(e) => set("status", e.target.value)}>
            <option value="">Todos</option>
            {STATUS_BENEFICIARIO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Data início">
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => set("dataInicio", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </Field>

        <Field label="Data fim">
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => set("dataFim", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </Field>

        <button
          type="button"
          onClick={() => onChange({ objetoId: "", nucleoId: "", atividadeId: "", turmaId: "", status: "", dataInicio: "", dataFim: "" })}
          className="text-xs text-zinc-400 hover:text-zinc-700 text-left"
        >
          Limpar filtros
        </button>
      </CardBody>
    </Card>
  );
}
