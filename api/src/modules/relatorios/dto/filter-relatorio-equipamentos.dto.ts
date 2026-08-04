import { IsOptional, IsString } from 'class-validator';
import { RelatorioBaseDto } from './relatorio-base.dto';

export class FilterRelatorioEquipamentosDto extends RelatorioBaseDto {
  @IsOptional() @IsString() nucleoId?: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() estado?: string;
}
