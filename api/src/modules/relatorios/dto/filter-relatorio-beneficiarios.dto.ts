import { IsOptional, IsString } from 'class-validator';
import { RelatorioBaseDto } from './relatorio-base.dto';

export class FilterRelatorioBeneficiariosDto extends RelatorioBaseDto {
  @IsOptional() @IsString() nomeCompleto?: string;
  @IsOptional() @IsString() municipio?: string;
  @IsOptional() @IsString() sexo?: string;
  @IsOptional() @IsString() turmaId?: string;
}
