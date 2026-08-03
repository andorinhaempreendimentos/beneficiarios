"use client";

import { notFound } from "next/navigation";
import { use, useRef, useState } from "react";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, LogIn, LogOut, Save, Upload, X } from "lucide-react";

function horaAgora(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
import { Badge, Button, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { getFuncionarioById } from "@/lib/mock/funcionarios";
import { getPontoByFuncionarioMes } from "@/lib/mock/ponto";
import { getConfirmacoesByFuncionario } from "@/lib/mock/presencas";
import type { ConfirmacaoAtividade, RegistroPonto, StatusPonto } from "@/lib/types";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const DIA_JORNADA: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

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

// Modal de confirmação de atividade (instrutor)
interface ModalConfirmacaoProps {
  data: string;
  onConfirmar: (obs: string, fotoUrl: string) => void;
  onFechar: () => void;
}

function ModalConfirmacao({ data, onConfirmar, onFechar }: ModalConfirmacaoProps) {
  const [obs, setObs] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFotoPreview(url);
  }

  const [ano, mes, dia] = data.split("-");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-zinc-900">Confirmar aplicação de atividade</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{dia}/{mes}/{ano}</p>
          </div>
          <button type="button" onClick={onFechar} className="rounded p-1 hover:bg-zinc-100">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Upload de foto */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Foto da aula <span className="text-red-500">*</span></p>
            {fotoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoPreview} alt="Foto da aula" className="h-48 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => { setFotoPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
                  className="absolute right-2 top-2 rounded-full bg-white p-1 shadow"
                >
                  <X className="h-3.5 w-3.5 text-zinc-600" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-8 text-sm text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <Camera className="h-8 w-8 text-zinc-400" />
                <span>Tirar foto ou selecionar da galeria</span>
                <span className="text-xs text-zinc-400">JPG, PNG — máx. 10 MB</span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleArquivo}
            />
          </div>

          {/* Observação */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Observação</label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Descreva brevemente a atividade aplicada…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!fotoPreview) { alert("Foto obrigatória."); return; }
              onConfirmar(obs, fotoPreview);
            }}
          >
            <Upload className="h-4 w-4" />
            Confirmar atividade
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FolhaPontoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const funcionario = getFuncionarioById(id);
  if (!funcionario) notFound();

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);

  const diasDoMes = getDiasDoMes(ano, mes);

  // Registro de ponto (começa com dados mock, editável localmente)
  const [registros, setRegistros] = useState<Record<string, RegistroPonto>>(() => {
    const map: Record<string, RegistroPonto> = {};
    const mock = getPontoByFuncionarioMes(id, ano, mes);
    for (const r of mock) map[r.data] = r;
    return map;
  });

  // Confirmações de atividade
  const [confirmacoes, setConfirmacoes] = useState<Record<string, ConfirmacaoAtividade>>(() => {
    const map: Record<string, ConfirmacaoAtividade> = {};
    for (const c of getConfirmacoesByFuncionario(id)) map[c.data] = c;
    return map;
  });

  const [modalData, setModalData] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const hojeIso = isoDate(hoje);
  const regHoje = registros[hojeIso];
  const tipoBatida: "entrada" | "saida" =
    regHoje?.entradaReal && !regHoje?.saidaReal ? "saida" : "entrada";
  const [batidaRegistrada, setBatidaRegistrada] = useState<string | null>(null);

  function baterPonto() {
    const hora = horaAgora();
    const campo = tipoBatida === "entrada" ? "entradaReal" : "saidaReal";
    setSalvo(false);
    setRegistros((prev) => ({
      ...prev,
      [hojeIso]: {
        ...prev[hojeIso],
        id: prev[hojeIso]?.id ?? `pt-new-${hojeIso}`,
        funcionarioId: id,
        data: hojeIso,
        status: "presente",
        criadoEm: prev[hojeIso]?.criadoEm ?? new Date().toISOString(),
        [campo]: hora,
      },
    }));
    setBatidaRegistrada(hora);
  }

  const isInstrutor = funcionario.funcao === "Instrutor" || funcionario.funcao === "Monitor";

  function navegarMes(delta: number) {
    setSalvo(false);
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes > 12) { novoMes = 1; novoAno++; }
    if (novoMes < 1)  { novoMes = 12; novoAno--; }
    setMes(novoMes);
    setAno(novoAno);

    // Recarrega registros do novo mês
    const mock = getPontoByFuncionarioMes(id, novoAno, novoMes);
    const map: Record<string, RegistroPonto> = {};
    for (const r of mock) map[r.data] = r;
    setRegistros(map);
  }

  function atualizarCampo(data: string, campo: "entradaReal"|"saidaReal"|"observacao", valor: string) {
    setSalvo(false);
    setRegistros((prev) => ({
      ...prev,
      [data]: {
        ...prev[data],
        id: prev[data]?.id ?? `pt-new-${data}`,
        funcionarioId: id,
        data,
        status: prev[data]?.status ?? "presente",
        criadoEm: prev[data]?.criadoEm ?? new Date().toISOString(),
        [campo]: valor,
      },
    }));
  }

  function confirmarAtividade(data: string, obs: string, fotoUrl: string) {
    setConfirmacoes((prev) => ({
      ...prev,
      [data]: {
        id: `ca-${data}`,
        funcionarioId: id,
        turmaId: "—",
        data,
        fotoUrl,
        observacao: obs,
        confirmadoEm: new Date().toISOString(),
      },
    }));
    setModalData(null);
  }

  // Totalizadores
  const totais = {
    presentes: 0, faltas: 0, justificadas: 0, horas: 0,
  };
  for (const d of diasDoMes) {
    const iso = isoDate(d);
    const reg = registros[iso];
    if (!reg) continue;
    if (reg.status === "presente") {
      totais.presentes++;
      const [eh, em] = (reg.entradaReal ?? "00:00").split(":").map(Number);
      const [sh, sm] = (reg.saidaReal  ?? "00:00").split(":").map(Number);
      totais.horas += (sh * 60 + sm) - (eh * 60 + em);
    }
    if (reg.status === "falta") totais.faltas++;
    if (reg.status === "falta_justificada") totais.justificadas++;
  }
  const totalHorasStr = `${Math.floor(totais.horas / 60)}h${String(totais.horas % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-6">
      {modalData && (
        <ModalConfirmacao
          data={modalData}
          onConfirmar={(obs, url) => confirmarAtividade(modalData, obs, url)}
          onFechar={() => setModalData(null)}
        />
      )}

      <PageHeader
        title={`Folha de Ponto — ${funcionario.nomeCompleto}`}
        description={`${funcionario.funcao} · Mat. ${funcionario.matricula}`}
        actions={<LinkButton href={`/funcionarios/${id}`} variant="outline">Voltar ao funcionário</LinkButton>}
      />

      {/* Card de batida rápida — hoje */}
      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">Bater ponto hoje</p>
            <p className="text-xs text-zinc-500">
              {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              {regHoje?.entradaReal && (
                <> · Entrada registrada: <span className="font-mono font-semibold">{regHoje.entradaReal}</span></>
              )}
              {regHoje?.saidaReal && (
                <> · Saída: <span className="font-mono font-semibold">{regHoje.saidaReal}</span></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {batidaRegistrada && (
              <span className="text-sm text-green-600">
                {tipoBatida === "saida" ? "Saída" : "Entrada"} registrada às{" "}
                <span className="font-mono font-semibold">{batidaRegistrada}</span>
              </span>
            )}
            {!regHoje?.saidaReal && (
              <button
                type="button"
                onClick={baterPonto}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  tipoBatida === "entrada"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {tipoBatida === "entrada"
                  ? <><LogIn className="h-4 w-4" /> Bater entrada</>
                  : <><LogOut className="h-4 w-4" /> Bater saída</>
                }
              </button>
            )}
            {regHoje?.entradaReal && regHoje?.saidaReal && (
              <span className="flex items-center gap-1 text-sm text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Ponto completo
              </span>
            )}
          </div>
        </CardBody>
      </Card>

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

          {/* Totalizadores */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">{totais.presentes} dias trabalhados</span>
            <span className="text-red-500 font-medium">{totais.faltas} falta(s)</span>
            <span className="text-amber-500 font-medium">{totais.justificadas} justif.</span>
            <Badge tone="zinc">{totalHorasStr} trabalhadas</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Tabela de ponto */}
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
                {isInstrutor && <th className="px-4 py-3">Atividade</th>}
                <th className="px-4 py-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {diasDoMes.map((date) => {
                const iso = isoDate(date);
                const diaSemana = date.getDay();
                const abrevDia = DIAS_SEMANA[diaSemana];
                const reg = registros[iso];

                // Determina se é dia de trabalho na jornada
                const diaJornada = funcionario.jornada.find(
                  (j) => DIA_JORNADA[j.dia] === diaSemana,
                );
                const diaUtil = diaJornada?.trabalha ?? false;
                const isFinalSemana = diaSemana === 0 || diaSemana === 6;
                const status: StatusPonto = reg?.status ?? (diaUtil ? "falta" : "folga");
                const cfg = STATUS_PONTO_CONFIG[status];
                const confirmacao = confirmacoes[iso];
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

                    {/* Entrada */}
                    <td className="px-4 py-2.5">
                      {status === "presente" || reg?.entradaReal ? (
                        <input
                          type="time"
                          value={reg?.entradaReal ?? diaJornada?.entrada ?? ""}
                          onChange={(e) => atualizarCampo(iso, "entradaReal", e.target.value)}
                          disabled={futuro}
                          className="w-24 rounded border border-zinc-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none disabled:opacity-50"
                        />
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>

                    {/* Saída */}
                    <td className="px-4 py-2.5">
                      {status === "presente" || reg?.saidaReal ? (
                        <input
                          type="time"
                          value={reg?.saidaReal ?? diaJornada?.saida ?? ""}
                          onChange={(e) => atualizarCampo(iso, "saidaReal", e.target.value)}
                          disabled={futuro}
                          className="w-24 rounded border border-zinc-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none disabled:opacity-50"
                        />
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>

                    {/* Total horas */}
                    <td className="px-4 py-2.5 text-zinc-600 tabular-nums">
                      {calcularHoras(reg?.entradaReal, reg?.saidaReal)}
                    </td>

                    {/* Confirmação de atividade (só instrutores) */}
                    {isInstrutor && (
                      <td className="px-4 py-2.5">
                        {futuro ? (
                          <span className="text-zinc-300">—</span>
                        ) : confirmacao ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                            onClick={() => setModalData(iso)}
                            title="Atividade confirmada — clique para rever"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmada
                          </button>
                        ) : diaUtil ? (
                          <button
                            type="button"
                            onClick={() => setModalData(iso)}
                            className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                          >
                            <Camera className="h-3 w-3" />
                            Confirmar
                          </button>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    )}

                    {/* Observação */}
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={reg?.observacao ?? ""}
                        onChange={(e) => atualizarCampo(iso, "observacao", e.target.value)}
                        disabled={futuro}
                        placeholder="—"
                        className="w-40 rounded border border-zinc-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none disabled:opacity-50"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        {salvo && (
          <span className="self-center text-sm text-green-600">Ponto salvo com sucesso.</span>
        )}
        <Button onClick={() => setSalvo(true)} variant="primary">
          <Save className="h-4 w-4" />
          Salvar ponto
        </Button>
      </div>
    </div>
  );
}
