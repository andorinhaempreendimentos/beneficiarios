import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TipoUsuario } from '../usuario.entity';

export class FilterUsuarioDto extends PaginationDto {
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(TipoUsuario)
  tipo?: TipoUsuario;

  @IsOptional()
  @IsUUID()
  perfilId?: string;
}
