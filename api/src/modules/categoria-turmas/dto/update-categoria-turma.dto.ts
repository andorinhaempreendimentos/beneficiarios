import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaTurmaDto } from './create-categoria-turma.dto';

export class UpdateCategoriaTurmaDto extends PartialType(CreateCategoriaTurmaDto) {}
