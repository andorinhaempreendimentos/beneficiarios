import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateComprovacaoDto {
  @IsUUID()
  turmaId: string;

  @IsString()
  data: string;

  /** Chave no bucket R2 — preenchida pelo StorageService após upload */
  @IsString()
  storageKey: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
