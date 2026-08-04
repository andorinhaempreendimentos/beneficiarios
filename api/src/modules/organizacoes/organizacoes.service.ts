import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Organizacao } from './organizacao.entity';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';
import { FilterOrganizacaoDto } from './dto/filter-organizacao.dto';

@Injectable()
export class OrganizacoesService {
  constructor(
    @InjectRepository(Organizacao)
    private readonly repo: Repository<Organizacao>,
  ) {}

  async findAll(f: FilterOrganizacaoDto): Promise<Paginated<Organizacao>> {
    const where: FindOptionsWhere<Organizacao> = {};
    if (f.nome) where.nome = ILike(`%${f.nome}%`);
    if (f.objetoId) where.objetoId = f.objetoId;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Organizacao> {
    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organização não encontrada');
    return org;
  }

  async create(dto: CreateOrganizacaoDto): Promise<Organizacao> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateOrganizacaoDto): Promise<Organizacao> {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    return this.repo.save(org);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }
}
