import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Beneficiario } from './beneficiario.entity';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto';
import { FilterBeneficiarioDto } from './dto/filter-beneficiario.dto';

@Injectable()
export class BeneficiariosService {
  constructor(
    @InjectRepository(Beneficiario)
    private readonly repo: Repository<Beneficiario>,
  ) {}

  async findAll(f: FilterBeneficiarioDto): Promise<Paginated<Beneficiario>> {
    const where: FindOptionsWhere<Beneficiario> = {};
    if (f.nomeCompleto) where.nomeCompleto = ILike(`%${f.nomeCompleto}%`);
    if (f.matricula) where.matricula = f.matricula;
    if (f.sexo) where.sexo = f.sexo;
    if (f.municipio) where.municipio = ILike(`%${f.municipio}%`);
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nomeCompleto: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Beneficiario> {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Beneficiário não encontrado');
    return b;
  }

  async create(dto: CreateBeneficiarioDto): Promise<Beneficiario> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateBeneficiarioDto): Promise<Beneficiario> {
    const b = await this.findOne(id);
    Object.assign(b, dto);
    return this.repo.save(b);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }

  async updateFoto(id: string, key: string): Promise<Beneficiario> {
    const b = await this.findOne(id);
    b.fotoUrl = key;
    return this.repo.save(b);
  }
}
