"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { funcionarios } from "@/lib/mock/funcionarios";
import { turmas } from "@/lib/mock/turmas";
import { nucleos } from "@/lib/mock/nucleos";
import { atividades } from "@/lib/mock/atividades";
import { getConfirmacoesByFuncionario } from "@/lib/mock/presencas";
import type { Funcionario, Turma } from "@/lib/types";
import { CalendarDays, CheckCircle2, Clock, MapPin, Users, XCircle } from "lucide-react";

const DIAS_ORDEM = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const DIA_JORNADA_KEY: Record<string, string> = {
  Seg: "Segunda", Ter: "Terça", Qua: "Quarta",
  Qui: "Quinta",  Sex: "Sexta", Sáb: "Sábado", Dom: "Domingo",
};

const DIA_SEMANA_NUM: Record<string, number> = {
  Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6,
};

function proximasAulas(turma: Turma, quantidade = 5): string[] {
  const cursor = new Date();
  const resultado: string[] = [];
  let tentativas = 0;
  while (resultado.length < quantidade && tentativas < 60) {
    const abrev = Object.entries(DIA_SEMANA_NUM).find(([, n]) => n === cursor.getDay())?.[0];
    if (abrev && turma.dias.includes(abrev)) {
      resultado.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
    tentativas++;
  }
  return resultado;
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia))
    .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

function turmasDofuncionario(f: Funcionario): Turma[] {
  return turmas.filter((t) =>
    t.responsaveis.some((r) =>
      f.nomeCompleto.toLowerCase().includes(r.split(" ")[0].toLowerCase())
    )
  );
}

const isInstrutor = (f: Funcionario) =>
  f.funcao === "Instrutor" || f.funcao === "Monitor";

const STATUS_FUNC: Record<string, string> = {
  contratado:          "text-green-700 bg-green-50",
  voluntario:          "text-sky-700 bg-sky-50",
  pendente:            "text-amber-700 bg-amber-50",
  licenca_medica:      "text-red-600 bg-red-50",
  licenca_maternidade: "text-pink-700 bg-pink-50",
  afastado_inss:       "text-orange-700 bg-orange-50",
  demitido:            "text-zinc-500 bg-zinc-100",
};

const STATUS_LABEL: Record<string, string> = {
  contratado: "Contratado", voluntario: "Voluntário", pendente: "Pendente",
  licenca_medica: "Licença médica", licenca_maternidade: "Lic. maternidade",
  afastado_inss: "Afastado INSS", demitido: "Desligado",
};

export default function AgendaPage() {
  const { user } = useAuth();
  const funcionario = funcionarios.find((f) => f.id === user?.refId);

  if (!funcionario) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-10 text-center">
        <p className="text-sm text-zinc-400">Funcionário não encontrado.</p>
      </div>
    );
  }

  const minhasTurmas = turmasDofuncionario(funcionario);
  const confirmacoes = getConfirmacoesByFuncionario(funcionario.id);
  const confirmacoesMap = Object.fromEntries(confirmacoes.map((c) => [c.data, c]));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-sky-400 px-6 py-5 text-white">
        <h1 className="text-xl font-bold">Minha Agenda</h1>
        <p className="mt-0.5 text-sm text-sky-100">Seus horários e compromissos</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex-1">
          <p className="font-semibold text-zinc-900">{funcionario.nomeCompleto}</p>
          <p className="text-sm text-zinc-500">{funcionario.funcao} · Mat. {funcionario.matricula}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_FUNC[funcionario.status] ?? "bg-zinc-100 text-zinc-500"}`}>
          {STATUS_LABEL[funcionario.status] ?? funcionario.status}
        </span>
      </div>

      {/* Jornada semanal */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <Clock className="h-4 w-4 text-zinc-400" />
          Jornada semanal
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DIAS_ORDEM.map((abrev) => {
            const nomeDia = DIA_JORNADA_KEY[abrev];
            const diaJornada = funcionario.jornada.find((j) => j.dia === nomeDia);
            const trabalha = diaJornada?.trabalha ?? false;
            return (
              <div
                key={abrev}
                className={`flex flex-col items-center rounded-xl px-2 py-3 text-center ${
                  trabalha ? "border border-sky-200 bg-sky-50" : "border border-zinc-100 bg-zinc-50"
                }`}
              >
                <p className={`text-xs font-bold ${trabalha ? "text-sky-600" : "text-zinc-400"}`}>{abrev}</p>
                {trabalha ? (
                  <>
                    <p className="mt-1 text-xs text-sky-700">{diaJornada?.entrada}</p>
                    <p className="text-xs text-sky-500">{diaJornada?.saida}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-zinc-300">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Turmas */}
      {minhasTurmas.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center">
          <Users className="mx-auto mb-2 h-7 w-7 text-zinc-300" />
          <p className="text-sm text-zinc-400">Nenhuma turma vinculada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <Users className="h-4 w-4 text-zinc-400" />
            Minhas turmas ({minhasTurmas.length})
          </h2>
          {minhasTurmas.map((turma) => {
            const nucleo = nucleos.find((n) => n.id === turma.nucleoId);
            const atividade = atividades.find((a) => a.id === turma.atividadeId);
            const proximas = isInstrutor(funcionario) ? proximasAulas(turma, 5) : [];

            return (
              <div key={turma.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="flex items-start justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                  <div>
                    <p className="font-semibold text-zinc-900">{turma.nome}</p>
                    {atividade && <p className="text-xs text-zinc-500">{atividade.nome}</p>}
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                    {turma.qtdBeneficiarios}/{turma.vagasTotais} alunos
                  </span>
                </div>

                <div className="flex flex-col gap-4 px-5 py-4">
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />{turma.horario}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />{turma.dias.join(", ")}
                    </div>
                    {nucleo && (
                      <div className="flex items-center gap-2 text-zinc-600">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />{nucleo.identificacao}
                      </div>
                    )}
                  </div>

                  {isInstrutor(funcionario) && proximas.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Próximas aulas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {proximas.map((data) => {
                          const confirmada = !!confirmacoesMap[data];
                          return (
                            <div
                              key={data}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                                confirmada
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-zinc-200 bg-white text-zinc-600"
                              }`}
                            >
                              {confirmada
                                ? <CheckCircle2 className="h-3.5 w-3.5" />
                                : <XCircle className="h-3.5 w-3.5 text-zinc-300" />
                              }
                              {formatarData(data)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
