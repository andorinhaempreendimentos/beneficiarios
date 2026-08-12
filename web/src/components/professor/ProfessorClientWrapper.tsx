"use client";

import { useState } from "react";
import { DashboardProfessorHub } from "@/components/professor/DashboardProfessorHub";
import type { FuncionarioApi, TurmaApi, NucleoApi, BeneficiarioApi } from "@/lib/api/services";
import { useAuth } from "@/components/providers/AuthProvider";

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

  // Identifica o professor correspondente ao usuário logado
  const profDoUsuario = user
    ? professores.find(
        (p) =>
          p.id === user.entidadeId ||
          (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.refId && p.id === user.refId) ||
          (user.nome && p.nomeCompleto.toLowerCase() === user.nome.toLowerCase())
      )
    : null;

  // Se não for admin e encontrou o professor logado, fixa a ID dele. Se for admin, permite selecionar.
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>(initialProfessorId);

  const targetId = !isAdmin && profDoUsuario ? profDoUsuario.id : selectedProfessorId;
  const professorAtual = professores.find((p) => p.id === targetId) || profDoUsuario || professores[0];
  const nucleoAtual = nucleos.find((n) => n.id === professorAtual?.nucleoId);

  // Administradores veem a lista completa para alternar; professores veem apenas seu próprio perfil
  const listaProfessoresDisponiveis = isAdmin ? professores : professorAtual ? [professorAtual] : [];

  // Turmas atribuídas ESTRITAMENTE a este professor ou seu núcleo
  const turmasDoProfessor = turmas.filter((t) => {
    if (!professorAtual) return false;
    const nomeProfLower = professorAtual.nomeCompleto.toLowerCase();
    const responsavelDireto = (t.responsaveis ?? []).some((resp) => resp.toLowerCase().includes(nomeProfLower));
    const responsavelNome = (t.responsaveisNomes ?? []).some((resp) => resp.toLowerCase().includes(nomeProfLower));
    const mesmoNucleo = professorAtual.nucleoId && t.nucleoId === professorAtual.nucleoId;
    return responsavelDireto || responsavelNome || mesmoNucleo;
  });

  // Beneficiários vinculados ao núcleo do professor
  const beneficiariosDoProfessor = todosBeneficiarios.filter((b) => {
    if (!professorAtual) return false;
    return professorAtual.nucleoId ? b.nucleoId === professorAtual.nucleoId : true;
  });

  return (
    <DashboardProfessorHub
      professor={professorAtual}
      professoresDisponiveis={listaProfessoresDisponiveis}
      onSelecionarProfessor={(id) => setSelectedProfessorId(id)}
      nucleo={nucleoAtual}
      turmas={turmasDoProfessor}
      todosBeneficiarios={beneficiariosDoProfessor}
    />
  );
}
