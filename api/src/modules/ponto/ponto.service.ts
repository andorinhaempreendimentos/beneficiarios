import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { RegistroPonto } from './registro-ponto.entity';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { FilterPontoDto } from './dto/filter-ponto.dto';

const QR_TTL_MS = 15 * 60 * 1000; // 15 minutos
const qrStore = new Map<string, { hash: string; expiraEm: number }>();

@Injectable()
export class PontoService {
  constructor(
    @InjectRepository(RegistroPonto)
    private readonly repo: Repository<RegistroPonto>,
  ) {}

  async findAll(f: FilterPontoDto): Promise<Paginated<RegistroPonto>> {
    const where: FindOptionsWhere<RegistroPonto> = {};
    if (f.funcionarioId) where.funcionarioId = f.funcionarioId;
    if (f.data) where.data = f.data;
    if (f.tipo) where.tipo = f.tipo;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { data: 'DESC', hora: 'DESC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  /** Gera token de curta duração para QR Code de um turma/dia */
  gerarQr(turmaId: string): { token: string; expiraEm: string } {
    const token = randomBytes(24).toString('hex');
    const expiraEm = Date.now() + QR_TTL_MS;
    const hash = createHash('sha256').update(token).digest('hex');
    qrStore.set(turmaId, { hash, expiraEm });
    return { token, expiraEm: new Date(expiraEm).toISOString() };
  }

  async registrarViaPonto(dto: RegistrarPontoDto, token: string): Promise<RegistroPonto> {
    const hash = createHash('sha256').update(token).digest('hex');
    const hoje = new Date().toISOString().slice(0, 10);
    const hora = new Date().toISOString().slice(11, 19);

    const existente = await this.repo.findOne({
      where: { funcionarioId: dto.funcionarioId, data: hoje, tipo: dto.tipo },
      select: { id: true },
    });
    if (existente) throw new ConflictException('Ponto deste tipo já registrado hoje');

    return this.repo.save(
      this.repo.create({ ...dto, data: hoje, hora, tokenQrHash: hash }),
    );
  }

  async registrarManual(dto: RegistrarPontoDto): Promise<RegistroPonto> {
    const hoje = new Date().toISOString().slice(0, 10);
    const hora = new Date().toISOString().slice(11, 19);
    const existente = await this.repo.findOne({
      where: { funcionarioId: dto.funcionarioId, data: hoje, tipo: dto.tipo },
      select: { id: true },
    });
    if (existente) throw new ConflictException('Ponto deste tipo já registrado hoje');
    return this.repo.save(this.repo.create({ ...dto, data: hoje, hora }));
  }
}
