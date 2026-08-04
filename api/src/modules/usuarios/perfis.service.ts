import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Perfil } from './perfil.entity';
import { PerfilPermissao } from './perfil-permissao.entity';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { FilterPerfilDto } from './dto/filter-perfil.dto';

@Injectable()
export class PerfisService {
  constructor(
    @InjectRepository(Perfil)
    private readonly repo: Repository<Perfil>,
    @InjectRepository(PerfilPermissao)
    private readonly permissaoRepo: Repository<PerfilPermissao>,
  ) {}

  async findAll(f: FilterPerfilDto): Promise<Paginated<Perfil>> {
    const [data, total] = await this.repo.findAndCount({
      where: f.nome ? { nome: ILike(`%${f.nome}%`) } : {},
      relations: { permissoes: true },
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Perfil> {
    const p = await this.repo.findOne({ where: { id }, relations: { permissoes: true } });
    if (!p) throw new NotFoundException('Perfil não encontrado');
    return p;
  }

  async create(dto: CreatePerfilDto): Promise<Perfil> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdatePerfilDto): Promise<Perfil> {
    const p = await this.findOne(id);
    const { permissoes, ...rest } = dto;
    Object.assign(p, rest);
    if (permissoes) {
      await this.permissaoRepo.delete({ perfilId: id });
      p.permissoes = permissoes.map((pp) => this.permissaoRepo.create({ ...pp, perfilId: id }));
    }
    return this.repo.save(p);
  }

  async remove(id: string): Promise<void> {
    const p = await this.findOne(id);
    if (p.isSistema) throw new NotFoundException('Perfil de sistema não pode ser excluído');
    await this.repo.remove(p);
  }
}
