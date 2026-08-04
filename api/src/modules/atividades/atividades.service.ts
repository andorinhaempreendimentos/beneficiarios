import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Atividade } from './atividade.entity';
import { AtividadePergunta } from './atividade-pergunta.entity';
import { AtividadeTurno } from './atividade-turno.entity';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { CreateAtividadePerguntaDto, CreateAtividadeTurnoDto } from './dto/create-atividade-sub.dto';

@Injectable()
export class AtividadesService {
  constructor(
    @InjectRepository(Atividade)
    private readonly repo: Repository<Atividade>,
    @InjectRepository(AtividadePergunta)
    private readonly perguntaRepo: Repository<AtividadePergunta>,
    @InjectRepository(AtividadeTurno)
    private readonly turnoRepo: Repository<AtividadeTurno>,
  ) {}

  async findAll(f: FilterAtividadeDto): Promise<Paginated<Atividade>> {
    const where: FindOptionsWhere<Atividade> = {};
    if (f.nome) where.nome = ILike(`%${f.nome}%`);
    if (f.nucleoId) where.nucleoId = f.nucleoId;
    if (f.tipoAprovacao) where.tipoAprovacao = f.tipoAprovacao;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nome: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Atividade> {
    const at = await this.repo.findOne({
      where: { id },
      relations: { perguntas: true, turnos: true },
    });
    if (!at) throw new NotFoundException('Atividade não encontrada');
    return at;
  }

  async create(dto: CreateAtividadeDto): Promise<Atividade> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateAtividadeDto): Promise<Atividade> {
    const at = await this.findOne(id);
    Object.assign(at, dto);
    return this.repo.save(at);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softRemove(await this.findOne(id));
  }

  async upsertPerguntas(id: string, dtos: CreateAtividadePerguntaDto[]): Promise<AtividadePergunta[]> {
    await this.findOne(id);
    await this.perguntaRepo.delete({ atividadeId: id });
    return this.perguntaRepo.save(dtos.map((d) => this.perguntaRepo.create({ ...d, atividadeId: id })));
  }

  async upsertTurnos(id: string, dtos: CreateAtividadeTurnoDto[]): Promise<AtividadeTurno[]> {
    await this.findOne(id);
    await this.turnoRepo.delete({ atividadeId: id });
    return this.turnoRepo.save(dtos.map((d) => this.turnoRepo.create({ ...d, atividadeId: id })));
  }
}
