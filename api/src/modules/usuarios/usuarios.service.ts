import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Usuario } from './usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async findAll(f: FilterUsuarioDto): Promise<Paginated<Usuario>> {
    const where: FindOptionsWhere<Usuario> = {};
    if (f.nomeCompleto) where.nomeCompleto = ILike(`%${f.nomeCompleto}%`);
    if (f.email) where.email = ILike(`%${f.email}%`);
    if (f.tipo) where.tipo = f.tipo;
    if (f.perfilId) where.perfilId = f.perfilId;
    const [data, total] = await this.repo.findAndCount({
      where,
      select: { id: true, email: true, nomeCompleto: true, tipo: true, ativo: true, perfilId: true, entidadeId: true, createdAt: true },
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      order: { nomeCompleto: 'ASC' },
    });
    return { data, total, page: f.page, limit: f.limit };
  }

  async findOne(id: string): Promise<Usuario> {
    const u = await this.repo.findOne({
      where: { id },
      select: { id: true, email: true, nomeCompleto: true, tipo: true, ativo: true, perfilId: true, entidadeId: true, createdAt: true },
    });
    if (!u) throw new NotFoundException('Usuário não encontrado');
    return u;
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const exists = await this.repo.findOne({ where: { email: dto.email }, select: { id: true } });
    if (exists) throw new ConflictException('E-mail já cadastrado');
    const senhaHash = await argon2.hash(dto.senha, { type: argon2.argon2id });
    const { senha, ...rest } = dto;
    return this.repo.save(this.repo.create({ ...rest, senhaHash }));
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Usuário não encontrado');
    if (dto.senha) {
      u.senhaHash = await argon2.hash(dto.senha, { type: argon2.argon2id });
    }
    const { senha, ...rest } = dto;
    Object.assign(u, rest);
    return this.repo.save(u);
  }

  async setAtivo(id: string, ativo: boolean): Promise<Usuario> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Usuário não encontrado');
    u.ativo = ativo;
    return this.repo.save(u);
  }
}
