import type { AuthProfile } from '@/lib/api/auth';

export type TipoUsuario = 'admin' | 'gestor' | 'funcionario' | 'beneficiario';

// Rota de destino após login
export function rotaInicial(profile: AuthProfile): string {
  if ((profile as any).isCoordenador) return '/coordenador';
  if (profile.isProfessor || profile.tipo === 'funcionario') return '/professor';
  return '/';
}
