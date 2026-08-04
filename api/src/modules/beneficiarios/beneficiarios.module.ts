import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beneficiario } from './beneficiario.entity';
import { BeneficiariosController } from './beneficiarios.controller';
import { BeneficiariosService } from './beneficiarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiario])],
  controllers: [BeneficiariosController],
  providers: [BeneficiariosService],
  exports: [BeneficiariosService],
})
export class BeneficiariosModule {}
