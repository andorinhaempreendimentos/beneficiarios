export type TipoUsuario = "admin" | "funcionario" | "beneficiario";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  // id do registro real (funcionario.id ou beneficiario.id, ou usuario.id para admin)
  refId: string;
  perfilId?: string; // só para admin/coordenador
}

const STORAGE_KEY = "andorinha_auth";

export function salvarSessao(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function carregarSessao(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function limparSessao(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  // Expira o cookie auth_type usado pelo proxy
  document.cookie = "auth_type=; path=/; max-age=0";
}

// Rota de destino após login por tipo
export function rotaInicial(tipo: TipoUsuario): string {
  if (tipo === "funcionario") return "/agenda";
  if (tipo === "beneficiario") return "/horarios";
  return "/";
}
