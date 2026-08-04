import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInscricaoDto {
  @IsUUID()
  turmaId: string;

  @IsUUID()
  beneficiarioId: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  respostasFormulario?: Record<string, string>;
}
