import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { CategoriaTurma } from './categoria-turma.entity';
import { CreateCategoriaTurmaDto } from './dto/create-categoria-turma.dto';
import { UpdateCategoriaTurmaDto } from './dto/update-categoria-turma.dto';

@Injectable()
export class CategoriaTurmasService {
  constructor(
    @InjectRepository(CategoriaTurma)
    private readonly repo: Repository<CategoriaTurma>,
  ) {}

  async findAll(p?: {
    page?: number;
    limit?: number;
    nome?: string;
  }): Promise<Paginated<CategoriaTurma>> {
    const page = p?.page ?? 1;
    const limit = p?.limit ?? 50;
    const where: Record<string, unknown> = {};
    if (p?.nome) where.nome = ILike(`%${p.nome}%`);
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { idadeMinima: 'ASC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<CategoriaTurma> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }

  async create(dto: CreateCategoriaTurmaDto): Promise<CategoriaTurma> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(
    id: string,
    dto: UpdateCategoriaTurmaDto,
  ): Promise<CategoriaTurma> {
    const cat = await this.findOne(id);
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.findOne(id);
    await this.repo.remove(cat);
  }
}
