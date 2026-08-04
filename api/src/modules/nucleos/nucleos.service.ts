import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Nucleo } from './nucleo.entity';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';
import { FilterNucleoDto } from './dto/filter-nucleo.dto';

@Injectable()
export class NucleosService {
  constructor(
    @InjectRepository(Nucleo)
    private readonly repo: Repository<Nucleo>,
  ) {}

  async findAll(f: FilterNucleoDto): Promise<Paginated<Nucleo>> {
    const where: FindOptionsWhere<Nucleo> = {};
    if (f.nome) where.nome = ILike(`%${f.nome}%`);
    if (f.organizacaoId) where.organizacaoId = f.organizacaoId;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Nucleo> {
    const nucleo = await this.repo.findOne({ where: { id } });
    if (!nucleo) throw new NotFoundException('Núcleo não encontrado');
    return nucleo;
  }

  async create(dto: CreateNucleoDto): Promise<Nucleo> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateNucleoDto): Promise<Nucleo> {
    const nucleo = await this.findOne(id);
    Object.assign(nucleo, dto);
    return this.repo.save(nucleo);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }
}
