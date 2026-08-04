import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CargoFuncionario } from '../funcionario.entity';

export class FilterFuncionarioDto extends PaginationDto {
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsEnum(CargoFuncionario)
  cargo?: CargoFuncionario;
}
