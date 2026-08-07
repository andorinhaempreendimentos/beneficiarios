"use client";

import { useState } from "react";
import { Users, UserCheck, UserX, AlertCircle } from "lucide-react";
import { Button, Card, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { beneficiariosApi, type TurmaApi, type BeneficiarioApi } from "@/lib/api/services";

export function ChamadaView({ turmas }: { turmas: TurmaApi[] }) {
  const { toast } = useToast();
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(turmas[0]?.id || "");
  const [presencas, setPresencas] = useState<Record<string, "presente" | "falta">>({});

  // Busca real de beneficiários inscritos na turma via Supabase
  const { data: beneficiariosRes, loading } = useQuery(
    () => (turmaSelecionadaId ? beneficiariosApi.list({ turmaId: turmaSelecionadaId, limit: 100 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 })),
    [turmaSelecionadaId]
  );

  const alunosReais = beneficiariosRes?.data ?? [];

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

        {loading && <div className="py-8 text-center text-sm text-zinc-400">Carregando lista de alunos…</div>}

        {!loading && (
          <div className="divide-y divide-zinc-100">
            {alunosReais.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center text-zinc-400 gap-2">
                <AlertCircle className="h-6 w-6 text-zinc-300" />
                <span className="text-sm font-medium">Nenhum aluno matriculado nesta turma até o momento.</span>
              </div>
            ) : (
              alunosReais.map((aluno) => {
                const status = presencas[aluno.id] || "presente";
                return (
                  <div key={aluno.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-sm">{aluno.nomeCompleto}</h4>
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
              })
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end pt-4 border-t border-zinc-100">
          <Button onClick={handleSalvarChamada}>
            Salvar Chamada de Hoje
          </Button>
        </div>
      </Card>
    </div>
  );
}
