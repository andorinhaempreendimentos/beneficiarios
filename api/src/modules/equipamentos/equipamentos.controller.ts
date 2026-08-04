import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EquipamentosService } from './equipamentos.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { Permissao } from '../../common/decorators/roles.decorator';
import { StorageService } from '../../storage/storage.service';

const FOTOS_ACEITAS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO = 5 * 1024 * 1024;

@Controller('api/v1/equipamentos')
export class EquipamentosController {
  constructor(
    private readonly service: EquipamentosService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @Permissao('equipamentos', 'listar')
  findAll(@Query() filter: FilterEquipamentoDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('equipamentos', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('equipamentos', 'criar')
  create(@Body() dto: CreateEquipamentoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('equipamentos', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateEquipamentoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('equipamentos', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post(':id/fotos')
  @Permissao('equipamentos', 'editar')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: MAX_FOTO } }))
  async addFoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { key } = await this.storage.upload(file.buffer, FOTOS_ACEITAS);
    return this.service.addFoto(id, key);
  }

  @Delete(':id/fotos/:key')
  @HttpCode(204)
  @Permissao('equipamentos', 'editar')
  async removeFoto(@Param('id') id: string, @Param('key') key: string) {
    await this.storage.delete(key);
    await this.service.removeFoto(id, key);
  }
}
