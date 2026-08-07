"use client";

import { useState } from "react";
import { DashboardProfessorHub } from "@/components/professor/DashboardProfessorHub";
import type { FuncionarioApi, TurmaApi, NucleoApi, BeneficiarioApi } from "@/lib/api/services";

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
  const [professorId, setProfessorId] = useState(initialProfessorId);

  const professorAtual = professores.find((p) => p.id === professorId) || professores[0];
  const nucleoAtual = nucleos.find((n) => n.id === professorAtual?.nucleoId);

  // Filtra as turmas atribuídas a este professor (se houver responsabilidade específica ou listagem geral)
  const turmasDoProfessor = turmas.filter((t) => {
    if (!t.responsaveis || t.responsaveis.length === 0) return true;
    return t.responsaveis.some((resp) =>
      resp.toLowerCase().includes(professorAtual.nomeCompleto.toLowerCase())
    );
  });

  return (
    <DashboardProfessorHub
      professor={professorAtual}
      professoresDisponiveis={professores}
      onSelecionarProfessor={(id) => setProfessorId(id)}
      nucleo={nucleoAtual}
      turmas={turmasDoProfessor.length > 0 ? turmasDoProfessor : turmas}
      todosBeneficiarios={todosBeneficiarios}
    />
  );
}
