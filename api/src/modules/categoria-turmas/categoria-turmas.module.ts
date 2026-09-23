import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaTurma } from './categoria-turma.entity';
import { CategoriaTurmasController } from './categoria-turmas.controller';
import { CategoriaTurmasService } from './categoria-turmas.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaTurma])],
  controllers: [CategoriaTurmasController],
  providers: [CategoriaTurmasService],
  exports: [CategoriaTurmasService],
})
export class CategoriaTurmasModule {}
