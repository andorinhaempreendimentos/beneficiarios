import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Inscricao, StatusInscricao } from './inscricao.entity';
import { BeneficiarioTurma, StatusMatricula } from '../beneficiarios/beneficiario-turma.entity';
import { Turma } from '../turmas/turma.entity';
import { TipoAprovacaoInscricao } from '../atividades/atividade.entity';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { FilterInscricaoDto } from './dto/filter-inscricao.dto';

const RESERVA_TTL_MINUTOS = 2880; // 48h

@Injectable()
export class InscricoesService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly repo: Repository<Inscricao>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async findAll(f: FilterInscricaoDto): Promise<Paginated<Inscricao>> {
    const where: FindOptionsWhere<Inscricao> = {};
    if (f.turmaId) where.turmaId = f.turmaId;
    if (f.beneficiarioId) where.beneficiarioId = f.beneficiarioId;
    if (f.status) where.status = f.status;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Inscricao> {
    const i = await this.repo.findOne({ where: { id } });
    if (!i) throw new NotFoundException('Inscrição não encontrada');
    return i;
  }

  async inscrever(dto: CreateInscricaoDto): Promise<Inscricao> {
    return this.ds.transaction(async (em) => {
      // SELECT FOR UPDATE na turma — evita race condition de vagas
      const turma = await em
        .createQueryBuilder(Turma, 't')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('t.atividade', 'a')
        .where('t.id = :id', { id: dto.turmaId })
        .getOne();

      if (!turma) throw new NotFoundException('Turma não encontrada');

      // Contar ocupações ativas (matriculados + reservados)
      const ocupadas = await em.count(BeneficiarioTurma, {
        where: {
          turmaId: dto.turmaId,
          status: In([StatusMatricula.ATIVO]),
        },
      });
      const reservadas = await em.count(Inscricao, {
        where: {
          turmaId: dto.turmaId,
          status: In([StatusInscricao.PENDENTE, StatusInscricao.RESERVADA]),
        },
      });

      if (ocupadas + reservadas >= turma.vagasTotais) {
        throw new ConflictException('Sem vagas disponíveis nesta turma');
      }

      const automatica = turma.atividade.tipoAprovacao === TipoAprovacaoInscricao.AUTOMATICA;
      const expiraEm = automatica
        ? null
        : new Date(Date.now() + RESERVA_TTL_MINUTOS * 60_000);

      const inscricao = em.create(Inscricao, {
        ...dto,
        status: automatica ? StatusInscricao.APROVADA : StatusInscricao.PENDENTE,
        expiraEm,
      });
      const salva = await em.save(inscricao);

      if (automatica) {
        await em.save(
          em.create(BeneficiarioTurma, {
            beneficiarioId: dto.beneficiarioId,
            turmaId: dto.turmaId,
            dataMatricula: new Date().toISOString().slice(0, 10),
          }),
        );
      }

      return salva;
    });
  }

  async aprovar(id: string): Promise<Inscricao> {
    return this.ds.transaction(async (em) => {
      const inscricao = await em.findOne(Inscricao, { where: { id } });
      if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
      if (inscricao.status !== StatusInscricao.PENDENTE && inscricao.status !== StatusInscricao.RESERVADA) {
        throw new BadRequestException(`Não é possível aprovar inscrição com status "${inscricao.status}"`);
      }
      inscricao.status = StatusInscricao.APROVADA;
      inscricao.expiraEm = null;
      await em.save(inscricao);
      await em.save(
        em.create(BeneficiarioTurma, {
          beneficiarioId: inscricao.beneficiarioId,
          turmaId: inscricao.turmaId,
          dataMatricula: new Date().toISOString().slice(0, 10),
        }),
      );
      return inscricao;
    });
  }

  async recusar(id: string, observacoes?: string): Promise<Inscricao> {
    const inscricao = await this.findOne(id);
    if (![StatusInscricao.PENDENTE, StatusInscricao.RESERVADA].includes(inscricao.status)) {
      throw new BadRequestException(`Não é possível recusar inscrição com status "${inscricao.status}"`);
    }
    inscricao.status = StatusInscricao.RECUSADA;
    if (observacoes) inscricao.observacoes = observacoes;
    return this.repo.save(inscricao);
  }

  async cancelar(id: string): Promise<Inscricao> {
    const inscricao = await this.findOne(id);
    if ([StatusInscricao.RECUSADA, StatusInscricao.EXPIRADA, StatusInscricao.CANCELADA].includes(inscricao.status)) {
      throw new BadRequestException(`Inscrição já está com status "${inscricao.status}"`);
    }
    inscricao.status = StatusInscricao.CANCELADA;
    return this.repo.save(inscricao);
  }
}
