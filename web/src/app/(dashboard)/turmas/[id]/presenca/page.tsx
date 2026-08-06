"use client";

import { notFound } from "next/navigation";
import { use, useState } from "react";
import { CheckCircle2, Circle, AlertCircle, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { turmasApi, beneficiariosApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import type { StatusPresenca } from "@/lib/types";

// Gera datas de aula retroativas (últimas 8 ocorrências) a partir de hoje
const DIA_ABREV: Record<string, number> = {
  Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6,
};

function gerarDatasAula(dias: string[] = ["Seg", "Qua", "Sex"], quantidade = 8): string[] {
  const hoje = new Date();
  const resultado: string[] = [];
  const cursor = new Date(hoje);

  let tentativas = 0;
  while (resultado.length < quantidade && tentativas < 90) {
    const diaSemana = cursor.getDay();
    const bateu = dias.some((d) => DIA_ABREV[d] === diaSemana);
    if (bateu) {
      resultado.unshift(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() - 1);
    tentativas++;
  }
  if (resultado.length === 0) {
    resultado.push(hoje.toISOString().slice(0, 10));
  }
  return resultado;
}

function formatarDataExibicao(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

const STATUS_CONFIG: Record<StatusPresenca, { label: string; icon: React.ReactNode; tone: "green" | "red" | "amber" }> = {
  presente:         { label: "Presente",         icon: <CheckCircle2 className="h-4 w-4" />, tone: "green" },
  falta:            { label: "Falta",             icon: <Circle        className="h-4 w-4" />, tone: "red"   },
  falta_justificada:{ label: "Justificada",       icon: <AlertCircle   className="h-4 w-4" />, tone: "amber" },
};

const STATUS_CICLO: StatusPresenca[] = ["presente", "falta", "falta_justificada"];

type MapPresenca = Record<string, StatusPresenca>; // beneficiarioId → status

export default function PresencaTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const { data: turma } = useQuery(() => turmasApi.get(id), [id]);
  const { data: beneficiariosRes } = useQuery(() => beneficiariosApi.list({ limit: 100 }), []);
  
  const beneficiarios = beneficiariosRes?.data ?? [];
  const datas = gerarDatasAula([], 8);

  const [dataAtual, setDataAtual] = useState<string>(datas[datas.length - 1] ?? "");
  const [salvo, setSalvo] = useState(false);

  const [mapas, setMapas] = useState<Record<string, MapPresenca>>({});

  const mapaAtual = mapas[dataAtual] ?? {};
  const idxAtual = datas.indexOf(dataAtual);

  function ciclarStatus(beneficiarioId: string) {
    setSalvo(false);
    setMapas((prev) => {
      const mapa = { ...(prev[dataAtual] ?? {}) };
      const atual = mapa[beneficiarioId] ?? "falta";
      const proximo = STATUS_CICLO[(STATUS_CICLO.indexOf(atual) + 1) % STATUS_CICLO.length];
      mapa[beneficiarioId] = proximo;
      return { ...prev, [dataAtual]: mapa };
    });
  }

  function marcarTodos(status: StatusPresenca) {
    setSalvo(false);
    setMapas((prev) => {
      const mapa: MapPresenca = {};
      for (const b of beneficiarios) mapa[b.id] = status;
      return { ...prev, [dataAtual]: mapa };
    });
  }

  function salvar() {
    // Mock: simula salvamento
    setSalvo(true);
  }

  const presentes       = Object.values(mapaAtual).filter((s) => s === "presente").length;
  const faltas          = Object.values(mapaAtual).filter((s) => s === "falta").length;
  const justificadas    = Object.values(mapaAtual).filter((s) => s === "falta_justificada").length;
  const taxaPresenca    = beneficiarios.length > 0
    ? Math.round((presentes / beneficiarios.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Presença — ${turma?.nome ?? ''}`}
        description={`${beneficiarios.length} beneficiário(s) ativo(s)`}
        actions={<LinkButton href={`/turmas/${id}`} variant="outline">Voltar à turma</LinkButton>}
      />

      {/* Navegação de datas */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (idxAtual > 0) { setSalvo(false); setDataAtual(datas[idxAtual - 1]); } }}
              disabled={idxAtual <= 0}
              className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[180px] text-center">
              <p className="text-lg font-semibold text-zinc-900">{formatarDataExibicao(dataAtual)}</p>
              <p className="text-xs text-zinc-500">Aula {idxAtual + 1} de {datas.length}</p>
            </div>
            <button
              type="button"
              onClick={() => { if (idxAtual < datas.length - 1) { setSalvo(false); setDataAtual(datas[idxAtual + 1]); } }}
              disabled={idxAtual >= datas.length - 1}
              className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Resumo */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">{presentes} presentes</span>
            <span className="text-red-500 font-medium">{faltas} faltas</span>
            <span className="text-amber-500 font-medium">{justificadas} justif.</span>
            <Badge tone={taxaPresenca >= 75 ? "green" : taxaPresenca >= 50 ? "amber" : "red"}>
              {taxaPresenca}%
            </Badge>
          </div>
        </CardBody>
      </Card>

      {/* Lista de beneficiários */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">Lista de chamada</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => marcarTodos("presente")}
              className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
            >
              Todos presentes
            </button>
            <button
              type="button"
              onClick={() => marcarTodos("falta")}
              className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
            >
              Limpar
            </button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {beneficiarios.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">
              Nenhum beneficiário ativo nesta turma.
            </p>
          )}
          <ul className="divide-y divide-zinc-100">
            {beneficiarios.map((b) => {
              const status: StatusPresenca = mapaAtual[b.id] ?? "falta";
              const cfg = STATUS_CONFIG[status];
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50"
                >
                  <button
                    type="button"
                    onClick={() => ciclarStatus(b.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      status === "presente"
                        ? "bg-green-50 text-green-700"
                        : status === "falta"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                    title="Clique para alternar status"
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-800">{b.nomeCompleto}</p>
                    <p className="text-xs text-zinc-500">Mat. {b.matricula}</p>
                  </div>

                  {b.pcd && (
                    <Badge tone="sky">PcD</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {/* Ação salvar */}
      <div className="flex justify-end gap-3">
        {salvo && (
          <span className="self-center text-sm text-green-600">Presença salva com sucesso.</span>
        )}
        <Button onClick={salvar} variant="primary">
          <Save className="h-4 w-4" />
          Salvar presença
        </Button>
      </div>
    </div>
  );
}
