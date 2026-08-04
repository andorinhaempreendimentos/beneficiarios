import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TipoPonto } from '../registro-ponto.entity';

export class RegistrarPontoDto {
  @IsUUID()
  funcionarioId: string;

  @IsEnum(TipoPonto)
  tipo: TipoPonto;

  @IsOptional()
  @IsString()
  observacao?: string;
}
