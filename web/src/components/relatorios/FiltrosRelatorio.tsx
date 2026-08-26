"use client";

import { Card, CardBody, Select, Button } from "@/components/ui";
import { objetosApi, nucleosApi, atividadesApi, turmasApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { STATUS_BENEFICIARIO_OPCOES } from "@/lib/status";
import { Filter, RotateCcw } from "lucide-react";

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

  const temFiltroAtivo =
    Boolean(filtros.nucleoId) ||
    Boolean(filtros.atividadeId) ||
    Boolean(filtros.turmaId) ||
    Boolean(filtros.status) ||
    Boolean(filtros.dataInicio && filtros.dataInicio !== "2026-01-01") ||
    Boolean(filtros.dataFim && filtros.dataFim !== "2026-03-31");

  return (
    <Card className="print:hidden border-zinc-200 shadow-xs">
      <CardBody className="p-4 flex flex-col gap-3">
        {/* Cabeçalho da Barra de Filtros */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Parâmetros e Filtros do Relatório
            </span>
          </div>
          {temFiltroAtivo && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  objetoId: filtros.objetoId || (objetos[0]?.id ?? ""),
                  nucleoId: "",
                  atividadeId: "",
                  turmaId: "",
                  status: "",
                  dataInicio: "2026-01-01",
                  dataFim: "2026-03-31",
                })
              }
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Grid de Campos na Horizontal */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
          {/* 1. Objeto / Parceria */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Objeto / Parceria
            </label>
            <Select
              value={filtros.objetoId || ""}
              onChange={(e) => set("objetoId", e.target.value)}
              className="text-xs h-9"
            >
              <option value="">Todos os Projetos</option>
              {objetos.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome} {o.termoDeFomento ? `(${o.termoDeFomento})` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Núcleo */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Núcleo
            </label>
            <Select
              value={filtros.nucleoId}
              onChange={(e) => set("nucleoId", e.target.value)}
              className="text-xs h-9"
            >
              <option value="">Todos os Núcleos</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.identificacao}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Turma */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Turma
            </label>
            <Select
              value={filtros.turmaId}
              onChange={(e) => set("turmaId", e.target.value)}
              className="text-xs h-9"
            >
              <option value="">Todas as Turmas</option>
              {turmasFiltradas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </div>

          {/* 4. Status */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Status do Aluno
            </label>
            <Select
              value={filtros.status}
              onChange={(e) => set("status", e.target.value)}
              className="text-xs h-9"
            >
              <option value="">Todos os Status</option>
              {STATUS_BENEFICIARIO_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Período (Data Início / Fim) */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Período de Execução
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => set("dataInicio", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 h-9"
              />
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => set("dataFim", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 h-9"
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
