import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { TipoUsuario } from '../usuario.entity';

export class CreateUsuarioDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsString()
  @MaxLength(300)
  nomeCompleto: string;

  @IsOptional()
  @IsEnum(TipoUsuario)
  tipo?: TipoUsuario;

  @IsUUID()
  perfilId: string;

  @IsOptional()
  @IsUUID()
  entidadeId?: string;
}
