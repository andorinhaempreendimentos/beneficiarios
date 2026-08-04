import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroPresenca } from './registro-presenca.entity';
import { PresencaController } from './presenca.controller';
import { PresencaService } from './presenca.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroPresenca])],
  controllers: [PresencaController],
  providers: [PresencaService],
  exports: [PresencaService],
})
export class PresencaModule {}
