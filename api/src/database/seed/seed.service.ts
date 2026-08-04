import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Perfil } from '../../modules/usuarios/perfil.entity';
import { PerfilPermissao } from '../../modules/usuarios/perfil-permissao.entity';
import { Usuario, TipoUsuario } from '../../modules/usuarios/usuario.entity';
import { AppConfig } from '../../config/configuration';

/** Permissões padrão do perfil Admin — acesso total */
const PERMISSOES_ADMIN: Array<{ modulo: string; acao: string }> = [
  { modulo: 'beneficiarios', acao: 'visualizar' },
  { modulo: 'beneficiarios', acao: 'criar' },
  { modulo: 'beneficiarios', acao: 'editar' },
  { modulo: 'beneficiarios', acao: 'excluir' },
  { modulo: 'funcionarios', acao: 'visualizar' },
  { modulo: 'funcionarios', acao: 'criar' },
  { modulo: 'funcionarios', acao: 'editar' },
  { modulo: 'funcionarios', acao: 'excluir' },
  { modulo: 'inscricoes', acao: 'visualizar' },
  { modulo: 'inscricoes', acao: 'aprovar' },
  { modulo: 'inscricoes', acao: 'recusar' },
  { modulo: 'presenca', acao: 'visualizar' },
  { modulo: 'presenca', acao: 'registrar' },
  { modulo: 'ponto', acao: 'visualizar' },
  { modulo: 'ponto', acao: 'registrar' },
  { modulo: 'turmas', acao: 'visualizar' },
  { modulo: 'turmas', acao: 'criar' },
  { modulo: 'turmas', acao: 'editar' },
  { modulo: 'turmas', acao: 'excluir' },
  { modulo: 'equipamentos', acao: 'visualizar' },
  { modulo: 'equipamentos', acao: 'criar' },
  { modulo: 'equipamentos', acao: 'editar' },
  { modulo: 'configuracoes', acao: 'visualizar' },
  { modulo: 'configuracoes', acao: 'editar' },
  { modulo: 'relatorios', acao: 'visualizar' },
  { modulo: 'usuarios', acao: 'visualizar' },
  { modulo: 'usuarios', acao: 'criar' },
  { modulo: 'usuarios', acao: 'editar' },
  { modulo: 'usuarios', acao: 'excluir' },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(PerfilPermissao)
    private readonly permissaoRepo: Repository<PerfilPermissao>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPerfilAdmin();
    await this.seedAdminUsuario();
  }

  private async seedPerfilAdmin(): Promise<void> {
    let perfil = await this.perfilRepo.findOne({ where: { nome: 'Administrador' } });

    if (!perfil) {
      perfil = this.perfilRepo.create({
        nome: 'Administrador',
        descricao: 'Perfil de administrador do sistema — acesso total',
        isSistema: true,
      });
      perfil = await this.perfilRepo.save(perfil);
      this.logger.log('Perfil Administrador criado');
    }

    // Upsert idempotente de permissões
    for (const { modulo, acao } of PERMISSOES_ADMIN) {
      const existe = await this.permissaoRepo.findOne({
        where: { perfilId: perfil.id, modulo, acao },
      });
      if (!existe) {
        await this.permissaoRepo.save(
          this.permissaoRepo.create({ perfilId: perfil.id, modulo, acao, permitido: true }),
        );
      }
    }
  }

  private async seedAdminUsuario(): Promise<void> {
    const email = this.config.get<AppConfig['seed']>('seed')?.adminEmail;
    const senha = this.config.get<AppConfig['seed']>('seed')?.adminSenha;
    const nome = this.config.get<AppConfig['seed']>('seed')?.adminNome ?? 'Administrador';

    if (!email || !senha) {
      this.logger.warn('ADMIN_EMAIL ou ADMIN_PASSWORD não definidos — seed de admin ignorado');
      return;
    }

    const jaExiste = await this.usuarioRepo.findOne({ where: { email } });
    if (jaExiste) return;

    const perfil = await this.perfilRepo.findOne({ where: { nome: 'Administrador' } });
    if (!perfil) return;

    const senhaHash = await argon2.hash(senha);
    await this.usuarioRepo.save(
      this.usuarioRepo.create({
        email,
        senhaHash,
        nomeCompleto: nome,
        tipo: TipoUsuario.ADMIN,
        perfilId: perfil.id,
      }),
    );
    this.logger.log(`Usuário admin criado: ${email}`);
  }
}
