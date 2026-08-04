import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TipoAprovacaoInscricao } from '../atividade.entity';

export class FilterAtividadeDto extends PaginationDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  nucleoId?: string;

  @IsOptional()
  @IsEnum(TipoAprovacaoInscricao)
  tipoAprovacao?: TipoAprovacaoInscricao;
}
