import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atividade } from './atividade.entity';
import { AtividadePergunta } from './atividade-pergunta.entity';
import { AtividadeTurno } from './atividade-turno.entity';
import { AtividadesController } from './atividades.controller';
import { AtividadesService } from './atividades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Atividade, AtividadePergunta, AtividadeTurno])],
  controllers: [AtividadesController],
  providers: [AtividadesService],
  exports: [AtividadesService],
})
export class AtividadesModule {}
