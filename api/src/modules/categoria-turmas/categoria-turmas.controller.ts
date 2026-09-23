import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoriaTurmasService } from './categoria-turmas.service';
import { CreateCategoriaTurmaDto } from './dto/create-categoria-turma.dto';
import { UpdateCategoriaTurmaDto } from './dto/update-categoria-turma.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

@Controller('api/v1/categoria-turmas')
export class CategoriaTurmasController {
  constructor(private readonly service: CategoriaTurmasService) {}

  @Get()
  @Permissao('categoria-turmas', 'listar')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('nome') nome?: string,
  ) {
    return this.service.findAll({ page, limit, nome });
  }

  @Get(':id')
  @Permissao('categoria-turmas', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('categoria-turmas', 'criar')
  create(@Body() dto: CreateCategoriaTurmaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('categoria-turmas', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaTurmaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('categoria-turmas', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
