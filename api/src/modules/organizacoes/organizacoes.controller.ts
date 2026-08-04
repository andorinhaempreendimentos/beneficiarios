import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { OrganizacoesService } from './organizacoes.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';
import { FilterOrganizacaoDto } from './dto/filter-organizacao.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/organizacoes')
export class OrganizacoesController {
  constructor(private readonly service: OrganizacoesService) {}

  @Get()
  @Permissao('organizacoes', 'listar')
  findAll(@Query() filter: FilterOrganizacaoDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('organizacoes', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('organizacoes', 'criar')
  create(@Body() dto: CreateOrganizacaoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('organizacoes', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('organizacoes', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
