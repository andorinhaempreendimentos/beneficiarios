import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { PerfisService } from './perfis.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { FilterPerfilDto } from './dto/filter-perfil.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/perfis')
export class PerfisController {
  constructor(private readonly service: PerfisService) {}

  @Get()
  @Permissao('perfis', 'listar')
  findAll(@Query() filter: FilterPerfilDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('perfis', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('perfis', 'criar')
  create(@Body() dto: CreatePerfilDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('perfis', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdatePerfilDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('perfis', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
