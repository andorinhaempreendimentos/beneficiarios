import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { RegistroPresenca } from '../presenca/registro-presenca.entity';
import { RegistroPonto } from '../ponto/registro-ponto.entity';
import { Inscricao } from '../inscricoes/inscricao.entity';
import { Equipamento } from '../equipamentos/equipamento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Beneficiario,
      RegistroPresenca,
      RegistroPonto,
      Inscricao,
      Equipamento,
    ]),
  ],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
