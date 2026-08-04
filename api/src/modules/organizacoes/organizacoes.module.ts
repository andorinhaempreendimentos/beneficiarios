import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organizacao } from './organizacao.entity';
import { OrganizacoesController } from './organizacoes.controller';
import { OrganizacoesService } from './organizacoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organizacao])],
  controllers: [OrganizacoesController],
  providers: [OrganizacoesService],
  exports: [OrganizacoesService],
})
export class OrganizacoesModule {}
