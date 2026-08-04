import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { ConfirmacaoAtividade } from './confirmacao-atividade.entity';
import { CreateComprovacaoDto } from './dto/create-comprovacao.dto';
import { FilterComprovacaoDto } from './dto/filter-comprovacao.dto';

@Injectable()
export class ComprovacoesService {
  constructor(
    @InjectRepository(ConfirmacaoAtividade)
    private readonly repo: Repository<ConfirmacaoAtividade>,
  ) {}

  async findAll(f: FilterComprovacaoDto): Promise<Paginated<ConfirmacaoAtividade>> {
    const where: FindOptionsWhere<ConfirmacaoAtividade> = {};
    if (f.turmaId) where.turmaId = f.turmaId;
    if (f.data) where.data = f.data;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async criar(dto: CreateComprovacaoDto, enviadoPor?: string): Promise<ConfirmacaoAtividade> {
    return this.repo.save(this.repo.create({ ...dto, enviadoPor: enviadoPor ?? null }));
  }
}
