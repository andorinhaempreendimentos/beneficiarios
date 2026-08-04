import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { UpsertConfiguracaoDto } from './dto/upsert-configuracao.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/configuracoes')
export class ConfiguracoesController {
  constructor(private readonly service: ConfiguracoesService) {}

  @Get()
  @Permissao('configuracoes', 'listar')
  findAll() {
    return this.service.findAll();
  }

  @Get(':chave')
  @Permissao('configuracoes', 'listar')
  findOne(@Param('chave') chave: string) {
    return this.service.findOne(chave);
  }

  @Put()
  @Permissao('configuracoes', 'editar')
  upsert(@Body() dto: UpsertConfiguracaoDto) {
    return this.service.upsert(dto);
  }

  @Delete(':chave')
  @HttpCode(204)
  @Permissao('configuracoes', 'excluir')
  async remove(@Param('chave') chave: string) {
    await this.service.remove(chave);
  }
}
