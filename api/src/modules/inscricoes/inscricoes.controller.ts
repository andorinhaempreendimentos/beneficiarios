import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { InscricoesService } from './inscricoes.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { FilterInscricaoDto } from './dto/filter-inscricao.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/inscricoes')
export class InscricoesController {
  constructor(private readonly service: InscricoesService) {}

  @Get()
  @Permissao('inscricoes', 'listar')
  findAll(@Query() filter: FilterInscricaoDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('inscricoes', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('inscricoes', 'criar')
  inscrever(@Body() dto: CreateInscricaoDto) {
    return this.service.inscrever(dto);
  }

  @Patch(':id/aprovar')
  @Permissao('inscricoes', 'editar')
  aprovar(@Param('id') id: string) {
    return this.service.aprovar(id);
  }

  @Patch(':id/recusar')
  @Permissao('inscricoes', 'editar')
  recusar(@Param('id') id: string, @Body('observacoes') obs?: string) {
    return this.service.recusar(id, obs);
  }

  @Patch(':id/cancelar')
  @Permissao('inscricoes', 'editar')
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }
}
