import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FuncionariosService } from './funcionarios.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FilterFuncionarioDto } from './dto/filter-funcionario.dto';
import { Permissao } from '../../common/decorators/roles.decorator';
import { StorageService } from '../../storage/storage.service';

const FOTOS_ACEITAS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO = 5 * 1024 * 1024;

@Controller('api/v1/funcionarios')
export class FuncionariosController {
  constructor(
    private readonly service: FuncionariosService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @Permissao('funcionarios', 'listar')
  findAll(@Query() filter: FilterFuncionarioDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('funcionarios', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('funcionarios', 'criar')
  create(@Body() dto: CreateFuncionarioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('funcionarios', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateFuncionarioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('funcionarios', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post(':id/foto')
  @Permissao('funcionarios', 'editar')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: MAX_FOTO } }))
  async uploadFoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { key } = await this.storage.upload(file.buffer, FOTOS_ACEITAS);
    return this.service.updateFoto(id, key);
  }
}
