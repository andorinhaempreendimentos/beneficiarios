"use client";

import { useState } from "react";
import { Users, UserCheck, UserX } from "lucide-react";
import { Button, Card, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import type { TurmaApi } from "@/lib/api/services";

export function ChamadaView({ turmas }: { turmas: TurmaApi[] }) {
  const { toast } = useToast();
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(turmas[0]?.id || "");
  const [presencas, setPresencas] = useState<Record<string, "presente" | "falta">>({});

  const alunosExemplo = [
    { id: "1", nome: "Gabriel Santos QA", matricula: "BEN-001" },
    { id: "2", nome: "Ana Clara Silva QA", matricula: "BEN-002" },
    { id: "3", nome: "Lucas Rodrigues QA", matricula: "BEN-003" },
    { id: "4", nome: "Mateus Henrique QA", matricula: "BEN-004" },
    { id: "5", nome: "Sophia Oliveira QA", matricula: "BEN-005" },
  ];

  function togglePresenca(alunoId: string, status: "presente" | "falta") {
    setPresencas((prev) => ({ ...prev, [alunoId]: status }));
  }

  function handleSalvarChamada() {
    toast.success("Chamada diária registrada com sucesso!");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      <PageHeader
        title="Dar Presença para Beneficiários"
        description="Frequência diária dos alunos matriculados na turma"
      />

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 mb-6 gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              <span>Lista de Alunos da Turma</span>
            </h3>
          </div>

          <div className="w-full sm:w-64">
            <Select
              value={turmaSelecionadaId}
              onChange={(e) => setTurmaSelecionadaId(e.target.value)}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="divide-y divide-zinc-100">
          {alunosExemplo.map((aluno) => {
            const status = presencas[aluno.id] || "presente";
            return (
              <div key={aluno.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-zinc-900 text-sm">{aluno.nome}</h4>
                  <span className="text-xs text-zinc-400 font-mono">{aluno.matricula}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePresenca(aluno.id, "presente")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      status === "presente"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Presente
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePresenca(aluno.id, "falta")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      status === "falta"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Falta
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-zinc-100">
          <Button onClick={handleSalvarChamada}>
            Salvar Chamada de Hoje
          </Button>
        </div>
      </Card>
    </div>
  );
}
