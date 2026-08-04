import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAtividadeDto } from './create-atividade.dto';

export class UpdateAtividadeDto extends PartialType(OmitType(CreateAtividadeDto, ['perguntas', 'turnos'] as const)) {}
