"use client";

import { useState, useCallback } from "react";
import { Card, PageHeader, Field, Select, Badge } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { supervisoesApi, nucleosApi, type Paginated, type SupervisaoApi, type NucleoApi } from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const avaliacaoScore: Record<string, number> = {
  otima: 5, boa: 4, regular: 3, ruim: 2, critica: 1,
};
const avaliacaoLabel: Record<string, string> = {
  otima: "Ótima", boa: "Boa", regular: "Regular", ruim: "Ruim", critica: "Crítica",
};
const avaliacaoTone: Record<string, "green" | "sky" | "amber" | "red" | "zinc"> = {
  otima: "green", boa: "sky", regular: "amber", ruim: "amber", critica: "red",
};

function mediaAvaliacao(sups: SupervisaoApi[], campo: keyof SupervisaoApi): string {
  const vals = sups
    .map((s) => s[campo] as string | null)
    .filter((v): v is string => !!v && !!avaliacaoScore[v]);
  if (vals.length === 0) return "—";
  const avg = vals.reduce((a, v) => a + avaliacaoScore[v], 0) / vals.length;
  const arredondada = avg >= 4.5 ? "otima" : avg >= 3.5 ? "boa" : avg >= 2.5 ? "regular" : avg >= 1.5 ? "ruim" : "critica";
  return arredondada;
}

export default function RelatorioMensalPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [filtros, setFiltros] = useState({
    ano: String(anoAtual),
    mes: String(mesAtual),
    nucleoId: "",
  });
  const [ativos, setAtivos] = useState(filtros);

  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(() => nucleosApi.list({ limit: 200 }), []);
  const nucleos = nucleosData?.data ?? [];

  const dataInicio = `${ativos.ano}-${String(ativos.mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(Number(ativos.ano), Number(ativos.mes), 0).getDate();
  const dataFim = `${ativos.ano}-${String(ativos.mes).padStart(2, "0")}-${ultimoDia}`;

  const { data: pageData, loading } = useQuery<Paginated<SupervisaoApi>>(
    () => supervisoesApi.list({
      dataInicio,
      dataFim,
      nucleoId: ativos.nucleoId || undefined,
      status: "finalizada",
      limit: 200,
    }),
    [ativos],
  );

  const supervisoes = pageData?.data ?? [];
  const finalizadas = supervisoes.filter((s) => s.status === "finalizada");

  // Agrupar por núcleo
  const porNucleo = finalizadas.reduce<Record<string, SupervisaoApi[]>>((acc, s) => {
    const key = s.nucleoId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const mediaPresenca = finalizadas.length === 0 ? 0 :
    finalizadas.reduce((a, s) => {
      if (!s.beneficiariosEsperados || !s.beneficiariosPresentes) return a;
      return a + (s.beneficiariosPresentes / s.beneficiariosEsperados);
    }, 0) / finalizadas.filter((s) => s.beneficiariosEsperados).length * 100;

  const gradeCumprida = finalizadas.filter((s) => s.gradeCumprida).length;
  const professorPresente = finalizadas.filter((s) => s.professorPresente).length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Relatório Mensal de Supervisões"
        description="Consolidado de visitas finalizadas por período"
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Field label="Mês">
          <Select value={filtros.mes} onChange={(e) => setFiltros((f) => ({ ...f, mes: e.target.value }))}>
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Ano">
          <Select value={filtros.ano} onChange={(e) => setFiltros((f) => ({ ...f, ano: e.target.value }))}>
            {[anoAtual - 1, anoAtual, anoAtual + 1].map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </Field>
        <Field label="Núcleo">
          <Select value={filtros.nucleoId} onChange={(e) => setFiltros((f) => ({ ...f, nucleoId: e.target.value }))}>
            <option value="">Todos</option>
            {nucleos.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
          </Select>
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setAtivos(filtros)}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors cursor-pointer"
          >
            Filtrar
          </button>
        </div>
      </div>

      {loading && <div className="py-8 text-center text-sm text-zinc-400">Carregando…</div>}

      {!loading && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Supervisões realizadas", value: finalizadas.length, sub: `em ${MESES[Number(ativos.mes) - 1]} ${ativos.ano}` },
              { label: "Média de presença", value: `${mediaPresenca.toFixed(0)}%`, sub: "beneficiários presentes" },
              { label: "Grade cumprida", value: `${gradeCumprida}/${finalizadas.length}`, sub: "supervisões" },
              { label: "Professor presente", value: `${professorPresente}/${finalizadas.length}`, sub: "supervisões" },
            ].map((card) => (
              <Card key={card.label}>
                <div className="p-5">
                  <p className="text-xs text-zinc-400 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-zinc-800">{card.value}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Tabela por núcleo */}
          {Object.keys(porNucleo).length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              Nenhuma supervisão finalizada no período selecionado.
            </div>
          ) : (
            <Card>
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-800">Detalhamento por Núcleo</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                      <th className="px-5 py-3">Núcleo</th>
                      <th className="px-5 py-3">Visitas</th>
                      <th className="px-5 py-3">Média presença</th>
                      <th className="px-5 py-3">Estrutura</th>
                      <th className="px-5 py-3">Materiais</th>
                      <th className="px-5 py-3">Uniformes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(porNucleo).map(([nucleoId, sups]) => {
                      const nome = sups[0]?.nucleo?.identificacao ?? nucleoId;
                      const presencas = sups.filter((s) => s.beneficiariosEsperados);
                      const avgPresenca = presencas.length === 0 ? "—" :
                        `${(presencas.reduce((a, s) => a + (s.beneficiariosPresentes! / s.beneficiariosEsperados!), 0) / presencas.length * 100).toFixed(0)}%`;
                      const estrutura = mediaAvaliacao(sups, "estruturaAvaliacao");
                      const materiais = mediaAvaliacao(sups, "materiaisAvaliacao");
                      const uniformes = mediaAvaliacao(sups, "uniformesAvaliacao");
                      return (
                        <tr key={nucleoId} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                          <td className="px-5 py-3 font-medium text-zinc-800">{nome}</td>
                          <td className="px-5 py-3 text-zinc-600">{sups.length}</td>
                          <td className="px-5 py-3 font-semibold text-zinc-700">{avgPresenca}</td>
                          {[estrutura, materiais, uniformes].map((av, i) => (
                            <td key={i} className="px-5 py-3">
                              {av === "—" ? <span className="text-zinc-300">—</span> : (
                                <Badge tone={avaliacaoTone[av] ?? "zinc"}>{avaliacaoLabel[av] ?? av}</Badge>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Lista completa */}
          {finalizadas.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-800">Todas as supervisões ({finalizadas.length})</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {finalizadas.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{s.nucleo?.identificacao ?? "—"}</p>
                      <p className="text-xs text-zinc-400">{formatarData(s.dataSupervisao)} · {s.coordenador?.nome ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {s.beneficiariosPresentes != null && s.beneficiariosEsperados != null && (
                        <span>{s.beneficiariosPresentes}/{s.beneficiariosEsperados} presentes</span>
                      )}
                      <Badge tone="green">Finalizada</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
