import { TipoUsuario } from '../modules/usuarios/usuario.entity';

export interface JwtPayload {
  sub: string;          // usuario.id
  email: string;
  tipo: TipoUsuario;
  perfilId: string;
  entidadeId: string | null;
}
