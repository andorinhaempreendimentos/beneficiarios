import { IsOptional, IsString } from 'class-validator';
import { RelatorioBaseDto } from './relatorio-base.dto';

export class FilterRelatorioPontoDto extends RelatorioBaseDto {
  @IsOptional() @IsString() funcionarioId?: string;
}
