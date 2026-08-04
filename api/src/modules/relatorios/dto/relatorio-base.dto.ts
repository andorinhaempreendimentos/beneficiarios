import { IsIn, IsOptional, IsString } from 'class-validator';

export class RelatorioBaseDto {
  @IsOptional()
  @IsIn(['pdf', 'excel'])
  format: 'pdf' | 'excel' = 'pdf';

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;
}
