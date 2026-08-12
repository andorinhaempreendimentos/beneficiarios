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
  const { user } = useAuth();
  const isAdmin = user?.tipo === "admin";

  // Busca relacional rica no Supabase para o usuário logado
  const { data: dadosSupabase, loading } = useQuery(
    () => (user?.id ? areaProfessorApi.getDadosProfessor(user.id) : Promise.resolve(null)),
    [user?.id]
  );

  const profDoUsuario = dadosSupabase?.funcionario || (user
    ? professores.find(
        (p) =>
          p.id === user.entidadeId ||
          (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.refId && p.id === user.refId) ||
          (user.nome && p.nomeCompleto.toLowerCase() === user.nome.toLowerCase())
      )
    : null);

  const [selectedProfessorId, setSelectedProfessorId] = useState<string>(initialProfessorId);

  const targetId = !isAdmin && profDoUsuario ? profDoUsuario.id : selectedProfessorId;
  const professorAtual = professores.find((p) => p.id === targetId) || profDoUsuario || professores[0];
  const nucleoAtual = nucleos.find((n) => n.id === professorAtual?.nucleoId);

  const listaProfessoresDisponiveis = isAdmin ? professores : professorAtual ? [professorAtual] : [];

  const turmasDoProfessor = dadosSupabase?.turmas && !isAdmin
    ? dadosSupabase.turmas
    : turmas.filter((t) => {
        if (!professorAtual) return false;
        const nomeProfLower = professorAtual.nomeCompleto.toLowerCase();
        const responsavelDireto = (t.responsaveis ?? []).some((resp) => resp.toLowerCase().includes(nomeProfLower));
        const responsavelNome = (t.responsaveisNomes ?? []).some((resp) => resp.toLowerCase().includes(nomeProfLower));
        const mesmoNucleo = professorAtual.nucleoId && t.nucleoId === professorAtual.nucleoId;
        return responsavelDireto || responsavelNome || mesmoNucleo;
      });

  const beneficiariosDoProfessor = dadosSupabase?.beneficiarios && !isAdmin
    ? dadosSupabase.beneficiarios
    : (() => {
        const idsTurmasDoProf = new Set(turmasDoProfessor.map((t) => t.id));
        return todosBeneficiarios.filter((b) => {
          if (!professorAtual) return false;
          const temTurmaDoProf = (b.turmasInfo ?? []).some((ti) => ti.turmaId && idsTurmasDoProf.has(ti.turmaId));
          if (temTurmaDoProf) return true;
          if (professorAtual.nucleoId) {
            if (b.nucleoId === professorAtual.nucleoId) return true;
            const temNucleoDoProf = (b.turmasInfo ?? []).some((ti) => ti.nucleoId === professorAtual.nucleoId);
            if (temNucleoDoProf) return true;
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
      loading={loading}
    />
  );
}
