import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EstadoEquipamento } from '../equipamento.entity';

export class CreateEquipamentoDto {
  @IsString()
  @MaxLength(300)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  marca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroSerie?: string;

  @IsOptional()
  @IsEnum(EstadoEquipamento)
  estado?: EstadoEquipamento;

  @IsOptional()
  @IsString()
  dataAquisicao?: string;

  @IsOptional()
  @IsString()
  valorAquisicao?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsUUID()
  nucleoId?: string;
}
