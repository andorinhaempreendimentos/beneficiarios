import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nucleo } from './nucleo.entity';
import { NucleosController } from './nucleos.controller';
import { NucleosService } from './nucleos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Nucleo])],
  controllers: [NucleosController],
  providers: [NucleosService],
  exports: [NucleosService],
})
export class NucleosModule {}
