import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EstadoEquipamento } from '../equipamento.entity';

export class FilterEquipamentoDto extends PaginationDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsEnum(EstadoEquipamento)
  estado?: EstadoEquipamento;

  @IsOptional()
  @IsUUID()
  nucleoId?: string;
}
