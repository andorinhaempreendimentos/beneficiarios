import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ObjetosService } from './objetos.service';
import { CreateObjetoDto } from './dto/create-objeto.dto';
import { UpdateObjetoDto } from './dto/update-objeto.dto';
import { FilterObjetoDto } from './dto/filter-objeto.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/objetos')
export class ObjetosController {
  constructor(private readonly service: ObjetosService) {}

  @Get()
  @Permissao('objetos', 'listar')
  findAll(@Query() filter: FilterObjetoDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('objetos', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('objetos', 'criar')
  create(@Body() dto: CreateObjetoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('objetos', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateObjetoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('objetos', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
