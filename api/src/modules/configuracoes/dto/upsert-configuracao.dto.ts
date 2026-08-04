import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertConfiguracaoDto {
  @IsString() @MaxLength(100) @IsNotEmpty()
  chave: string;

  valor: unknown;

  @IsOptional() @IsString()
  descricao?: string;
}
