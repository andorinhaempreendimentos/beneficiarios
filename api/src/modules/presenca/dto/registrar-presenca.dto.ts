import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegistrarPresencaDto {
  @IsUUID()
  turmaId: string;

  @IsString()
  data: string;

  @IsUUID()
  beneficiarioId: string;

  @IsOptional()
  @IsBoolean()
  presente?: boolean;

  @IsOptional()
  @IsString()
  observacao?: string;
}
