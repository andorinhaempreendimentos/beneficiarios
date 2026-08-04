import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { TipoAprovacaoInscricao } from '../atividade.entity';
import { CreateAtividadePerguntaDto, CreateAtividadeTurnoDto } from './create-atividade-sub.dto';

export class CreateAtividadeDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  idadeMinima?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  idadeMaxima?: number;

  @IsOptional()
  @IsEnum(TipoAprovacaoInscricao)
  tipoAprovacao?: TipoAprovacaoInscricao;

  @IsUUID()
  nucleoId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAtividadePerguntaDto)
  perguntas?: CreateAtividadePerguntaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAtividadeTurnoDto)
  turnos?: CreateAtividadeTurnoDto[];
}
