"use client";

import { Badge, Card, CardHeader } from "@/components/ui";
import { funcionariosApi, nucleosApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import type { FiltrosState } from "./FiltrosRelatorio";

const STATUS_TONE: Record<string, "green" | "zinc" | "red" | "amber"> = {
  contratado: "green",
  voluntario: "sky" as "green",
  demitido: "red",
  pendente: "amber",
  licenca_medica: "zinc",
  licenca_maternidade: "zinc",
  afastado_inss: "zinc",
};

const STATUS_LABEL: Record<string, string> = {
  contratado: "Contratado",
  voluntario: "Voluntário",
  demitido: "Demitido",
  pendente: "Pendente",
  licenca_medica: "Lic. Médica",
  licenca_maternidade: "Lic. Maternidade",
  afastado_inss: "Afastado INSS",
};

interface Props { filtros: FiltrosState }

export function TabelaRH({ filtros }: Props) {
  const { data: funcRes } = useQuery(() => funcionariosApi.list({ limit: 200 }), []);
  const { data: nucRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);

  const funcionarios = funcRes?.data ?? [];
  const nucleos = nucRes?.data ?? [];

  const linhas = funcionarios.filter((f) => {
    if (filtros.nucleoId && f.nucleoId !== filtros.nucleoId) return false;
    return true;
  }).map((f) => {
    const nucleo = nucleos.find((n) => n.id === f.nucleoId);
    const jornada = f.jornada ?? [];
    const diasTrabalhados = jornada.filter((d) => d.trabalha).length;
    const horasDia = jornada
      .filter((d) => d.trabalha && d.entrada && d.saida)
      .reduce((acc, d) => {
        const [hE, mE] = (d.entrada ?? "0:0").split(":").map(Number);
        const [hS, mS] = (d.saida ?? "0:0").split(":").map(Number);
        return acc + (hS * 60 + mS - (hE * 60 + mE));
      }, 0);
    const cargaHorariaSemanal = `${Math.floor(horasDia / 60)}h/sem`;
    return { f, nucleo, diasTrabalhados, cargaHorariaSemanal };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Recursos Humanos</h3>
          <span className="text-xs text-zinc-400">{linhas.length} profissional(is)</span>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Função</th>
              <th className="px-5 py-3">Núcleo</th>
              <th className="px-5 py-3">Carga horária</th>
              <th className="px-5 py-3">Remuneração</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Nenhum resultado.</td></tr>
            )}
            {linhas.map(({ f, nucleo, cargaHorariaSemanal }) => (
              <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-5 py-3 font-medium text-zinc-800">{f.nomeCompleto}</td>
                <td className="px-5 py-3 text-zinc-600">{f.funcao}</td>
                <td className="px-5 py-3 text-zinc-600">{nucleo?.identificacao ?? f.alocadoEm}</td>
                <td className="px-5 py-3 text-zinc-600">{cargaHorariaSemanal}</td>
                <td className="px-5 py-3 text-zinc-600">{f.remuneracao ?? "—"}</td>
                <td className="px-5 py-3">
                  <Badge tone={STATUS_TONE[f.status] ?? "zinc"}>{STATUS_LABEL[f.status] ?? f.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
