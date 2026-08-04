import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BeneficiariosService } from './beneficiarios.service';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto';
import { FilterBeneficiarioDto } from './dto/filter-beneficiario.dto';
import { Permissao } from '../../common/decorators/roles.decorator';
import { StorageService } from '../../storage/storage.service';

const FOTOS_ACEITAS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO = 5 * 1024 * 1024; // 5 MB

@Controller('api/v1/beneficiarios')
export class BeneficiariosController {
  constructor(
    private readonly service: BeneficiariosService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @Permissao('beneficiarios', 'listar')
  findAll(@Query() filter: FilterBeneficiarioDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Permissao('beneficiarios', 'listar')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissao('beneficiarios', 'criar')
  create(@Body() dto: CreateBeneficiarioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissao('beneficiarios', 'editar')
  update(@Param('id') id: string, @Body() dto: UpdateBeneficiarioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissao('beneficiarios', 'excluir')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post(':id/foto')
  @Permissao('beneficiarios', 'editar')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: MAX_FOTO } }))
  async uploadFoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { key } = await this.storage.upload(file.buffer, FOTOS_ACEITAS);
    return this.service.updateFoto(id, key);
  }
}
