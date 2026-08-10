import { MapPin, Info, CheckCircle2, Navigation } from "lucide-react";
import type { NucleoApi, AtividadeApi } from "@/lib/api/services";

interface InstrucoesInscricaoBannerProps {
  nucleo?: NucleoApi | null;
  atividade?: AtividadeApi | null;
}

export function InstrucoesInscricaoBanner({ nucleo, atividade }: InstrucoesInscricaoBannerProps) {
  const enderecoFormatado = nucleo
    ? [nucleo.endereco, nucleo.bairro, nucleo.cidade, nucleo.regiao].filter(Boolean).join(", ")
    : null;

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

      {/* Guia de Instruções de Como se Inscrever */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-amber-700 shrink-0" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
            Como realizar a sua inscrição
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          <div className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-amber-100 shadow-2xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white shrink-0">1</span>
            <div>
              <p className="font-bold text-zinc-900">Escolha a Turma</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Filtre por Manhã ou Tarde e selecione o horário ideal.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-amber-100 shadow-2xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white shrink-0">2</span>
            <div>
              <p className="font-bold text-zinc-900">Preencha os Dados</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Informe os dados do aluno (06 a 17 anos) e do responsável.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-amber-100 shadow-2xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white shrink-0">3</span>
            <div>
              <p className="font-bold text-zinc-900">Garanta a Vaga</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Confirme o formulário e receba o comprovante imediato.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
