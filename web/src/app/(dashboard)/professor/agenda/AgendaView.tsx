"use client";

import { CalendarCheck, Clock, MapPin } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import type { TurmaApi } from "@/lib/api/services";

export function AgendaView({ turmas }: { turmas: TurmaApi[] }) {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      <PageHeader
        title="Agenda de Turmas & Horários"
        description="Quadro de aulas e horários dos polos esportivos"
      />

      <div className="grid grid-cols-1 gap-4">
        {turmas.length === 0 ? (
          <Card className="p-8 text-center text-zinc-400">Nenhuma turma cadastrada na sua agenda.</Card>
        ) : (
          turmas.map((turma) => (
            <Card key={turma.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-900 text-base">{turma.nome}</h3>
                  <Badge tone="sky">{turma.vagasTotais} vagas</Badge>
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {turma.nucleo?.identificacao || "Polo Esportivo"}
                </p>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-semibold bg-zinc-100 px-3 py-2 rounded-xl">
                  <Clock className="h-4 w-4 text-sky-600" />
                  Segunda a Sexta — 08:00 às 10:00
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
