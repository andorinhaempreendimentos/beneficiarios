export type TipoUsuario = 'admin' | 'gestor' | 'funcionario' | 'beneficiario';

// Rota de destino após login por tipo
export function rotaInicial(_tipo: TipoUsuario): string {
  return '/';
}
