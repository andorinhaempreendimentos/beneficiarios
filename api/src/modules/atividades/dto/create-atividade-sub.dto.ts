import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoPergunta } from '../atividade-pergunta.entity';

export class CreateAtividadePerguntaDto {
  @IsString()
  enunciado: string;

  @IsEnum(TipoPergunta)
  tipo: TipoPergunta;

  @IsOptional()
  @IsString()
  opcoes?: string;

  @IsOptional()
  @IsBoolean()
  obrigatoria?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}

export class CreateAtividadeTurnoDto {
  @IsString()
  nome: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFim: string;
}
