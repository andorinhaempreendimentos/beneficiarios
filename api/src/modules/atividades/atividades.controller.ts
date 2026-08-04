import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { CreateAtividadePerguntaDto, CreateAtividadeTurnoDto } from './dto/create-atividade-sub.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/atividades')
export class AtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Get()
  @Permissao('atividades', 'listar')
  findAll(@Query() filter: FilterAtividadeDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('atividades', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('atividades', 'criar')
  create(@Body() dto: CreateAtividadeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('atividades', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateAtividadeDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/perguntas')
  @Permissao('atividades', 'editar')
  upsertPerguntas(@Param('id') id: string, @Body() dtos: CreateAtividadePerguntaDto[]) {
    return this.service.upsertPerguntas(id, dtos);
  }

  @Put(':id/turnos')
  @Permissao('atividades', 'editar')
  upsertTurnos(@Param('id') id: string, @Body() dtos: CreateAtividadeTurnoDto[]) {
    return this.service.upsertTurnos(id, dtos);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('atividades', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
