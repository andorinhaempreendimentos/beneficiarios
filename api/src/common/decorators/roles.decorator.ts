import { SetMetadata } from '@nestjs/common';
import { TipoUsuario } from '../../modules/usuarios/usuario.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: TipoUsuario[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSAO_KEY = 'permissao';
export const Permissao = (modulo: string, acao: string) =>
  SetMetadata(PERMISSAO_KEY, { modulo, acao });
