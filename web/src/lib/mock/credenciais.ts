import type { AuthUser } from "@/components/providers/AuthProvider";
import { usuarios } from "@/lib/mock/usuarios";
import { funcionarios } from "@/lib/mock/funcionarios";
import { beneficiarios } from "@/lib/mock/beneficiarios";

const SENHA_PADRAO = "andorinha123";

const credsUsuarios = usuarios.map((u) => ({
  email: u.email,
  senha: SENHA_PADRAO,
  user: {
    id: u.id,
    nome: u.nome,
    email: u.email,
    tipo: "admin" as const,
    refId: u.id,
    perfilId: u.perfilId,
    entidadeId: null,
  } satisfies AuthUser,
}));

const credsFuncionarios = funcionarios.map((f) => ({
  email: `${f.matricula.toLowerCase().replace("-", "")}@andorinha.app`,
  senha: SENHA_PADRAO,
  user: {
    id: f.id,
    nome: f.nomeCompleto,
    email: `${f.matricula.toLowerCase().replace("-", "")}@andorinha.app`,
    tipo: "funcionario" as const,
    refId: f.id,
    perfilId: "",
    entidadeId: f.id,
  } satisfies AuthUser,
}));

export const demoCredenciais = [
  { label: "Admin",       email: usuarios[0]?.email ?? "",          senha: SENHA_PADRAO },
  { label: "Coordenador", email: usuarios[1]?.email ?? "",          senha: SENHA_PADRAO },
  { label: "Instrutor",   email: credsFuncionarios[0]?.email ?? "", senha: SENHA_PADRAO },
];

// Demo para beneficiário (b1 — Ana Beatriz, tem turma ativa)
const b1 = beneficiarios.find((b) => b.id === "b1");
export const demoBeneficiario = b1
  ? { matricula: b1.matricula, dataNascimento: b1.dataNascimento, celular: b1.celular }
  : null;
