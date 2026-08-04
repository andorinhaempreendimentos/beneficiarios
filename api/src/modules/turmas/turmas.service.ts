import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Turma } from './turma.entity';
import { TurmaHorario } from './turma-horario.entity';
import { Atividade } from '../atividades/atividade.entity';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { FilterTurmaDto } from './dto/filter-turma.dto';
import { CreateTurmaHorarioDto } from './dto/create-turma.dto';

@Injectable()
export class TurmasService {
  constructor(
    @InjectRepository(Turma)
    private readonly repo: Repository<Turma>,
    @InjectRepository(TurmaHorario)
    private readonly horarioRepo: Repository<TurmaHorario>,
    @InjectRepository(Atividade)
    private readonly atividadeRepo: Repository<Atividade>,
  ) {}

  async findAll(f: FilterTurmaDto): Promise<Paginated<Turma>> {
    const where: FindOptionsWhere<Turma> = {};
    if (f.nome) where.nome = ILike(`%${f.nome}%`);
    if (f.atividadeId) where.atividadeId = f.atividadeId;
    if (f.nucleoId) where.nucleoId = f.nucleoId;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Turma> {
    const t = await this.repo.findOne({ where: { id }, relations: { horarios: true } });
    if (!t) throw new NotFoundException('Turma não encontrada');
    return t;
  }

  async create(dto: CreateTurmaDto): Promise<Turma> {
    const atividade = await this.atividadeRepo.findOne({ where: { id: dto.atividadeId } });
    if (!atividade) throw new NotFoundException('Atividade não encontrada');
    return this.repo.save(this.repo.create({ ...dto, nucleoId: atividade.nucleoId }));
  }

  async update(id: string, dto: UpdateTurmaDto): Promise<Turma> {
    const t = await this.findOne(id);
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }

  async upsertHorarios(id: string, dtos: CreateTurmaHorarioDto[]): Promise<TurmaHorario[]> {
    await this.findOne(id);
    await this.horarioRepo.delete({ turmaId: id });
    return this.horarioRepo.save(dtos.map((d) => this.horarioRepo.create({ ...d, turmaId: id })));
  }
}
