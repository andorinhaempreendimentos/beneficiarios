import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PresencaService } from './presenca.service';
import { RegistrarPresencaDto } from './dto/registrar-presenca.dto';
import { FilterPresencaDto } from './dto/filter-presenca.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/presenca')
export class PresencaController {
  constructor(private readonly service: PresencaService) {}

  @Get()
  @Permissao('presenca', 'listar')
  findAll(@Query() filter: FilterPresencaDto) {
    return this.service.findAll(filter);
  }

  @Get('chamada/:turmaId/:data')
  @Permissao('presenca', 'listar')
  chamada(@Param('turmaId') turmaId: string, @Param('data') data: string) {
    return this.service.chamada(turmaId, data);
  }

  @Post()
  @Permissao('presenca', 'criar')
  registrar(@Body() dto: RegistrarPresencaDto) {
    return this.service.registrar(dto);
  }
}
