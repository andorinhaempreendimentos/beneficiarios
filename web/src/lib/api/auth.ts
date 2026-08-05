import { apiGet, apiPost } from './client';

export interface AuthProfile {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'gestor' | 'funcionario' | 'beneficiario';
  perfilId: string;
  entidadeId: string | null;
}

export async function apiLogin(
  email: string,
  senha: string,
): Promise<AuthProfile> {
  return apiPost<AuthProfile>('/api/v1/auth/login', { email, senha });
}

export async function apiLoginBeneficiario(
  matricula: string,
  dataNascimento: string,
  celular: string,
): Promise<AuthProfile> {
  return apiPost<AuthProfile>('/api/v1/auth/login/beneficiario', {
    matricula,
    dataNascimento,
    celular,
  });
}

export async function apiMe(): Promise<AuthProfile> {
  return apiGet<AuthProfile>('/api/v1/auth/me');
}

export async function apiLogout(): Promise<void> {
  return apiPost<void>('/api/v1/auth/logout', {});
}
