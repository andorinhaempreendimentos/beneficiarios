import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class PermissaoDto {
  @IsString()
  modulo: string;

  @IsString()
  acao: string;

  @IsBoolean()
  permitido: boolean;
}

export class CreatePerfilDto {
  @IsString()
  @MaxLength(100)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissaoDto)
  permissoes?: PermissaoDto[];
}
