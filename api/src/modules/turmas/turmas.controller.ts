import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto, CreateTurmaHorarioDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { FilterTurmaDto } from './dto/filter-turma.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/turmas')
export class TurmasController {
  constructor(private readonly service: TurmasService) {}

  @Get()
  @Permissao('turmas', 'listar')
  findAll(@Query() filter: FilterTurmaDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('turmas', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('turmas', 'criar')
  create(@Body() dto: CreateTurmaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('turmas', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateTurmaDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/horarios')
  @Permissao('turmas', 'editar')
  upsertHorarios(@Param('id') id: string, @Body() dtos: CreateTurmaHorarioDto[]) {
    return this.service.upsertHorarios(id, dtos);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('turmas', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
