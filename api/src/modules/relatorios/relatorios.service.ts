import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import * as PDFDocumentLib from 'pdfkit';
const PDFDocument = PDFDocumentLib as unknown as typeof import('pdfkit');
import * as ExcelJS from 'exceljs';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { RegistroPresenca } from '../presenca/registro-presenca.entity';
import { RegistroPonto } from '../ponto/registro-ponto.entity';
import { Inscricao } from '../inscricoes/inscricao.entity';
import { Equipamento } from '../equipamentos/equipamento.entity';
import { FilterRelatorioBeneficiariosDto } from './dto/filter-relatorio-beneficiarios.dto';
import { FilterRelatorioPresencaDto } from './dto/filter-relatorio-presenca.dto';
import { FilterRelatorioPontoDto } from './dto/filter-relatorio-ponto.dto';
import { FilterRelatorioInscricoesDto } from './dto/filter-relatorio-inscricoes.dto';
import { FilterRelatorioEquipamentosDto } from './dto/filter-relatorio-equipamentos.dto';

type Row = Record<string, string | number | null>;

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectRepository(Beneficiario) private benefRepo: Repository<Beneficiario>,
    @InjectRepository(RegistroPresenca) private presencaRepo: Repository<RegistroPresenca>,
    @InjectRepository(RegistroPonto) private pontoRepo: Repository<RegistroPonto>,
    @InjectRepository(Inscricao) private inscricaoRepo: Repository<Inscricao>,
    @InjectRepository(Equipamento) private equipRepo: Repository<Equipamento>,
  ) {}

  // ── helpers ──────────────────────────────────────────────────────────────

  private dateRange(inicio?: string, fim?: string) {
    if (inicio && fim) return Between(inicio, fim);
    if (inicio) return Between(inicio, '9999-12-31');
    if (fim) return Between('0000-01-01', fim);
    return undefined;
  }

  private async buildPdf(title: string, headers: string[], rows: Row[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(13).text(title, { align: 'center' }).moveDown(0.5);
      doc.fontSize(7);

      const colWidth = (doc.page.width - 72) / headers.length;
      const rowH = 14;
      let y = doc.y;

      // header row
      doc.font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, 36 + i * colWidth, y, { width: colWidth - 4, lineBreak: false });
      });
      y += rowH;
      doc.moveTo(36, y - 2).lineTo(doc.page.width - 36, y - 2).stroke();

      doc.font('Helvetica');
      for (const row of rows) {
        if (y + rowH > doc.page.height - 36) {
          doc.addPage();
          y = 36;
        }
        headers.forEach((h, i) => {
          const val = row[h] ?? '';
          doc.text(String(val), 36 + i * colWidth, y, { width: colWidth - 4, lineBreak: false });
        });
        y += rowH;
      }

      doc.end();
    });
  }

  private async buildExcel(title: string, headers: string[], rows: Row[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(title.substring(0, 31));

    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    ws.columns = headers.map((h) => ({ header: h, key: h, width: 22 }));

    for (const row of rows) {
      ws.addRow(headers.map((h) => row[h] ?? ''));
    }

    ws.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + headers.length)}1` };
    return wb.xlsx.writeBuffer().then((b) => Buffer.from(b));
  }

  private render(format: 'pdf' | 'excel', title: string, headers: string[], rows: Row[]) {
    return format === 'excel'
      ? this.buildExcel(title, headers, rows)
      : this.buildPdf(title, headers, rows);
  }

  // ── relatórios ────────────────────────────────────────────────────────────

  async beneficiarios(f: FilterRelatorioBeneficiariosDto): Promise<Buffer> {
    const where: Record<string, unknown> = {};
    if (f.nomeCompleto) where.nomeCompleto = ILike(`%${f.nomeCompleto}%`);
    if (f.municipio) where.municipio = ILike(`%${f.municipio}%`);
    if (f.sexo) where.sexo = f.sexo;

    const list = await this.benefRepo.find({
      where: Object.keys(where).length ? where : undefined,
      order: { nomeCompleto: 'ASC' },
      take: 5000,
    });

    const headers = ['Matrícula', 'Nome', 'Nascimento', 'Sexo', 'CPF', 'Município', 'UF', 'Celular'];
    const rows: Row[] = list.map((b) => ({
      'Matrícula': b.matricula,
      'Nome': b.nomeCompleto,
      'Nascimento': b.dataNascimento,
      'Sexo': b.sexo,
      'CPF': b.cpf ?? '',
      'Município': b.municipio ?? '',
      'UF': b.uf ?? '',
      'Celular': b.celular ?? '',
    }));

    return this.render(f.format, 'Beneficiários', headers, rows);
  }

  async presenca(f: FilterRelatorioPresencaDto): Promise<Buffer> {
    const where: Record<string, unknown> = {};
    if (f.turmaId) where.turmaId = f.turmaId;
    if (f.beneficiarioId) where.beneficiarioId = f.beneficiarioId;
    const range = this.dateRange(f.dataInicio, f.dataFim);
    if (range) where.data = range;

    const list = await this.presencaRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { beneficiario: true, turma: true },
      order: { data: 'ASC' },
      take: 10000,
    });

    const headers = ['Data', 'Turma', 'Matrícula', 'Beneficiário', 'Presente', 'Observação'];
    const rows: Row[] = list.map((r) => ({
      'Data': r.data,
      'Turma': r.turma?.nome ?? r.turmaId,
      'Matrícula': r.beneficiario?.matricula ?? '',
      'Beneficiário': r.beneficiario?.nomeCompleto ?? r.beneficiarioId,
      'Presente': r.presente ? 'Sim' : 'Não',
      'Observação': r.observacao ?? '',
    }));

    return this.render(f.format, 'Presença', headers, rows);
  }

  async ponto(f: FilterRelatorioPontoDto): Promise<Buffer> {
    const where: Record<string, unknown> = {};
    if (f.funcionarioId) where.funcionarioId = f.funcionarioId;
    const range = this.dateRange(f.dataInicio, f.dataFim);
    if (range) where.data = range;

    const list = await this.pontoRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { funcionario: true },
      order: { data: 'ASC', hora: 'ASC' },
      take: 10000,
    });

    const headers = ['Data', 'Hora', 'Matrícula', 'Funcionário', 'Cargo', 'Tipo'];
    const rows: Row[] = list.map((r) => ({
      'Data': r.data,
      'Hora': r.hora,
      'Matrícula': r.funcionario?.matricula ?? '',
      'Funcionário': r.funcionario?.nomeCompleto ?? r.funcionarioId,
      'Cargo': r.funcionario?.cargo ?? '',
      'Tipo': r.tipo,
    }));

    return this.render(f.format, 'Registro de Ponto', headers, rows);
  }

  async inscricoes(f: FilterRelatorioInscricoesDto): Promise<Buffer> {
    const where: Record<string, unknown> = {};
    if (f.turmaId) where.turmaId = f.turmaId;
    if (f.status) where.status = f.status;

    const list = await this.inscricaoRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { beneficiario: true, turma: true },
      order: { createdAt: 'ASC' },
      take: 10000,
    });

    const headers = ['Data', 'Turma', 'Matrícula', 'Beneficiário', 'Status', 'Observações'];
    const rows: Row[] = list.map((i) => ({
      'Data': i.createdAt?.toISOString().slice(0, 10) ?? '',
      'Turma': i.turma?.nome ?? i.turmaId,
      'Matrícula': i.beneficiario?.matricula ?? '',
      'Beneficiário': i.beneficiario?.nomeCompleto ?? i.beneficiarioId,
      'Status': i.status,
      'Observações': i.observacoes ?? '',
    }));

    return this.render(f.format, 'Inscrições', headers, rows);
  }

  async equipamentos(f: FilterRelatorioEquipamentosDto): Promise<Buffer> {
    const where: Record<string, unknown> = {};
    if (f.nucleoId) where.nucleoId = f.nucleoId;
    if (f.categoria) where.categoria = f.categoria;
    if (f.estado) where.estado = f.estado;

    const list = await this.equipRepo.find({
      where: Object.keys(where).length ? where : undefined,
      order: { nome: 'ASC' },
      take: 5000,
    });

    const headers = ['Nome', 'Categoria', 'Marca', 'Modelo', 'Nº Série', 'Estado', 'Aquisição', 'Valor'];
    const rows: Row[] = list.map((e) => ({
      'Nome': e.nome,
      'Categoria': e.categoria ?? '',
      'Marca': e.marca ?? '',
      'Modelo': e.modelo ?? '',
      'Nº Série': e.numeroSerie ?? '',
      'Estado': e.estado ?? '',
      'Aquisição': e.dataAquisicao ?? '',
      'Valor': e.valorAquisicao ?? '',
    }));

    return this.render(f.format, 'Equipamentos', headers, rows);
  }
}
