import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracao } from './configuracao.entity';
import { ConfiguracoesController } from './configuracoes.controller';
import { ConfiguracoesService } from './configuracoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Configuracao])],
  controllers: [ConfiguracoesController],
  providers: [ConfiguracoesService],
  exports: [ConfiguracoesService],
})
export class ConfiguracoesModule {}
