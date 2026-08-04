import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { StatusInscricao } from '../inscricao.entity';

export class FilterInscricaoDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  turmaId?: string;

  @IsOptional()
  @IsUUID()
  beneficiarioId?: string;

  @IsOptional()
  @IsEnum(StatusInscricao)
  status?: StatusInscricao;
}
