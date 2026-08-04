import { IsOptional, IsString } from 'class-validator';
import { RelatorioBaseDto } from './relatorio-base.dto';

export class FilterRelatorioInscricoesDto extends RelatorioBaseDto {
  @IsOptional() @IsString() turmaId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() nucleoId?: string;
}
