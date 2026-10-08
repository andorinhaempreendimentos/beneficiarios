"use client";

import { notFound } from "next/navigation";
import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Camera,
  Clock,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileText,
  Users,
  Eye,
  X,
  Play,
  Award,
  HelpCircle,
  UserX,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import {
  turmasApi,
  professoresApi,
  execucoesSessaoApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import type { ExecucaoSessaoApi, BeneficiarioPresencaApi } from "@/lib/types/execucaoAula";
import type { StatusPresenca } from "@/lib/types";
import { useQuery } from "@/lib/hooks/useQuery";
import { formatStorageUrl } from "@/lib/storage";

const DIA_ABREV: Record<string, number> = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  Sáb: 6,
};

function gerarDatasAula(dias: string[] = ["Seg", "Qua", "Sex"], quantidade = 8): string[] {
  const hoje = new Date();
  const resultado: string[] = [];
  const cursor = new Date(hoje);

  let tentativas = 0;
  while (resultado.length < quantidade && tentativas < 90) {
    const diaSemana = cursor.getDay();
    const bateu = dias.length === 0 || dias.some((d) => DIA_ABREV[d] === diaSemana);
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
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function parseHora(isoOrTime?: string | null, fallback = "--:--"): string {
  if (!isoOrTime) return fallback;
  if (isoOrTime.includes("T") || isoOrTime.includes(" ")) {
    const d = new Date(isoOrTime);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }
  return isoOrTime.slice(0, 5);
}

const STATUS_CONFIG: Record<
  StatusPresenca,
  { label: string; icon: React.ReactNode; tone: "green" | "red" | "amber" }
> = {
  presente: {
    label: "Presente",
    icon: <CheckCircle2 className="h-4 w-4" />,
    tone: "green",
  },
  falta: {
    label: "Falta",
    icon: <Circle className="h-4 w-4" />,
    tone: "red",
  },
  falta_justificada: {
    label: "Justificada",
    icon: <AlertCircle className="h-4 w-4" />,
    tone: "amber",
  },
};

const STATUS_CICLO: StatusPresenca[] = ["presente", "falta", "falta_justificada"];

type MapPresenca = Record<string, { status: StatusPresenca; observacao?: string }>;

export default function PresencaTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: turma } = useQuery(() => turmasApi.get(id), [id]);
  const { data: beneficiariosRes } = useQuery(() => turmasApi.listarBeneficiarios(id), [id]);
  const { data: sessoesExecutadasRes, refetch: refetchSessoes } = useQuery(
    () => execucoesSessaoApi.listAll({ turmaId: id }),
    [id]
  );

  const beneficiarios = beneficiariosRes ?? [];
  const sessoesExecutadas = useMemo(() => sessoesExecutadasRes ?? [], [sessoesExecutadasRes]);

  // Termos dinâmicos baseados na atividade vinculada ao grupo/turma
  const termoSessao = turma?.atividade?.termoSessao || "Sessão";
  const termoResponsavel = turma?.atividade?.termoResponsavel || "Responsável";
  const termoParticipante = turma?.atividade?.termoParticipante || "Participante";
  const termoGrupo = turma?.atividade?.termoGrupo || "Grupo";

  // Dias configurados na turma
  const diasTurma = useMemo(() => {
    if (!turma?.slots || turma.slots.length === 0) return ["Seg", "Qua", "Sex"];
    return Array.from(new Set(turma.slots.map((s) => s.dia)));
  }, [turma?.slots]);

  // Combina datas executadas reais com as datas previstas pela grade
  const datasDisponiveis = useMemo(() => {
    const datasSet = new Set<string>();
    for (const s of sessoesExecutadas) {
      if (s.data) datasSet.add(s.data);
    }
    const datasGrade = gerarDatasAula(diasTurma, 8);
    for (const d of datasGrade) {
      datasSet.add(d);
    }
    return Array.from(datasSet).sort();
  }, [sessoesExecutadas, diasTurma]);

  // Data inicial selecionada: prioriza a sessão executada mais recente ou a última data prevista
  const [dataAtual, setDataAtual] = useState<string>("");

  useEffect(() => {
    if (!dataAtual && datasDisponiveis.length > 0) {
      if (sessoesExecutadas.length > 0) {
        // Seleciona a sessão executada mais recente
        setDataAtual(sessoesExecutadas[0].data);
      } else {
        setDataAtual(datasDisponiveis[datasDisponiveis.length - 1]);
      }
    }
  }, [datasDisponiveis, sessoesExecutadas, dataAtual]);

  // Sessão executada associada à data atual selecionada
  const sessaoAtual = useMemo(() => {
    if (!dataAtual) return null;
    return sessoesExecutadas.find((s) => s.data === dataAtual) ?? null;
  }, [sessoesExecutadas, dataAtual]);

  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [fotoModalAberta, setFotoModalAberta] = useState(false);

  // Mapa de presenças por data: { [data]: { [beneficiarioId]: { status, observacao } } }
  const [mapas, setMapas] = useState<Record<string, MapPresenca>>({});

  // Carregar presenças quando a data ou a sessão mudar
  useEffect(() => {
    if (!id || !dataAtual) return;

    if (sessaoAtual) {
      // Prioridade: carregar presenças atômicas da execução da sessão
      execucoesSessaoApi
        .getPresencas(sessaoAtual.id)
        .then((rows) => {
          if (rows && rows.length > 0) {
            const mapaData: MapPresenca = {};
            rows.forEach((r) => {
              mapaData[r.beneficiarioId] = {
                status: r.status,
                observacao: r.observacao,
              };
            });
            setMapas((prev) => ({ ...prev, [dataAtual]: mapaData }));
          } else {
            // Se não houver presenças na execução, carregar via professoresApi
            carregarPresencasFallback();
          }
        })
        .catch(() => carregarPresencasFallback());
    } else {
      carregarPresencasFallback();
    }

    function carregarPresencasFallback() {
      professoresApi
        .buscarPresencasTurma(id, dataAtual)
        .then((rows: any[]) => {
          if (rows && rows.length > 0) {
            const mapaData: MapPresenca = {};
            rows.forEach((r) => {
              mapaData[r.beneficiario_id] = {
                status: r.status || (r.presente ? "presente" : "falta"),
                observacao: r.observacao,
              };
            });
            setMapas((prev) => ({ ...prev, [dataAtual]: mapaData }));
          }
        })
        .catch((err: any) => console.error("Erro ao carregar presenças:", err));
    }
  }, [id, dataAtual, sessaoAtual]);

  const mapaAtual = mapas[dataAtual] ?? {};
  const idxAtual = datasDisponiveis.indexOf(dataAtual);

  function ciclarStatus(beneficiarioId: string) {
    setSalvo(false);
    setMapas((prev) => {
      const mapa = { ...(prev[dataAtual] ?? {}) };
      const itemAtual = mapa[beneficiarioId]?.status ?? "falta";
      const proximo = STATUS_CICLO[(STATUS_CICLO.indexOf(itemAtual) + 1) % STATUS_CICLO.length];
      mapa[beneficiarioId] = {
        ...mapa[beneficiarioId],
        status: proximo,
      };
      return { ...prev, [dataAtual]: mapa };
    });
  }

  function marcarTodos(status: StatusPresenca) {
    setSalvo(false);
    setMapas((prev) => {
      const mapa: MapPresenca = {};
      for (const b of beneficiarios) {
        mapa[b.id] = { status };
      }
      return { ...prev, [dataAtual]: mapa };
    });
  }

  function handleObservacao(beneficiarioId: string, observacao: string) {
    setSalvo(false);
    setMapas((prev) => {
      const mapa = { ...(prev[dataAtual] ?? {}) };
      mapa[beneficiarioId] = {
        status: mapa[beneficiarioId]?.status ?? "falta_justificada",
        observacao,
      };
      return { ...prev, [dataAtual]: mapa };
    });
  }

  async function salvar() {
    setSalvando(true);
    const presencasPayload = beneficiarios.map((b) => ({
      beneficiarioId: b.id,
      status: (mapaAtual[b.id]?.status ?? "presente") as StatusPresenca,
      observacao: mapaAtual[b.id]?.observacao,
    }));

    try {
      if (sessaoAtual) {
        await execucoesSessaoApi.salvarPresencas(sessaoAtual.id, presencasPayload);
      }
      await professoresApi.salvarPresencas({
        turmaId: id,
        dataAula: dataAtual,
        presencas: presencasPayload.map((p) => ({
          beneficiarioId: p.beneficiarioId,
          presente: p.status === "presente",
        })),
      });
      setSalvo(true);
      refetchSessoes?.();
    } catch (err: any) {
      alert("Erro ao salvar presença no banco: " + (err?.message || "Tente novamente"));
    } finally {
      setSalvando(false);
    }
  }

  const presentes = Object.values(mapaAtual).filter((s) => s.status === "presente").length;
  const faltas = Object.values(mapaAtual).filter((s) => s.status === "falta").length;
  const justificadas = Object.values(mapaAtual).filter((s) => s.status === "falta_justificada").length;
  const taxaPresenca =
    beneficiarios.length > 0 ? Math.round((presentes / beneficiarios.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 px-2 sm:px-4">
      <PageHeader
        title={`Espelho de Presenças — ${turma?.nome ?? ""}`}
        description={`${beneficiarios.length} ${termoParticipante.toLowerCase()}(s) matriculado(s) • ${turma?.nucleo?.identificacao || "Núcleo"}`}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href={`/professor/aula/${id}?data=${dataAtual}`} variant="outline">
              <Play className="h-4 w-4 mr-1 text-emerald-600" />
              Executar no App
            </LinkButton>
            <LinkButton href={`/turmas/${id}`} variant="outline">
              Voltar ao {termoGrupo}
            </LinkButton>
          </div>
        }
      />

      {/* SELETOR DE SESSÕES EXECUTADAS E DATAS */}
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Navegador por setas */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (idxAtual > 0) {
                    setSalvo(false);
                    setDataAtual(datasDisponiveis[idxAtual - 1]);
                  }
                }}
                disabled={idxAtual <= 0}
                className="rounded-lg p-1.5 hover:bg-zinc-100 disabled:opacity-30 border border-zinc-200 cursor-pointer"
                title="Sessão anterior"
              >
                <ChevronLeft className="h-5 w-5 text-zinc-700" />
              </button>

              <div className="min-w-[190px] text-center">
                <p className="text-lg font-black text-zinc-900 flex items-center justify-center gap-1.5">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  {formatarDataExibicao(dataAtual)}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {termoSessao} {idxAtual >= 0 ? idxAtual + 1 : 1} de {datasDisponiveis.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (idxAtual < datasDisponiveis.length - 1) {
                    setSalvo(false);
                    setDataAtual(datasDisponiveis[idxAtual + 1]);
                  }
                }}
                disabled={idxAtual >= datasDisponiveis.length - 1}
                className="rounded-lg p-1.5 hover:bg-zinc-100 disabled:opacity-30 border border-zinc-200 cursor-pointer"
                title="Próxima sessão"
              >
                <ChevronRight className="h-5 w-5 text-zinc-700" />
              </button>
            </div>

            {/* Badges do Resumo da Chamada */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {presentes} presentes
              </span>
              <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                {faltas} faltas
              </span>
              {justificadas > 0 && (
                <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {justificadas} justif.
                </span>
              )}
              <Badge tone={taxaPresenca >= 75 ? "green" : taxaPresenca >= 50 ? "amber" : "red"}>
                {taxaPresenca}% frequência
              </Badge>
            </div>
          </div>

          {/* Atalho das sessões realizadas gravadas no banco */}
          {sessoesExecutadas.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {termoSessao}ões Realizadas ({sessoesExecutadas.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {sessoesExecutadas.map((s) => {
                  const isSelected = s.data === dataAtual;
                  const temFoto = Boolean(s.fotoComprovanteUrl);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSalvo(false);
                        setDataAtual(s.data);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                          : "bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <span>{formatarDataExibicao(s.data)}</span>
                      {temFoto && (
                        <Camera
                          className={`h-3 w-3 ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}
                        />
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          s.status === "concluida"
                            ? isSelected
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-100 text-emerald-800"
                            : isSelected
                            ? "bg-amber-500 text-white"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {s.status === "concluida" ? "Concluída" : "Pendente"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* CARD DE EVIDÊNCIA DA SESSÃO EXECUTADA */}
      {sessaoAtual ? (
        <Card className="border-sky-200 bg-gradient-to-br from-white via-sky-50/20 to-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-sky-100 bg-sky-50/50 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900">
                  Evidência da {termoSessao} Realizada
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Registro atômico efetuado em {formatarDataExibicao(sessaoAtual.data)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  sessaoAtual.status === "concluida"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {sessaoAtual.status === "concluida" ? "Status: Concluída" : "Status: Em Andamento"}
              </span>

              {sessaoAtual.statusAprovacao === "pendente_aprovacao" ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Aguardando Homologação
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  Homologada
                </span>
              )}
            </div>
          </CardHeader>

          <CardBody className="p-4 sm:p-5 flex flex-col gap-4">
            {/* GRID PRINCIPAL: RESPONSÁVEL, HORÁRIOS REAIS E PRESENÇA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* RESPONSÁVEL PRESENTE */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                    {termoResponsavel} Presente
                  </span>
                  <p className="text-sm font-extrabold text-zinc-900">
                    {sessaoAtual.professorNome || "Responsável registrado"}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2 block">
                  Presença assinada via aplicativo
                </span>
              </div>

              {/* HORÁRIO REAL EFETIVO */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    Horário Real Cronometrado
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-emerald-700">
                      {parseHora(sessaoAtual.horaInicioReal)} às {parseHora(sessaoAtual.horaFimReal)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2 block">
                  Previsto: {sessaoAtual.horaInicioPrevista} às {sessaoAtual.horaFimPrevista}
                </span>
              </div>

              {/* CONTAGEM DE PRESENÇAS */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    Frequência Efetiva
                  </span>
                  <p className="text-sm font-black text-zinc-900">
                    <span className="text-emerald-600">{presentes} Presentes</span> •{" "}
                    <span className="text-rose-600">{faltas + justificadas} Faltas</span>
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2 block">
                  Total de {beneficiarios.length} {termoParticipante.toLowerCase()}s matriculados
                </span>
              </div>
            </div>

            {/* SEÇÃO DA FOTO COMPROBATÓRIA & DIÁRIO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-sky-100">
              {/* FOTO COMPROBATÓRIA */}
              <div className="md:col-span-1 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-zinc-700 uppercase flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-sky-600" />
                  Foto Comprobatória
                </span>

                {sessaoAtual.fotoComprovanteUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-xs max-w-xs">
                    <img
                      src={formatStorageUrl(sessaoAtual.fotoComprovanteUrl)}
                      alt="Foto comprobatória da sessão"
                      className="w-full h-44 object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                      onClick={() => setFotoModalAberta(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setFotoModalAberta(true)}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 hover:bg-black text-white text-[10px] font-bold rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      Ampliar
                    </button>
                    <span className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs">
                      Comprovado
                    </span>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center p-4 text-center text-zinc-400">
                    <Camera className="h-8 w-8 text-zinc-300 mb-1" />
                    <span className="text-xs font-semibold">Sem foto anexada</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">
                      Registro concluído sem comprovação fotográfica
                    </span>
                  </div>
                )}
              </div>

              {/* DIÁRIO DE ATIVIDADES E JUSTIFICATIVAS */}
              <div className="md:col-span-2 flex flex-col gap-3">
                {sessaoAtual.observacoes && (
                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1 mb-1">
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      Diário de Atividades / Observações
                    </span>
                    <p className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {sessaoAtual.observacoes}
                    </p>
                  </div>
                )}

                {sessaoAtual.justificativaRetroativa && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Justificativa de Lançamento Retroativo
                    </span>
                    <p className="text-xs font-mono text-amber-900 bg-amber-100/60 p-2 rounded border border-amber-300/80">
                      {sessaoAtual.justificativaRetroativa}
                    </p>
                  </div>
                )}

                {!sessaoAtual.observacoes && !sessaoAtual.justificativaRetroativa && (
                  <div className="h-full rounded-xl bg-zinc-50 border border-zinc-100 p-4 flex items-center justify-center text-xs text-zinc-400 text-center">
                    Nenhuma anotação complementar registrada para esta {termoSessao.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardBody className="p-4 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <strong>Nenhum registro oficial de execução via App nesta data.</strong>
                <p className="text-amber-800 mt-0.5">
                  As presenças podem ser lançadas manualmente abaixo ou iniciadas em tempo real pelo {termoResponsavel}.
                </p>
              </div>
            </div>
            <LinkButton
              href={`/professor/aula/${id}?data=${dataAtual}`}
              variant="outline"
              className="bg-white shrink-0"
            >
              Iniciar {termoSessao}
            </LinkButton>
          </CardBody>
        </Card>
      )}

      {/* LISTA DE BENEFICIÁRIOS / CHAMADA */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" />
              <span>Lista de Chamada dos {termoParticipante}s</span>
            </h3>
            <p className="text-xs text-zinc-500">
              {beneficiarios.length} {termoParticipante.toLowerCase()}(s) aptos para registro
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => marcarTodos("presente")}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            >
              Todos Presentes
            </button>
            <button
              type="button"
              onClick={() => marcarTodos("falta")}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
            >
              Limpar (Faltas)
            </button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {beneficiarios.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">
              Nenhum {termoParticipante.toLowerCase()} matriculado neste(a) {termoGrupo.toLowerCase()}.
            </p>
          )}

          <ul className="divide-y divide-zinc-100">
            {beneficiarios.map((b) => {
              const item = mapaAtual[b.id];
              const status: StatusPresenca = item?.status ?? "falta";
              const cfg = STATUS_CONFIG[status];
              return (
                <li
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 hover:bg-zinc-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => ciclarStatus(b.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        status === "presente"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs"
                          : status === "falta"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-300"
                      }`}
                      title="Clique para alternar (Presente -> Falta -> Justificada)"
                    >
                      {cfg.icon}
                      {cfg.label}
                    </button>

                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{b.nomeCompleto}</p>
                      <p className="text-xs font-mono text-zinc-400">Matrícula: {b.matricula}</p>
                    </div>

                    {b.pcd && <Badge tone="sky">PcD</Badge>}
                  </div>

                  {/* Observação / Justificativa se justificada */}
                  {status === "falta_justificada" && (
                    <div className="w-full sm:w-72">
                      <input
                        type="text"
                        placeholder="Motivo da falta justificada..."
                        value={item?.observacao || ""}
                        onChange={(e) => handleObservacao(b.id, e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {/* AÇÃO SALVAR */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {salvo && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Presença salva com sucesso no banco.
            </span>
          )}
        </div>

        <Button onClick={salvar} variant="primary" disabled={salvando}>
          <Save className="h-4 w-4 mr-1" />
          {salvando ? "Salvando Presenças..." : "Salvar Presenças da Sessão"}
        </Button>
      </div>

      {/* MODAL PARA FOTO AMPLIADA */}
      {fotoModalAberta && sessaoAtual?.fotoComprovanteUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-sky-400" />
                  Foto Comprobatória da {termoSessao}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {turma?.nome} • {formatarDataExibicao(sessaoAtual.data)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFotoModalAberta(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-2 bg-black flex items-center justify-center">
              <img
                src={formatStorageUrl(sessaoAtual.fotoComprovanteUrl)}
                alt="Foto Comprobatória"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
              <span>{termoResponsavel}: {sessaoAtual.professorNome || "Registrado"}</span>
              <button
                type="button"
                onClick={() => setFotoModalAberta(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
