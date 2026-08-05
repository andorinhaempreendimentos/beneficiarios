export type TipoUsuario = 'admin' | 'gestor' | 'funcionario' | 'beneficiario';

// Rota de destino após login por tipo
export function rotaInicial(tipo: TipoUsuario): string {
  if (tipo === 'funcionario') return '/agenda';
  if (tipo === 'beneficiario') return '/horarios';
  return '/';
}
