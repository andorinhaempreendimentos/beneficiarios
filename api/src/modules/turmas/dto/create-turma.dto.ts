import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateTurmaHorarioDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFim: string;
}

export class CreateTurmaDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsUUID()
  atividadeId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  vagasTotais?: number;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTurmaHorarioDto)
  horarios?: CreateTurmaHorarioDto[];
}
