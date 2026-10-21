"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  UserCheck,
  Camera,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Award,
  Circle,
  AlertCircle,
} from "lucide-react";
import { formatStorageUrl } from "@/lib/storage";
import {
  execucoesSessaoApi,
  turmasApi,
  type TurmaApi,
  type BeneficiarioApi,
} from "@/lib/api/services";
import type { ExecucaoSessaoApi, BeneficiarioPresencaApi } from "@/lib/types/execucaoAula";

interface ModalInformacoesAulaProps {
  isOpen: boolean;
  onClose: () => void;
  turma: TurmaApi;
  dataAula: string;
  execucaoId?: string;
  execucaoInicial?: ExecucaoSessaoApi | null;
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

function formatarDataExibicao(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export function ModalInformacoesAula({
  isOpen,
  onClose,
  turma,
  dataAula,
  execucaoId,
  execucaoInicial,
}: ModalInformacoesAulaProps) {
  const [execucao, setExecucao] = useState<ExecucaoSessaoApi | null>(execucaoInicial ?? null);
  const [presencas, setPresencas] = useState<BeneficiarioPresencaApi[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoModalAberta, setFotoModalAberta] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelado = false;
    setLoading(true);

    async function carregarDados() {
      try {
        let exec = execucaoInicial ?? null;

        if (!exec) {
          if (execucaoId) {
            exec = await execucoesSessaoApi.getById(execucaoId);
          } else {
            exec = await execucoesSessaoApi.getExecucao(turma.id, dataAula);
          }
        }

        if (cancelado) return;
        setExecucao(exec);

        const [benefRes, presencasRes] = await Promise.all([
          turmasApi.listarBeneficiarios(turma.id).catch(() => []),
          exec?.id ? execucoesSessaoApi.getPresencas(exec.id).catch(() => []) : Promise.resolve([]),
        ]);

        if (cancelado) return;
        setBeneficiarios(benefRes);
        setPresencas(presencasRes);
      } catch (err) {
        console.error("Erro ao carregar informações da aula:", err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
    };
  }, [isOpen, turma.id, dataAula, execucaoId, execucaoInicial]);

  const mapaPresencas = useMemo(() => {
    const map = new Map<string, BeneficiarioPresencaApi>();
    presencas.forEach((p) => map.set(p.beneficiarioId, p));
    return map;
  }, [presencas]);

  // Contadores
  const contadores = useMemo(() => {
    let p = 0;
    let f = 0;
    let j = 0;
    beneficiarios.forEach((b) => {
      const reg = mapaPresencas.get(b.id);
      const status = reg?.status ?? "falta";
      if (status === "presente") p++;
      else if (status === "falta_justificada") j++;
      else f++;
    });
    const taxa = beneficiarios.length > 0 ? Math.round((p / beneficiarios.length) * 100) : 0;
    return { presentes: p, faltas: f, justificadas: j, taxa };
  }, [beneficiarios, mapaPresencas]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4 max-h-[92dvh] overflow-y-auto">
        
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                ✓ Aula Executada
              </span>
              {execucao?.statusAprovacao === "aprovado" ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Homologada
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" /> Aguardando Homologação
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1">{turma.nome}</h3>
            <p className="text-xs text-zinc-500 font-medium">
              {turma.nucleo?.identificacao || "Polo Esportivo"} • {formatarDataExibicao(dataAula)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
            <span className="text-xs font-semibold">Carregando informações da aula...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* GRID DE INFORMAÇÕES TEMPORAIS E RESPONSÁVEL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* HORÁRIO REAL CRONOMETRADO */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-amber-800 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Horário Real
                </span>
                <p className="text-base font-black text-zinc-900 mt-1">
                  {parseHora(execucao?.horaInicioReal)} às {parseHora(execucao?.horaFimReal)}
                </p>
                <span className="text-[10px] text-zinc-500 mt-1">
                  Previsto: {parseHora(execucao?.horaInicioPrevista)} - {parseHora(execucao?.horaFimPrevista)}
                </span>
              </div>

              {/* FREQUÊNCIA DA TURMA */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  Frequência
                </span>
                <p className="text-base font-black text-emerald-700 mt-1">
                  {contadores.presentes} de {beneficiarios.length} ({contadores.taxa}%)
                </p>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {contadores.faltas + contadores.justificadas} falta(s) registrada(s)
                </span>
              </div>

              {/* PROFESSOR RESPONSÁVEL */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-sky-800 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                  Responsável
                </span>
                <p className="text-sm font-extrabold text-zinc-900 mt-1 truncate">
                  {execucao?.professorNome || (turma.responsaveisNomes ?? []).join(", ") || "Professor registrado"}
                </p>
                <span className="text-[10px] text-zinc-500 mt-1">
                  Ponto de entrada e saída assinado
                </span>
              </div>
            </div>

            {/* FOTO COMPROBATÓRIA E OBSERVAÇÕES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* FOTO */}
              <div className="rounded-2xl border border-zinc-200 p-3.5 bg-zinc-50 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-zinc-700 uppercase flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-zinc-500" />
                  Comprovação Fotográfica
                </span>

                {execucao?.fotoComprovanteUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-900 shadow-xs h-40">
                    <img
                      src={formatStorageUrl(execucao.fotoComprovanteUrl)}
                      alt="Foto comprobatória da aula"
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                      onClick={() => setFotoModalAberta(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setFotoModalAberta(true)}
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[10px] font-bold rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <Eye className="h-3 w-3" /> Ampliar
                    </button>
                    <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow-xs">
                      ✓ Foto Registrada
                    </span>
                  </div>
                ) : (
                  <div className="h-40 rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex flex-col justify-center items-center text-center gap-1">
                    <Camera className="h-6 w-6 text-amber-500" />
                    <span className="text-xs font-bold text-amber-900">Sem foto anexada</span>
                    <span className="text-[10px] text-amber-700 leading-tight">
                      Aula encerrada mediante termo de declaração e ciência do professor.
                    </span>
                  </div>
                )}
              </div>

              {/* DIÁRIO DE CLASSE / OBSERVAÇÕES */}
              <div className="rounded-2xl border border-zinc-200 p-3.5 bg-zinc-50 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-zinc-700 uppercase flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-zinc-500" />
                  Diário de Atividades / Observações
                </span>

                <div className="h-40 rounded-xl bg-white border border-zinc-200 p-3 overflow-y-auto text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {execucao?.observacoes ? (
                    execucao.observacoes
                  ) : (
                    <span className="text-zinc-400 italic">
                      Nenhuma observação pedagógica adicional registrada para esta aula.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* LISTA NOMINAL DE CHAMADA DOS ALUNOS */}
            <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
              <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-zinc-700 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  Espelho da Chamada ({beneficiarios.length} alunos)
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="text-emerald-700">{contadores.presentes} presentes</span>
                  <span>•</span>
                  <span className="text-rose-600">{contadores.faltas + contadores.justificadas} faltas</span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100">
                {beneficiarios.length === 0 ? (
                  <p className="p-4 text-center text-xs text-zinc-400">
                    Nenhum aluno matriculado nesta turma.
                  </p>
                ) : (
                  beneficiarios.map((b) => {
                    const reg = mapaPresencas.get(b.id);
                    const status = reg?.status ?? "falta";

                    return (
                      <div
                        key={b.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-zinc-50/70 transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-800 truncate">
                            {b.nomeCompleto}
                          </span>
                          {b.matricula && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              #{b.matricula}
                            </span>
                          )}
                          {b.pcd && (
                            <span className="text-[9px] bg-sky-100 text-sky-800 font-extrabold px-1.5 py-0.2 rounded">
                              PcD
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {status === "presente" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Presente
                            </span>
                          ) : status === "falta_justificada" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1" title={reg?.observacao || "Justificada"}>
                              <AlertCircle className="h-3 w-3 text-amber-600" /> Justificada
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <Circle className="h-3 w-3 text-rose-600" /> Falta
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* BOTÃO FECHAR */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Fechar Informações
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE FOTO AMPLIADA */}
      {fotoModalAberta && execucao?.fotoComprovanteUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFotoModalAberta(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={formatStorageUrl(execucao.fotoComprovanteUrl)}
              alt="Comprovação ampliada"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setFotoModalAberta(false)}
              className="absolute -top-3 -right-3 rounded-full bg-white p-2 text-zinc-900 shadow-lg hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
