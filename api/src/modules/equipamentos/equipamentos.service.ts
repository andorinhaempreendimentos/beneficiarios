import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Equipamento } from './equipamento.entity';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';

@Injectable()
export class EquipamentosService {
  constructor(
    @InjectRepository(Equipamento)
    private readonly repo: Repository<Equipamento>,
  ) {}

  async findAll(f: FilterEquipamentoDto): Promise<Paginated<Equipamento>> {
    const where: FindOptionsWhere<Equipamento> = {};
    if (f.nome) where.nome = ILike(`%${f.nome}%`);
    if (f.categoria) where.categoria = ILike(`%${f.categoria}%`);
    if (f.estado) where.estado = f.estado;
    if (f.nucleoId) where.nucleoId = f.nucleoId;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Equipamento> {
    const eq = await this.repo.findOne({ where: { id } });
    if (!eq) throw new NotFoundException('Equipamento não encontrado');
    return eq;
  }

  async create(dto: CreateEquipamentoDto): Promise<Equipamento> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateEquipamentoDto): Promise<Equipamento> {
    const eq = await this.findOne(id);
    Object.assign(eq, dto);
    return this.repo.save(eq);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }

  async addFoto(id: string, key: string): Promise<Equipamento> {
    const eq = await this.findOne(id);
    const existing = eq.fotosKeys ? eq.fotosKeys.split('|').filter(Boolean) : [];
    eq.fotosKeys = [...existing, key].join('|');
    return this.repo.save(eq);
  }

  async removeFoto(id: string, key: string): Promise<Equipamento> {
    const eq = await this.findOne(id);
    const keys = eq.fotosKeys ? eq.fotosKeys.split('|').filter((k) => k !== key) : [];
    eq.fotosKeys = keys.join('|') || null;
    return this.repo.save(eq);
  }
}
