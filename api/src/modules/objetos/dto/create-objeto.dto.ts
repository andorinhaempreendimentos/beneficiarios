import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateObjetoDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
