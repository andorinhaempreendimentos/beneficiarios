import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from './turma.entity';
import { TurmaHorario } from './turma-horario.entity';
import { TurmaResponsavel } from './turma-responsavel.entity';
import { Atividade } from '../atividades/atividade.entity';
import { TurmasController } from './turmas.controller';
import { TurmasService } from './turmas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Turma, TurmaHorario, TurmaResponsavel, Atividade])],
  controllers: [TurmasController],
  providers: [TurmasService],
  exports: [TurmasService],
})
export class TurmasModule {}
