import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { NucleosService } from './nucleos.service';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';
import { FilterNucleoDto } from './dto/filter-nucleo.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/nucleos')
export class NucleosController {
  constructor(private readonly service: NucleosService) {}

  @Get()
  @Permissao('nucleos', 'listar')
  findAll(@Query() filter: FilterNucleoDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('nucleos', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('nucleos', 'criar')
  create(@Body() dto: CreateNucleoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('nucleos', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateNucleoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('nucleos', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
