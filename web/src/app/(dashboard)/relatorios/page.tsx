"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { FiltrosRelatorio } from "@/components/relatorios/FiltrosRelatorio";
import { TabelaParticipacao } from "@/components/relatorios/TabelaParticipacao";
import { TabelaPresenca } from "@/components/relatorios/TabelaPresenca";
import { TabelaRH } from "@/components/relatorios/TabelaRH";
import { TabelaCidade } from "@/components/relatorios/TabelaCidade";
import { TabelaMinisterio } from "@/components/relatorios/TabelaMinisterio";
import { cn } from "@/lib/utils";
import type { FiltrosState } from "@/components/relatorios/FiltrosRelatorio";

type TipoRelatorio = "participacao" | "presenca" | "rh" | "cidade" | "ministerio";

const TIPOS: { id: TipoRelatorio; label: string; desc: string }[] = [
  { id: "participacao", label: "Participação", desc: "Beneficiários por turma e status" },
  { id: "presenca", label: "Presença", desc: "Frequência por beneficiário e turma" },
  { id: "rh", label: "Recursos Humanos", desc: "Pessoal por função e carga horária" },
  { id: "cidade", label: "Por cidade", desc: "Distribuição geográfica de beneficiários" },
  { id: "ministerio", label: "Ministério do Esporte", desc: "Formato oficial para prestação de contas" },
];

const FILTROS_INICIAL: FiltrosState = {
  nucleoId: "",
  atividadeId: "",
  turmaId: "",
  status: "",
  dataInicio: "",
  dataFim: "",
};

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<TipoRelatorio>("participacao");
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIAL);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatórios"
        description="Gere relatórios com filtros compostos e exporte em PDF ou Excel"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-3.5 w-3.5" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar Excel
            </Button>
          </div>
        }
      />

      {/* Tipo de relatório */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipo(t.id)}
            className={cn(
              "flex flex-col gap-0.5 rounded-xl border p-3 text-left text-sm transition-colors",
              tipo === t.id
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            )}
          >
            <span className="font-medium">{t.label}</span>
            <span className={cn("text-xs", tipo === t.id ? "text-sky-500" : "text-zinc-400")}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Filtros */}
        <div className="w-full shrink-0 lg:w-64">
          <FiltrosRelatorio filtros={filtros} onChange={setFiltros} />
        </div>

        {/* Resultado */}
        <div className="min-w-0 flex-1">
          {tipo === "participacao" && <TabelaParticipacao filtros={filtros} />}
          {tipo === "presenca" && <TabelaPresenca filtros={filtros} />}
          {tipo === "rh" && <TabelaRH filtros={filtros} />}
          {tipo === "cidade" && <TabelaCidade filtros={filtros} />}
          {tipo === "ministerio" && <TabelaMinisterio filtros={filtros} />}
        </div>
      </div>
    </div>
  );
}
