import { createClient } from "@/lib/supabase/client";

export interface AuthProfile {
  id: string;
  nome: string;
  email: string;
  tipo: "admin" | "gestor" | "funcionario" | "beneficiario";
  perfilId: string;
  entidadeId: string | null;
}

export class AuthError extends Error {}

export async function apiLogin(email: string, senha: string): Promise<AuthProfile> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error || !data.user) {
    throw new AuthError(error?.message === "Invalid login credentials"
      ? "E-mail ou senha inválidos."
      : error?.message ?? "Erro ao entrar.");
  }
  return fetchProfile(data.user.id);
}

export async function fetchProfile(userId: string): Promise<AuthProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email, tipo, perfil_id, entidade_id")
    .eq("id", userId)
    .single();
  if (error || !data) {
    throw new AuthError("Usuário não encontrado ou sem permissão de acesso.");
  }
  return {
    id: data.id,
    nome: data.nome_completo,
    email: data.email,
    tipo: data.tipo,
    perfilId: data.perfil_id,
    entidadeId: data.entidade_id,
  };
}

export async function apiLogout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
