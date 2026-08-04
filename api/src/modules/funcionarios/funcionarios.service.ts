import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Funcionario } from './funcionario.entity';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FilterFuncionarioDto } from './dto/filter-funcionario.dto';

@Injectable()
export class FuncionariosService {
  constructor(
    @InjectRepository(Funcionario)
    private readonly repo: Repository<Funcionario>,
  ) {}

  async findAll(f: FilterFuncionarioDto): Promise<Paginated<Funcionario>> {
    const where: FindOptionsWhere<Funcionario> = {};
    if (f.nomeCompleto) where.nomeCompleto = ILike(`%${f.nomeCompleto}%`);
    if (f.matricula) where.matricula = f.matricula;
    if (f.cargo) where.cargo = f.cargo;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nomeCompleto: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Funcionario> {
    const f = await this.repo.findOne({ where: { id } });
    if (!f) throw new NotFoundException('Funcionário não encontrado');
    return f;
  }

  async create(dto: CreateFuncionarioDto): Promise<Funcionario> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateFuncionarioDto): Promise<Funcionario> {
    const fn = await this.findOne(id);
    Object.assign(fn, dto);
    return this.repo.save(fn);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }

  async updateFoto(id: string, key: string): Promise<Funcionario> {
    const fn = await this.findOne(id);
    fn.fotoUrl = key;
    return this.repo.save(fn);
  }
}
