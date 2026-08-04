import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { RegistroPresenca } from './registro-presenca.entity';
import { RegistrarPresencaDto } from './dto/registrar-presenca.dto';
import { FilterPresencaDto } from './dto/filter-presenca.dto';

@Injectable()
export class PresencaService {
  constructor(
    @InjectRepository(RegistroPresenca)
    private readonly repo: Repository<RegistroPresenca>,
  ) {}

  async findAll(f: FilterPresencaDto): Promise<Paginated<RegistroPresenca>> {
    const where: FindOptionsWhere<RegistroPresenca> = {};
    if (f.turmaId) where.turmaId = f.turmaId;
    if (f.data) where.data = f.data;
    if (f.beneficiarioId) where.beneficiarioId = f.beneficiarioId;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { data: 'DESC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async registrar(dto: RegistrarPresencaDto): Promise<RegistroPresenca> {
    const existe = await this.repo.findOne({
      where: { turmaId: dto.turmaId, data: dto.data, beneficiarioId: dto.beneficiarioId },
      select: { id: true },
    });
    if (existe) throw new ConflictException('Presença já registrada para este beneficiário nesta data');
    return this.repo.save(this.repo.create({ ...dto, presente: dto.presente ?? true }));
  }

  async chamada(turmaId: string, data: string): Promise<RegistroPresenca[]> {
    return this.repo.find({ where: { turmaId, data }, order: { createdAt: 'ASC' } });
  }
}
