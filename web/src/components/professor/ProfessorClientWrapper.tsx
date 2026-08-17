"use client";

import { useState } from "react";
import { DashboardProfessorHub } from "@/components/professor/DashboardProfessorHub";
import type { FuncionarioApi, TurmaApi, NucleoApi, BeneficiarioApi, SlotAulaGrid } from "@/lib/api/services";
import { areaProfessorApi } from "@/lib/api/services";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@/lib/hooks/useQuery";

interface ProfessorClientWrapperProps {
  professores: FuncionarioApi[];
  nucleos: NucleoApi[];
  turmas: TurmaApi[];
  todosBeneficiarios: BeneficiarioApi[];
  initialProfessorId: string;
}

export function ProfessorClientWrapper({
  professores,
  nucleos,
  turmas,
  todosBeneficiarios,
  initialProfessorId,
}: ProfessorClientWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.tipo === "admin";

  const { data: dadosSupabase, loading: dbLoading } = useQuery(
    () => (user?.id ? areaProfessorApi.getDadosProfessor(user.id) : Promise.resolve(null)),
    [user?.id]
  );

  const [selectedProfessorId, setSelectedProfessorId] = useState<string>(initialProfessorId);

  // Identificar o professor do usuário logado
  const profDoUsuario = dadosSupabase?.funcionario || (user
    ? professores.find(
        (p) =>
          p.id === user.entidadeId ||
          (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.refId && p.id === user.refId) ||
          (user.nome && p.nomeCompleto.toLowerCase() === user.nome.toLowerCase())
      )
    : null);

  // Para não-admins: bloquear render até ter o professor identificado.
  // Isso evita flashes de outro professor durante carregamento ou logout.
  const aguardando = authLoading || (!isAdmin && dbLoading && !profDoUsuario);

  if (aguardando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <span className="text-xs text-zinc-400 font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  // Nunca usar professores[0] para não-admins
  const professorAtual: FuncionarioApi | undefined = isAdmin
    ? (professores.find((p) => p.id === selectedProfessorId) ?? professores[0])
    : profDoUsuario ?? undefined;

  if (!professorAtual) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm text-zinc-500">Nenhum professor vinculado ao seu perfil.</span>
      </div>
    );
  }

  const nucleoAtual = nucleos.find((n) => n.id === professorAtual.nucleoId);
  const listaProfessoresDisponiveis = isAdmin ? professores : [professorAtual];

  const turmasDoProfessor = (dadosSupabase?.turmas && !isAdmin)
    ? dadosSupabase.turmas
    : turmas.filter((t) => {
        const nomeProfLower = professorAtual.nomeCompleto.toLowerCase();
        const responsavelDireto = (t.responsaveis ?? []).some((r) => r.toLowerCase().includes(nomeProfLower));
        const responsavelNome = (t.responsaveisNomes ?? []).some((r) => r.toLowerCase().includes(nomeProfLower));
        const mesmoNucleo = professorAtual.nucleoId && t.nucleoId === professorAtual.nucleoId;
        return responsavelDireto || responsavelNome || mesmoNucleo;
      });

  const beneficiariosDoProfessor = (dadosSupabase?.beneficiarios && !isAdmin)
    ? dadosSupabase.beneficiarios
    : (() => {
        const idsTurmas = new Set(turmasDoProfessor.map((t) => t.id));
        return todosBeneficiarios.filter((b) => {
          if ((b.turmasInfo ?? []).some((ti) => ti.turmaId && idsTurmas.has(ti.turmaId))) return true;
          if (professorAtual.nucleoId) {
            if (b.nucleoId === professorAtual.nucleoId) return true;
            if ((b.turmasInfo ?? []).some((ti) => ti.nucleoId === professorAtual.nucleoId)) return true;
          }
          return false;
        });
      })();

  const slotsGrid: SlotAulaGrid[] = dadosSupabase?.slotsGrid ?? [];

  return (
    <DashboardProfessorHub
      professor={professorAtual}
      professoresDisponiveis={listaProfessoresDisponiveis}
      onSelecionarProfessor={(id) => setSelectedProfessorId(id)}
      nucleo={nucleoAtual}
      turmas={turmasDoProfessor}
      slotsGrid={slotsGrid}
      todosBeneficiarios={beneficiariosDoProfessor}
      pontoHoje={dadosSupabase?.pontoHoje}
      loading={dbLoading}
    />
  );
}
