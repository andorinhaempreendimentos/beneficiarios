import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Objeto } from './objeto.entity';
import { CreateObjetoDto } from './dto/create-objeto.dto';
import { UpdateObjetoDto } from './dto/update-objeto.dto';
import { FilterObjetoDto } from './dto/filter-objeto.dto';

@Injectable()
export class ObjetosService {
  constructor(
    @InjectRepository(Objeto)
    private readonly repo: Repository<Objeto>,
  ) {}

  async findAll(f: FilterObjetoDto): Promise<Paginated<Objeto>> {
    const [data, total] = await this.repo.findAndCount({
      where: f.nome ? { nome: ILike(`%${f.nome}%`) } : {},
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Objeto> {
    const obj = await this.repo.findOne({ where: { id } });
    if (!obj) throw new NotFoundException('Objeto não encontrado');
    return obj;
  }

  async create(dto: CreateObjetoDto): Promise<Objeto> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateObjetoDto): Promise<Objeto> {
    const obj = await this.findOne(id);
    Object.assign(obj, dto);
    return this.repo.save(obj);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }
}
