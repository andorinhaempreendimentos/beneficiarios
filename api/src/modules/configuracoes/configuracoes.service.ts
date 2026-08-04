import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracao } from './configuracao.entity';
import { UpsertConfiguracaoDto } from './dto/upsert-configuracao.dto';

@Injectable()
export class ConfiguracoesService {
  constructor(
    @InjectRepository(Configuracao)
    private readonly repo: Repository<Configuracao>,
  ) {}

  findAll(): Promise<Configuracao[]> {
    return this.repo.find({ order: { chave: 'ASC' } });
  }

  async findOne(chave: string): Promise<Configuracao> {
    const c = await this.repo.findOne({ where: { chave } });
    if (!c) throw new NotFoundException(`Configuração '${chave}' não encontrada`);
    return c;
  }

  async upsert(dto: UpsertConfiguracaoDto): Promise<Configuracao> {
    const existing = await this.repo.findOne({ where: { chave: dto.chave } });
    if (existing) {
      existing.valor = dto.valor;
      if (dto.descricao !== undefined) existing.descricao = dto.descricao;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create(dto));
  }

  async remove(chave: string): Promise<void> {
    const c = await this.findOne(chave);
    await this.repo.remove(c);
  }
}
