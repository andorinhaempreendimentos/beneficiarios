import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TipoPonto } from '../registro-ponto.entity';

export class FilterPontoDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  funcionarioId?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsEnum(TipoPonto)
  tipo?: TipoPonto;
}
