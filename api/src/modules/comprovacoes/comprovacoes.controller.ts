import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ComprovacoesService } from './comprovacoes.service';
import { CreateComprovacaoDto } from './dto/create-comprovacao.dto';
import { FilterComprovacaoDto } from './dto/filter-comprovacao.dto';
import { Permissao } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';

@Controller('api/v1/comprovacoes')
export class ComprovacoesController {
  constructor(private readonly service: ComprovacoesService) {}

  @Get()
  @Permissao('comprovacoes', 'listar')
  findAll(@Query() filter: FilterComprovacaoDto) {
    return this.service.findAll(filter);
  }

  @Post()
  @Permissao('comprovacoes', 'criar')
  criar(@Body() dto: CreateComprovacaoDto, @CurrentUser() user: JwtPayload) {
    return this.service.criar(dto, user.sub);
  }
}
