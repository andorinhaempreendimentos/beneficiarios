import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterComprovacaoDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  turmaId?: string;

  @IsOptional()
  @IsString()
  data?: string;
}
