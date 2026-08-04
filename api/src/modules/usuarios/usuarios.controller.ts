import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  @Permissao('usuarios', 'listar')
  findAll(@Query() filter: FilterUsuarioDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('usuarios', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('usuarios', 'criar')
  create(@Body() dto: CreateUsuarioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('usuarios', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/ativo')
  @Permissao('usuarios', 'editar')
  setAtivo(@Param('id') id: string, @Body('ativo') ativo: boolean) {
    return this.service.setAtivo(id, ativo);
  }
}
