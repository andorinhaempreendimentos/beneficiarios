import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroPonto } from './registro-ponto.entity';
import { PontoController } from './ponto.controller';
import { PontoService } from './ponto.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroPonto])],
  controllers: [PontoController],
  providers: [PontoService],
  exports: [PontoService],
})
export class PontoModule {}
