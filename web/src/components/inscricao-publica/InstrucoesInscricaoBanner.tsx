import { MapPin, Info, CheckCircle2, Navigation, Check } from "lucide-react";
import type { NucleoApi, AtividadeApi } from "@/lib/api/services";

interface InstrucoesInscricaoBannerProps {
  nucleo?: NucleoApi | null;
  atividade?: AtividadeApi | null;
  tipoLink?: "geral" | "nucleo" | "atividade" | "turma";
  etapaAtual?: number;
}

export function InstrucoesInscricaoBanner({
  nucleo,
  atividade,
  tipoLink = "nucleo",
  etapaAtual = 1,
}: InstrucoesInscricaoBannerProps) {
  const enderecoFormatado = nucleo
    ? [nucleo.endereco, nucleo.bairro, nucleo.cidade, nucleo.regiao].filter(Boolean).join(", ")
    : null;

  const ETAPA_NUCLEO = {
    titulo: "Escolha o Núcleo",
    sub: "Selecione o local mais próximo de você.",
  };
  const ETAPA_ATIVIDADE = {
    titulo: "Escolha a Atividade",
    sub: "Selecione a modalidade esportiva desejada.",
  };
  const ETAPA_TURMA = {
    titulo: "Escolha a Turma",
    sub: "Selecione o horário e turno ideal.",
  };
  const ETAPA_DADOS = {
    titulo: "Preencha os Dados",
    sub: "Informe os dados do aluno e do responsável.",
  };

  const etapasMap = {
    geral: [ETAPA_NUCLEO, ETAPA_ATIVIDADE, ETAPA_TURMA, ETAPA_DADOS],
    nucleo: [ETAPA_ATIVIDADE, ETAPA_TURMA, ETAPA_DADOS],
    atividade: [ETAPA_TURMA, ETAPA_DADOS],
    turma: [ETAPA_DADOS],
  };

  const etapas = etapasMap[tipoLink].map((e, i) => ({ ...e, num: i + 1 }));

  return (
    <div className="flex flex-col gap-4">
      {/* Card de Localização e Endereço do Núcleo */}
      {nucleo && (
        <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50/80 via-white to-sky-50/30 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                  Núcleo de Atendimento
                </span>
                {nucleo.nomeLocal && (
                  <span className="text-xs text-zinc-500 font-medium">
                    ({nucleo.nomeLocal})
                  </span>
                )}
              </div>
              <h2 className="text-base font-extrabold text-zinc-900 mt-1">
                {nucleo.identificacao}
              </h2>
              {enderecoFormatado && (
                <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-zinc-600">
                  <Navigation className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span>{enderecoFormatado}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guia de Instruções com Progresso de Etapa Atual */}
      <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-700 shrink-0" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-900">
              Etapas da sua inscrição
            </h3>
          </div>
          <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
            Etapa {etapaAtual} de {etapas.length}
          </span>
        </div>

        <div className={`grid grid-cols-1 gap-3 text-xs ${
          etapas.length === 1 ? 'sm:grid-cols-1' :
          etapas.length === 2 ? 'sm:grid-cols-2' :
          etapas.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
        }`}>
          {etapas.map(({ num, titulo, sub }) => {
            const isAtual = etapaAtual === num;
            const isConcluida = etapaAtual > num;

            return (
              <div
                key={num}
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                  isAtual
                    ? "bg-white border-sky-500 shadow-md ring-2 ring-sky-500/20"
                    : isConcluida
                    ? "bg-green-50/70 border-green-200 text-zinc-700"
                    : "bg-white/60 border-zinc-200 text-zinc-500 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shrink-0 ${
                        isAtual
                          ? "bg-sky-600 text-white shadow-xs"
                          : isConcluida
                          ? "bg-green-600 text-white"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {isConcluida ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : num}
                    </span>

                    {isAtual && (
                      <span className="rounded-md bg-sky-100 border border-sky-300 px-2 py-0.5 text-[10px] font-black uppercase text-sky-800 tracking-wider">
                        Você está aqui
                      </span>
                    )}
                    {isConcluida && (
                      <span className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider">
                        Concluído
                      </span>
                    )}
                  </div>

                  <p className={`font-bold text-sm leading-snug ${isAtual ? "text-zinc-900" : "text-zinc-700"}`}>
                    {titulo}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    {sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
