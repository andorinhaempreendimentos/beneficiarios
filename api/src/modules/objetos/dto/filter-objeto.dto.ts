import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterObjetoDto extends PaginationDto {
  @IsOptional()
  @IsString()
  nome?: string;
}
