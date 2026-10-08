import { CalendarDays, ChevronRight, Clock, MapPin, Users, Award } from "lucide-react";
import { redirect } from "next/navigation";
import { turmasApi, nucleosApi, atividadesApi } from "@/lib/api/services";
import { InscricaoPublicaForm } from "@/components/inscricao-publica/InscricaoPublicaForm";
import { TurmaCheiaSection } from "@/components/inscricao-publica/TurmaCheiaSection";
import { InstrucoesInscricaoBanner } from "@/components/inscricao-publica/InstrucoesInscricaoBanner";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface InscricaoTurmaPageProps {
  params: Promise<{ turmaId: string }>;
}

const DIAS_EXTENSO_MAP: Record<string, string> = {
  Seg: "Segunda-feira",
  Ter: "Terça-feira",
  Qua: "Quarta-feira",
  Qui: "Quinta-feira",
  Sex: "Sexta-feira",
  Sab: "Sábado",
  Dom: "Domingo",
  "1": "Segunda-feira",
  "2": "Terça-feira",
  "3": "Quarta-feira",
  "4": "Quinta-feira",
  "5": "Sexta-feira",
  "6": "Sábado",
  "0": "Domingo",
};

export default async function InscricaoTurmaPage({ params }: InscricaoTurmaPageProps) {
  const { turmaId } = await params;
  const turma = await turmasApi.get(turmaId).catch(() => null);

  if (!turma) redirect("/");

  const [nucleo, atividade] = await Promise.all([
    turma.nucleoId ? nucleosApi.get(turma.nucleoId).catch(() => null) : null,
    turma.atividadeId ? atividadesApi.get(turma.atividadeId).catch(() => null) : null,
  ]);

  // Se a atividade for de controle interno (disponivelPreInscricao === false), não permite inscrição pública
  if (atividade && atividade.disponivelPreInscricao === false) {
    redirect("/inscricao");
  }

  const termoGrupo = atividade?.termoGrupo || "Grupo";
  const termoSessao = atividade?.termoSessao || "Sessão";
  const termoParticipante = atividade?.termoParticipante || "Participante";

  const minIdade = turma.idadeMinima ?? turma.faixaEtaria?.idadeMinima ?? turma.categoria?.idadeMinima ?? atividade?.idadeMinima;
  const maxIdade = turma.idadeMaxima ?? turma.faixaEtaria?.idadeMaxima ?? turma.categoria?.idadeMaxima ?? atividade?.idadeMaxima;
  const faixaEtariaNome = turma.faixaEtaria?.nome || turma.categoria?.nome;

  const vagasLivres = turma.vagasLivres != null ? turma.vagasLivres : (turma.vagasTotais ? turma.vagasTotais : 10);
  const turmaCheia = vagasLivres <= 0;

  const breadcrumb = [
    nucleo?.identificacao ?? "Núcleo",
    atividade?.nome ?? "Atividade",
    turma.nome,
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Hierarquia da inscrição">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-400">
          {breadcrumb.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
              <span className={i === breadcrumb.length - 1 ? "font-semibold text-zinc-700" : ""}>
                {item}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Banner de Instruções e Endereço Completo do Núcleo — Etapa 1 (Preencha os Dados) */}
      <InstrucoesInscricaoBanner nucleo={nucleo} atividade={atividade} tipoLink="turma" etapaAtual={1} />

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
            {termoGrupo}
          </span>

          {(minIdade != null || maxIdade != null || faixaEtariaNome) && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-200">
              <Award className="h-3 w-3 text-amber-700" />
              {faixaEtariaNome
                ? faixaEtariaNome
                : minIdade != null && maxIdade != null
                ? `${minIdade} a ${maxIdade} anos`
                : minIdade != null
                ? `A partir de ${minIdade} anos`
                : `Até ${maxIdade} anos`}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-zinc-900">{turma.nome}</h1>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {atividade && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-600">
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Atividade
              </span>
              <span className="font-medium">{atividade.nome}</span>
            </div>
          )}
          {nucleo && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-600">
              <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                Núcleo
              </span>
              <span className="font-medium">{nucleo.identificacao}</span>
            </div>
          )}
        </div>

        {nucleo && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{nucleo.identificacao}</span>
            {(nucleo.cidade || nucleo.regiao) && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {[nucleo.cidade, nucleo.regiao].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        )}

        {/* Grade Semanal de Sessões do Grupo */}
        <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2.5">
            <CalendarDays className="h-4 w-4 text-sky-600" />
            Grade Semanal de {termoSessao}s do {termoGrupo}:
          </h3>
          {Array.isArray(turma.slots) && turma.slots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {turma.slots.map((s: any, idx: number) => {
                const diaExtenso = DIAS_EXTENSO_MAP[s.dia] || DIAS_EXTENSO_MAP[String(s.diaSemana ?? s.dia_semana)] || s.dia || "Dia";
                const horaIni = s.inicio?.includes(":") ? s.inicio.slice(0, 5) : `${String(s.inicio || "08").padStart(2, "0")}:00`;
                const horaFim = s.fim?.includes(":") ? s.fim.slice(0, 5) : `${String(s.fim || "10").padStart(2, "0")}:00`;
                const instrutor = s.responsavel?.nomeCompleto || s.responsavelNome;
                const atvNome = s.atividade?.nome;

                return (
                  <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-zinc-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span className="font-semibold text-zinc-800">{diaExtenso}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">{horaIni} às {horaFim}</span>
                    </div>
                    {(atvNome || instrutor) && (
                      <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[120px]">
                        {[atvNome, instrutor].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              {(turma as any).horario || "Horário a definir com a coordenação do núcleo."}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Users className="h-4 w-4 text-zinc-400" />
            <span>
              <span className="font-medium text-green-700">{vagasLivres}</span>
              {" "}vaga{vagasLivres !== 1 ? "s" : ""} para {termoParticipante.toLowerCase()}s
            </span>
          </div>
        </div>
      </div>

      {nucleo?.emFuncionamento === false ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 flex flex-col gap-2 shadow-xs">
          <h2 className="text-base font-bold text-amber-900">Inscrições Temporariamente Suspensas</h2>
          <p className="text-sm text-amber-800">
            As inscrições para este {termoGrupo.toLowerCase()} encontram-se temporariamente suspensas pois a unidade/núcleo está com funcionamento pausado.
          </p>
        </div>
      ) : turmaCheia ? (
        <TurmaCheiaSection vagasTotal={turma.vagasTotais} turmaId={turma.id} />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Formulário de Inscrição</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Preencha os dados abaixo para inscrever o {termoParticipante.toLowerCase()}. Campos marcados com{" "}
              <span className="text-red-500">*</span> são obrigatórios.
            </p>
          </div>
          <InscricaoPublicaForm turmaId={turmaId} />
        </>
      )}
    </div>
  );
}
