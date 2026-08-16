"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { areaProfessorApi } from "@/lib/api/services";
import { Badge, Button, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { funcionariosApi, registrosPontoApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { useToast } from "@/components/providers/ToastProvider";
import type { RegistroPonto, StatusPonto } from "@/lib/types";
import { ChevronLeft, ChevronRight, Printer, Save } from "lucide-react";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const STATUS_PONTO_CONFIG: Record<StatusPonto, { label: string; tone: "green"|"red"|"amber"|"zinc"|"sky" }> = {
  presente:          { label: "Presente",    tone: "green"  },
  falta:             { label: "Falta",       tone: "red"    },
  falta_justificada: { label: "Justificada", tone: "amber"  },
  folga:             { label: "Folga",       tone: "zinc"   },
  feriado:           { label: "Feriado",     tone: "sky"    },
};

function getDiasDoMes(ano: number, mes: number): Date[] {
  const dias: Date[] = [];
  const total = new Date(ano, mes, 0).getDate();
  for (let d = 1; d <= total; d++) dias.push(new Date(ano, mes - 1, d));
  return dias;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function calcularHoras(entrada?: string, saida?: string): string {
  if (!entrada || !saida) return "—";
  const [eh, em] = entrada.split(":").map(Number);
  const [sh, sm] = saida.split(":").map(Number);
  const minutos = (sh * 60 + sm) - (eh * 60 + em);
  if (minutos <= 0) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}h${m > 0 ? `${String(m).padStart(2, "0")}` : ""}`;
}

const DIA_JORNADA: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

export default function MeuPontoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [funcionarioId, setFuncionarioId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Descobrir o funcionário do professor logado
  useEffect(() => {
    async function resolve() {
      if (!user?.id) return;
      try {
        const dados = await areaProfessorApi.getDadosProfessor(user.id);
        if (dados?.funcionario?.id) {
          setFuncionarioId(dados.funcionario.id);
        }
      } catch {
        // fallback
      } finally {
        setCarregando(false);
      }
    }
    resolve();
  }, [user?.id]);

  const { data: funcionario } = useQuery(
    () => (funcionarioId ? funcionariosApi.get(funcionarioId) : Promise.resolve(null)),
    [funcionarioId]
  );

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const diasDoMes = getDiasDoMes(ano, mes);

  const [registros, setRegistros] = useState<Record<string, RegistroPonto>>({});

  // Carregar registros do banco quando mês/ano muda
  useEffect(() => {
    if (!funcionarioId) return;
    async function load() {
      try {
        const raw = await registrosPontoApi.listByFuncionarioMes(funcionarioId!, ano, mes);
        const newState: Record<string, RegistroPonto> = {};
        const byDate: Record<string, any> = {};

        for (const r of raw) {
          if (!byDate[r.data]) byDate[r.data] = {};
          if (r.tipo === 'entrada' && !byDate[r.data].entradaReal) byDate[r.data].entradaReal = r.hora.substring(0, 5);
          if (r.tipo === 'saida' && !byDate[r.data].saidaReal) byDate[r.data].saidaReal = r.hora.substring(0, 5);
          if (r.observacao) byDate[r.data].observacao = r.observacao;
        }

        for (const d in byDate) {
          const hasBoth = byDate[d].entradaReal && byDate[d].saidaReal;
          newState[d] = {
            id: `bd-${d}`,
            funcionarioId: funcionarioId!,
            data: d,
            status: hasBoth ? 'presente' : 'falta',
            criadoEm: new Date().toISOString(),
            ...byDate[d],
          };
        }
        setRegistros(newState);
      } catch (err) {
        console.error("Erro ao carregar registros:", err);
      }
    }
    load();
  }, [funcionarioId, ano, mes]);

  function navegarMes(delta: number) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes > 12) { novoMes = 1; novoAno++; }
    if (novoMes < 1) { novoMes = 12; novoAno--; }
    setMes(novoMes);
    setAno(novoAno);
    setRegistros({});
  }

  // Totalizadores
  const totais = { presentes: 0, faltas: 0, justificadas: 0, horas: 0 };
  for (const d of diasDoMes) {
    const iso = isoDate(d);
    const reg = registros[iso];
    if (!reg) continue;
    if (reg.status === "presente") {
      totais.presentes++;
      const [eh, em] = (reg.entradaReal ?? "00:00").split(":").map(Number);
      const [sh, sm] = (reg.saidaReal ?? "00:00").split(":").map(Number);
      const minutos = (sh * 60 + sm) - (eh * 60 + em);
      if (minutos > 0) totais.horas += minutos;
    }
    if (reg.status === "falta") totais.faltas++;
    if (reg.status === "falta_justificada") totais.justificadas++;
  }
  const totalHorasStr = `${Math.floor(totais.horas / 60)}h${String(totais.horas % 60).padStart(2, "0")}`;

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  if (!funcionarioId) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Não foi possível identificar seu cadastro de funcionário. Contate o administrador.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meu Espelho de Ponto"
        description={`${funcionario?.nomeCompleto ?? ''} · ${funcionario?.funcao ?? ''}`}
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        }
      />

      {/* Navegação de mês */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navegarMes(-1)} className="rounded p-1 hover:bg-zinc-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="min-w-[160px] text-center text-lg font-semibold text-zinc-900">
              {MESES[mes - 1]} {ano}
            </p>
            <button
              type="button"
              onClick={() => navegarMes(1)}
              disabled={ano === hoje.getFullYear() && mes === hoje.getMonth() + 1}
              className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">{totais.presentes} dias trabalhados</span>
            <span className="text-red-500 font-medium">{totais.faltas} falta(s)</span>
            <span className="text-amber-500 font-medium">{totais.justificadas} justif.</span>
            <Badge tone="zinc">{totalHorasStr} trabalhadas</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Tabela de ponto (somente leitura) */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Registro diário</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Dia</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Entrada</th>
                <th className="px-4 py-3">Saída</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {diasDoMes.map((date) => {
                const iso = isoDate(date);
                const diaSemana = date.getDay();
                const abrevDia = DIAS_SEMANA[diaSemana];
                const reg = registros[iso];

                const diaJornada = funcionario?.jornada?.find(
                  (j) => DIA_JORNADA[j.dia] === diaSemana,
                );
                const diaUtil = diaJornada?.trabalha ?? false;
                const isFinalSemana = diaSemana === 0 || diaSemana === 6;
                const status: StatusPonto = reg?.status ?? (diaUtil ? "falta" : "folga");
                const cfg = STATUS_PONTO_CONFIG[status];
                const hoje_iso = isoDate(new Date());
                const futuro = iso > hoje_iso;

                return (
                  <tr
                    key={iso}
                    className={`border-b border-zinc-100 last:border-0 ${
                      isFinalSemana ? "bg-zinc-50" : "hover:bg-zinc-50"
                    } ${futuro ? "opacity-40" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{date.getDate()}</td>
                    <td className="px-4 py-2.5 font-medium text-zinc-700">{abrevDia}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={cfg.tone}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                      {reg?.entradaReal ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                      {reg?.saidaReal ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600 tabular-nums">
                      {calcularHoras(reg?.entradaReal, reg?.saidaReal)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {reg?.observacao?.toLowerCase().includes("retroativa") ? (
                        <span className="inline-flex items-center rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                          Aprovação Retroativa
                        </span>
                      ) : (
                        reg?.observacao ?? "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
