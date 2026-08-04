import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Objeto } from './objeto.entity';
import { ObjetosController } from './objetos.controller';
import { ObjetosService } from './objetos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Objeto])],
  controllers: [ObjetosController],
  providers: [ObjetosService],
  exports: [ObjetosService],
})
export class ObjetosModule {}
