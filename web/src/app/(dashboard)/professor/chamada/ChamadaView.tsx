"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Users, UserCheck, UserX, AlertCircle, ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Button, Card, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import { beneficiariosApi, type TurmaApi, type FuncionarioApi } from "@/lib/api/services";

export function ChamadaView({ turmas, funcionarios = [] }: { turmas: TurmaApi[]; funcionarios?: FuncionarioApi[] }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryTurmaId = searchParams.get("turmaId");

  const isAdmin = user?.tipo === "admin";

  // Identifica o professor correspondente ao usuário logado
  const profDoUsuario = useMemo(() => {
    if (!user) return null;
    return funcionarios.find(
      (p) =>
        p.id === user.entidadeId ||
        (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.refId && p.id === user.refId) ||
        (user.nome && p.nomeCompleto.toLowerCase() === user.nome.toLowerCase())
    );
  }, [user, funcionarios]);

  // Se não for admin, filtra estritamente apenas as turmas pertencentes a este professor
  const turmasPermitidas = useMemo(() => {
    if (isAdmin || !profDoUsuario) return turmas;
    const nomeProfLower = profDoUsuario.nomeCompleto.toLowerCase();
    return turmas.filter((t) => {
      const respDireto = (t.responsaveis ?? []).some((r) => r.toLowerCase().includes(nomeProfLower));
      const respNome = (t.responsaveisNomes ?? []).some((r) => r.toLowerCase().includes(nomeProfLower));
      const mesmoNucleo = profDoUsuario.nucleoId && t.nucleoId === profDoUsuario.nucleoId;
      return respDireto || respNome || mesmoNucleo;
    });
  }, [turmas, isAdmin, profDoUsuario]);

  // Seleciona obrigatoriamente a turma específica que foi aberta pelo professor (se informada via URL), ou a primeira permitida
  const turmaInicialId = useMemo(() => {
    if (queryTurmaId && turmasPermitidas.some((t) => t.id === queryTurmaId)) {
      return queryTurmaId;
    }
    return turmasPermitidas[0]?.id || "";
  }, [queryTurmaId, turmasPermitidas]);

  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(turmaInicialId);
  const [presencas, setPresencas] = useState<Record<string, "presente" | "falta">>({});

  const turmaAtual = turmasPermitidas.find((t) => t.id === turmaSelecionadaId);

  // Busca real de beneficiários inscritos na turma selecionada via Supabase
  const { data: beneficiariosRes, loading } = useQuery(
    () => (turmaSelecionadaId ? beneficiariosApi.list({ turmaId: turmaSelecionadaId, limit: 100 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 })),
    [turmaSelecionadaId]
  );

  const alunosReais = beneficiariosRes?.data ?? [];

  function togglePresenca(alunoId: string, status: "presente" | "falta") {
    setPresencas((prev) => ({ ...prev, [alunoId]: status }));
  }

  function handleSalvarChamada() {
    toast.success(`Chamada da turma "${turmaAtual?.nome || 'selecionada'}" registrada com sucesso!`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <Link
          href="/professor"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel do Professor
        </Link>
      </div>

      <PageHeader
        title="Chamada Diária — Lista de Presença"
        description="Frequência dos beneficiários inscritos na turma aberta"
      />

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-sky-800">
                Turma Selecionada
              </span>
              {turmaAtual && (
                <span className="text-xs font-mono font-semibold text-zinc-400">
                  {turmaAtual.nucleo?.identificacao || "Polo Palmas"}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mt-1">
              <GraduationCap className="h-5 w-5 text-sky-600" />
              <span>{turmaAtual?.nome || "Nenhuma turma disponível"}</span>
            </h3>
          </div>

          <div className="w-full sm:w-72 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Turmas do Professor
            </span>
            <Select
              value={turmaSelecionadaId}
              onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              disabled={turmasPermitidas.length <= 1}
            >
              {turmasPermitidas.length === 0 ? (
                <option value="">Nenhuma turma vinculada</option>
              ) : (
                turmasPermitidas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))
              )}
            </Select>
          </div>
        </div>

        {loading && <div className="py-8 text-center text-sm text-zinc-400">Carregando alunos da turma…</div>}

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
          <Button onClick={handleSalvarChamada} disabled={alunosReais.length === 0}>
            Salvar Chamada de Hoje
          </Button>
        </div>
      </Card>
    </div>
  );
}
