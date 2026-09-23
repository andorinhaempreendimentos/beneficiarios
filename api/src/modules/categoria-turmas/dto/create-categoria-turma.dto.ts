import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCategoriaTurmaDto {
  @IsString()
  @MaxLength(50)
  nome: string;

  @IsString()
  @MaxLength(10)
  sigla: string;

  @IsInt()
  @Min(0)
  @Max(99)
  idadeMinima: number;

  @IsInt()
  @Min(0)
  @Max(99)
  idadeMaxima: number;
}
