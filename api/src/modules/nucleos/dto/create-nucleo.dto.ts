import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateNucleoDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsUUID()
  organizacaoId: string;
}
