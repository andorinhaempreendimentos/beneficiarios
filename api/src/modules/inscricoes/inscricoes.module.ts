import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscricao } from './inscricao.entity';
import { BeneficiarioTurma } from '../beneficiarios/beneficiario-turma.entity';
import { Turma } from '../turmas/turma.entity';
import { Atividade } from '../atividades/atividade.entity';
import { InscricoesController } from './inscricoes.controller';
import { InscricoesService } from './inscricoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inscricao, BeneficiarioTurma, Turma, Atividade])],
  controllers: [InscricoesController],
  providers: [InscricoesService],
  exports: [InscricoesService],
})
export class InscricoesModule {}
