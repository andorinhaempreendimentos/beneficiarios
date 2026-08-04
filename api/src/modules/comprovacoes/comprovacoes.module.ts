import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfirmacaoAtividade } from './confirmacao-atividade.entity';
import { ComprovacoesController } from './comprovacoes.controller';
import { ComprovacoesService } from './comprovacoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConfirmacaoAtividade])],
  controllers: [ComprovacoesController],
  providers: [ComprovacoesService],
  exports: [ComprovacoesService],
})
export class ComprovacoesModule {}
