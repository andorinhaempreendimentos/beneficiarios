import { IsOptional, IsString } from 'class-validator';
import { RelatorioBaseDto } from './relatorio-base.dto';

export class FilterRelatorioPresencaDto extends RelatorioBaseDto {
  @IsOptional() @IsString() turmaId?: string;
  @IsOptional() @IsString() beneficiarioId?: string;
}
