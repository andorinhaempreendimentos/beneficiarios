import { IsEmail, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateOrganizacaoDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsOptional()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ inválido' })
  cnpj?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsUUID()
  objetoId: string;
}
