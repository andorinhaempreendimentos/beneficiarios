import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTurmaDto } from './create-turma.dto';

export class UpdateTurmaDto extends PartialType(OmitType(CreateTurmaDto, ['horarios'] as const)) {}
