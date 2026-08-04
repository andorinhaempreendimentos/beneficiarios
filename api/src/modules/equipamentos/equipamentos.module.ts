import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipamento } from './equipamento.entity';
import { EquipamentosController } from './equipamentos.controller';
import { EquipamentosService } from './equipamentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Equipamento])],
  controllers: [EquipamentosController],
  providers: [EquipamentosService],
  exports: [EquipamentosService],
})
export class EquipamentosModule {}
