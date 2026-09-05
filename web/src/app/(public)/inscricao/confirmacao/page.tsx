import { CheckCircle, Clock, AlertTriangle, MapPin, User, Calendar, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { inscricoesApi } from "@/lib/api/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ConfirmacaoPageProps {
  searchParams: Promise<{ id?: string; tipo?: string; turmaId?: string }>;
}

export default async function ConfirmacaoPage({ searchParams }: ConfirmacaoPageProps) {
  const params = await searchParams;
  const inscricaoId = params.id;

  // Se não foi fornecido um ID ou se for inválido, buscar no banco
  let inscricao = null;
  if (inscricaoId) {
    inscricao = await inscricoesApi.consultarPublico(inscricaoId).catch(() => null);
  }

  // 1. Estado de Erro / ID Não Encontrado
  if (!inscricao) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center max-w-lg mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-zinc-900">Inscrição Não Encontrada</h1>
          <p className="text-zinc-500 text-sm">
            Não foi possível validar o protocolo ou comprovante desta inscrição. O link pode ser inválido ou a inscrição ainda não foi processada.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-xs flex flex-col gap-3">
          <p>
            Deseja consultar turmas disponíveis ou realizar uma nova inscrição?
          </p>
          <Link
            href="/inscricao"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"
          >
            Ir para Inscrição Pública <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Estado Válido e Comprovante Real
  const isAprovada = inscricao.status === "aprovada";
  const isFila = inscricao.status === "reservada";
  const isPendente = inscricao.status === "pendente";

  return (
    <div className="flex flex-col items-center gap-8 py-8 max-w-xl mx-auto">
      {/* Ícone e Título Principal */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs ${
            isAprovada
              ? "bg-emerald-100 text-emerald-600"
              : isFila
              ? "bg-amber-100 text-amber-600"
              : "bg-sky-100 text-sky-600"
          }`}
        >
          {isAprovada && <CheckCircle className="h-8 w-8" />}
          {isFila && <Clock className="h-8 w-8" />}
          {isPendente && <CheckCircle className="h-8 w-8" />}
        </div>

        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex items-center gap-1 self-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isAprovada
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isFila
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-sky-50 text-sky-700 border border-sky-200"
            }`}
          >
            {isAprovada && "● Vaga Confirmada"}
            {isFila && "● Fila de Espera"}
            {isPendente && "● Inscrição Recebida"}
          </span>

          <h1 className="text-2xl font-bold text-zinc-900 mt-1">
            {isAprovada && "Inscrição Aprovada com Sucesso!"}
            {isFila && "Você está na Fila de Espera"}
            {isPendente && "Pré-Inscrição Recebida!"}
          </h1>

          <p className="text-zinc-500 text-sm max-w-md">
            {isAprovada && "Sua matrícula foi gerada automaticamente. Compareça ao núcleo nas datas e horários da turma."}
            {isFila && "As vagas diretas estão preenchidas. Você será contatado caso ocorra desistência ou abertura de vagas."}
            {isPendente && "Sua inscrição está sob análise da coordenação do projeto e será avaliada em breve."}
          </p>
        </div>
      </div>

      {/* Cartão do Comprovante Oficial */}
      <div className="w-full rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Número de Matrícula / Protocolo
            </span>
            <p className="font-mono text-xl font-bold tracking-tight text-zinc-900">
              {inscricao.protocolo || "—"}
            </p>
          </div>
          <span className="text-xs text-zinc-400">
            {new Date(inscricao.data_inscricao).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Detalhes do Aluno e Turma */}
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <User className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <span className="block text-[11px] font-medium text-zinc-400 uppercase">Beneficiário</span>
              <span className="font-semibold text-zinc-800">{inscricao.beneficiario_nome}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Award className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <span className="block text-[11px] font-medium text-zinc-400 uppercase">Atividade</span>
              <span className="font-semibold text-zinc-800">{inscricao.atividade_nome || "Projeto Geral"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:col-span-2">
            <Calendar className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <span className="block text-[11px] font-medium text-zinc-400 uppercase">Turma</span>
              <span className="font-semibold text-zinc-800">{inscricao.turma_nome}</span>
            </div>
          </div>

          {inscricao.nucleo_nome && (
            <div className="flex items-start gap-2.5 sm:col-span-2 rounded-xl bg-zinc-50/80 p-3 border border-zinc-100">
              <MapPin className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] font-medium text-zinc-400 uppercase">Local / Núcleo</span>
                <span className="font-semibold text-zinc-800">{inscricao.nucleo_nome}</span>
                {inscricao.nucleo_endereco && (
                  <p className="text-xs text-zinc-500 mt-0.5">{inscricao.nucleo_endereco}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-xs text-zinc-600 leading-relaxed">
          <strong>Importante:</strong> Guarde o número da sua matrícula ({inscricao.protocolo}). Apresente este comprovante e documento oficial com foto no primeiro dia de atividades.
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <Link
          href="/inscricao"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 transition"
        >
          Realizar Outra Inscrição
        </Link>
        <Link
          href="/"
          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
        >
          Ir para Página Inicial
        </Link>
      </div>
    </div>
  );
}

