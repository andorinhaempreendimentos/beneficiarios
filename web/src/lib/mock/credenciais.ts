import type { AuthUser } from "@/lib/auth";
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
  } satisfies AuthUser,
}));

const todasCredenciais = [...credsUsuarios, ...credsFuncionarios];

export function autenticar(email: string, senha: string): AuthUser | null {
  const cred = todasCredenciais.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.senha === senha,
  );
  return cred?.user ?? null;
}

// Login de beneficiário: matrícula + data de nascimento (YYYY-MM-DD) + celular (só dígitos)
export function autenticarBeneficiario(
  matricula: string,
  dataNascimento: string,
  celular: string,
): AuthUser | null {
  const mat = matricula.trim();
  const cel = celular.replace(/\D/g, "");
  const b = beneficiarios.find(
    (b) =>
      b.matricula === mat &&
      b.dataNascimento === dataNascimento &&
      b.celular.replace(/\D/g, "") === cel,
  );
  if (!b) return null;
  return {
    id: b.id,
    nome: b.nomeSocial ?? b.nomeCompleto,
    email: "",
    tipo: "beneficiario",
    refId: b.id,
  };
}

export const demoCredenciais = [
  { label: "Admin",       email: usuarios[0]?.email ?? "",         senha: SENHA_PADRAO },
  { label: "Coordenador", email: usuarios[1]?.email ?? "",         senha: SENHA_PADRAO },
  { label: "Instrutor",   email: credsFuncionarios[0]?.email ?? "", senha: SENHA_PADRAO },
];

// Demo para beneficiário (b1 — Ana Beatriz, tem turma ativa)
const b1 = beneficiarios.find((b) => b.id === "b1");
export const demoBeneficiario = b1
  ? { matricula: b1.matricula, dataNascimento: b1.dataNascimento, celular: b1.celular }
  : null;

