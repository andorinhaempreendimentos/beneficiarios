import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterPerfilDto extends PaginationDto {
  @IsOptional()
  @IsString()
  nome?: string;
}
