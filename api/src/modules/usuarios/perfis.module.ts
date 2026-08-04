import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil } from './perfil.entity';
import { PerfilPermissao } from './perfil-permissao.entity';
import { PerfisController } from './perfis.controller';
import { PerfisService } from './perfis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil, PerfilPermissao])],
  controllers: [PerfisController],
  providers: [PerfisService],
  exports: [PerfisService],
})
export class PerfisModule {}
