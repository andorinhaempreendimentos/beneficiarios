import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PontoService } from './ponto.service';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { FilterPontoDto } from './dto/filter-ponto.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/ponto')
export class PontoController {
  constructor(private readonly service: PontoService) {}

  @Get()
  @Permissao('ponto', 'listar')
  findAll(@Query() filter: FilterPontoDto) {
    return this.service.findAll(filter);
  }

  @Post('gerar-qr/:turmaId')
  @Permissao('ponto', 'criar')
  gerarQr(@Param('turmaId') turmaId: string) {
    return this.service.gerarQr(turmaId);
  }

  @Post('qr/:token')
  @Permissao('ponto', 'criar')
  registrarViaQr(@Param('token') token: string, @Body() dto: RegistrarPontoDto) {
    return this.service.registrarViaPonto(dto, token);
  }

  @Post('manual')
  @Permissao('ponto', 'criar')
  registrarManual(@Body() dto: RegistrarPontoDto) {
    return this.service.registrarManual(dto);
  }
}
