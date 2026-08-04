import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { RelatoriosService } from './relatorios.service';
import { FilterRelatorioBeneficiariosDto } from './dto/filter-relatorio-beneficiarios.dto';
import { FilterRelatorioPresencaDto } from './dto/filter-relatorio-presenca.dto';
import { FilterRelatorioPontoDto } from './dto/filter-relatorio-ponto.dto';
import { FilterRelatorioInscricoesDto } from './dto/filter-relatorio-inscricoes.dto';
import { FilterRelatorioEquipamentosDto } from './dto/filter-relatorio-equipamentos.dto';
import { Permissao } from '../../common/decorators/roles.decorator';

function setHeaders(res: Response, format: 'pdf' | 'excel', filename: string) {
  if (format === 'excel') {
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    });
  } else {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    });
  }
}

@Controller('api/v1/relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Get('beneficiarios')
  @Permissao('relatorios', 'exportar')
  async beneficiarios(@Query() f: FilterRelatorioBeneficiariosDto, @Res() res: Response) {
    const buf = await this.service.beneficiarios(f);
    setHeaders(res, f.format, 'beneficiarios');
    res.end(buf);
  }

  @Get('presenca')
  @Permissao('relatorios', 'exportar')
  async presenca(@Query() f: FilterRelatorioPresencaDto, @Res() res: Response) {
    const buf = await this.service.presenca(f);
    setHeaders(res, f.format, 'presenca');
    res.end(buf);
  }

  @Get('ponto')
  @Permissao('relatorios', 'exportar')
  async ponto(@Query() f: FilterRelatorioPontoDto, @Res() res: Response) {
    const buf = await this.service.ponto(f);
    setHeaders(res, f.format, 'ponto');
    res.end(buf);
  }

  @Get('inscricoes')
  @Permissao('relatorios', 'exportar')
  async inscricoes(@Query() f: FilterRelatorioInscricoesDto, @Res() res: Response) {
    const buf = await this.service.inscricoes(f);
    setHeaders(res, f.format, 'inscricoes');
    res.end(buf);
  }

  @Get('equipamentos')
  @Permissao('relatorios', 'exportar')
  async equipamentos(@Query() f: FilterRelatorioEquipamentosDto, @Res() res: Response) {
    const buf = await this.service.equipamentos(f);
    setHeaders(res, f.format, 'equipamentos');
    res.end(buf);
  }
}

