"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { beneficiarios } from "@/lib/mock/beneficiarios";
import { turmas } from "@/lib/mock/turmas";
import { nucleos } from "@/lib/mock/nucleos";
import { atividades } from "@/lib/mock/atividades";
import { funcionarios } from "@/lib/mock/funcionarios";
import { CalendarDays, Clock, MapPin, User, Users } from "lucide-react";

const DIAS_EXTENSO: Record<string, string> = {
  Seg: "Segunda", Ter: "Terça", Qua: "Quarta",
  Qui: "Quinta",  Sex: "Sexta", Sáb: "Sábado", Dom: "Domingo",
};

const STATUS_COR: Record<string, string> = {
  "Aprovado":            "bg-green-50 text-green-700 border-green-200",
  "Fila de espera":      "bg-amber-50 text-amber-700 border-amber-200",
  "Novo cadastro":       "bg-sky-50 text-sky-700 border-sky-200",
  "Aguardando seletiva": "bg-purple-50 text-purple-700 border-purple-200",
  "Comparecer a sede":   "bg-orange-50 text-orange-700 border-orange-200",
  "Desistente":          "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function HorariosPage() {
  const { user } = useAuth();
  const beneficiario = beneficiarios.find((b) => b.id === user?.refId);

  if (!beneficiario) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-10 text-center">
        <p className="text-sm text-zinc-400">Beneficiário não encontrado.</p>
      </div>
    );
  }

  const turmasAtivas = beneficiario.turmas
    .filter((vt) => vt.status === "Ativo")
    .map((vt) => turmas.find((t) => t.id === vt.turmaId))
    .filter(Boolean);

  const turmasEvadidas = beneficiario.turmas
    .filter((vt) => vt.status === "Evadido")
    .map((vt) => turmas.find((t) => t.id === vt.turmaId))
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-green-600 to-teal-500 px-6 py-5 text-white">
        <h1 className="text-xl font-bold">Meus Horários</h1>
        <p className="mt-0.5 text-sm text-green-100">Suas atividades e turmas</p>
      </div>

      {/* Identificação */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <div>
          <p className="font-semibold text-zinc-900">
            {beneficiario.nomeSocial ?? beneficiario.nomeCompleto}
          </p>
          <p className="text-sm text-zinc-500">Mat. {beneficiario.matricula}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COR[beneficiario.status] ?? "bg-zinc-100 text-zinc-500"}`}>
          {beneficiario.status}
        </span>
      </div>

      {/* Sem turmas */}
      {turmasAtivas.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-10 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">Nenhuma atividade ativa no momento.</p>
          <p className="mt-1 text-xs text-zinc-400">
            {beneficiario.status === "Fila de espera"
              ? "Você está na fila de espera. Aguarde o contato da equipe."
              : "Entre em contato com o núcleo para mais informações."}
          </p>
        </div>
      )}

      {/* Turmas ativas */}
      {turmasAtivas.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <CalendarDays className="h-4 w-4 text-zinc-400" />
            Minhas atividades ({turmasAtivas.length})
          </h2>

          {turmasAtivas.map((turma) => {
            if (!turma) return null;
            const nucleo = nucleos.find((n) => n.id === turma.nucleoId);
            const atividade = atividades.find((a) => a.id === turma.atividadeId);
            const responsavel = funcionarios.find((f) =>
              turma.responsaveis.some((r) =>
                f.nomeCompleto.toLowerCase().includes(r.split(" ")[0].toLowerCase())
              )
            );
            const vinculo = beneficiario.turmas.find((vt) => vt.turmaId === turma.id);

            return (
              <div key={turma.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="flex">
                  <div className="w-1.5 shrink-0 bg-green-400" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                      <div>
                        <p className="font-semibold text-zinc-900">{turma.nome}</p>
                        {atividade && <p className="text-xs text-zinc-500">{atividade.nome}</p>}
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Ativo
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-400">Horário</p>
                          <p className="font-medium text-zinc-800">{turma.horario}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-400">Dias</p>
                          <p className="font-medium text-zinc-800">
                            {turma.dias.map((d) => DIAS_EXTENSO[d] ?? d).join(", ")}
                          </p>
                        </div>
                      </div>
                      {nucleo && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          <div>
                            <p className="text-xs text-zinc-400">Núcleo</p>
                            <p className="font-medium text-zinc-800">{nucleo.identificacao}</p>
                            {nucleo.endereco && (
                              <p className="text-xs text-zinc-400">
                                {nucleo.endereco}{nucleo.numero ? `, ${nucleo.numero}` : ""} — {nucleo.bairro}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {responsavel && (
                        <div className="flex items-start gap-2 text-sm">
                          <User className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          <div>
                            <p className="text-xs text-zinc-400">Responsável</p>
                            <p className="font-medium text-zinc-800">{responsavel.nomeCompleto}</p>
                            <p className="text-xs text-zinc-400">{responsavel.funcao}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {vinculo && (
                      <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-2.5">
                        <p className="text-xs text-zinc-400">
                          Matriculado em{" "}
                          <span className="font-medium text-zinc-600">
                            {new Date(vinculo.dataRegistro).toLocaleDateString("pt-BR")}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico evadido */}
      {turmasEvadidas.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Histórico
          </p>
          <div className="flex flex-col gap-2">
            {turmasEvadidas.map((turma) => {
              if (!turma) return null;
              const atividade = atividades.find((a) => a.id === turma.atividadeId);
              return (
                <div key={turma.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">{turma.nome}{atividade ? ` — ${atividade.nome}` : ""}</span>
                  <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500">Evadido</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
