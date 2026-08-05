import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { Usuario, TipoUsuario } from '../modules/usuarios/usuario.entity';
import { Beneficiario } from '../modules/beneficiarios/beneficiario.entity';
import { RefreshToken } from '../modules/usuarios/refresh-token.entity';
import { AppConfig } from '../config/configuration';
import { JwtPayload } from './jwt-payload.interface';
import { LoginEmailDto, LoginBeneficiarioDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Beneficiario)
    private readonly beneficiarioRepo: Repository<Beneficiario>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  async loginEmail(dto: LoginEmailDto, res: Response, meta: { ip: string; ua: string }) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: dto.email, ativo: true },
      select: { id: true, email: true, nomeCompleto: true, senhaHash: true, tipo: true, perfilId: true, entidadeId: true, ativo: true },
    });
    if (!usuario) throw new UnauthorizedException('Credenciais inválidas');

    const ok = await argon2.verify(usuario.senhaHash, dto.senha);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    const payload: JwtPayload = {
      sub: usuario.id,
      nome: usuario.nomeCompleto,
      email: usuario.email,
      tipo: usuario.tipo,
      perfilId: usuario.perfilId,
      entidadeId: usuario.entidadeId,
    };
    return this.emitirCookies(payload, res, meta);
  }

  async loginBeneficiario(dto: LoginBeneficiarioDto, res: Response, meta: { ip: string; ua: string }) {
    const beneficiario = await this.beneficiarioRepo.findOne({
      where: { matricula: dto.matricula },
      select: { id: true, matricula: true, nomeCompleto: true, dataNascimento: true, celular: true, deletedAt: true },
    });

    if (
      !beneficiario ||
      beneficiario.dataNascimento !== dto.dataNascimento ||
      beneficiario.celular !== dto.celular
    ) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: beneficiario.id,
      nome: beneficiario.nomeCompleto,
      email: '',
      tipo: TipoUsuario.BENEFICIARIO,
      perfilId: '',
      entidadeId: beneficiario.id,
    };
    return this.emitirCookies(payload, res, meta);
  }

  async refresh(payload: JwtPayload & { jti: string }, rawRefreshToken: string, res: Response, meta: { ip: string; ua: string }) {
    // Revogar o token atual (rotação obrigatória)
    const hash = createHash('sha256').update(rawRefreshToken).digest('hex');
    await this.refreshTokenRepo.update({ hash }, { revogado: true });

    return this.emitirCookies(payload, res, meta);
  }

  async logout(rawRefreshToken: string | undefined, res: Response) {
    if (rawRefreshToken) {
      const hash = createHash('sha256').update(rawRefreshToken).digest('hex');
      await this.refreshTokenRepo.update({ hash }, { revogado: true });
    }
    this.limparCookies(res);
    return { ok: true };
  }

  private async emitirCookies(
    payload: JwtPayload,
    res: Response,
    meta: { ip: string; ua: string },
  ) {
    const cfg = this.config.get<AppConfig['jwt']>('jwt')!;
    const cookieCfg = this.config.get<AppConfig['cookies']>('cookies')!;

    const accessToken = this.jwtService.sign(payload, {
      secret: cfg.accessSecret,
      expiresIn: cfg.accessTtl,
    });

    const jti = randomUUID();
    const refreshToken = this.jwtService.sign({ ...payload, jti }, {
      secret: cfg.refreshSecret,
      expiresIn: cfg.refreshTtl,
    });

    // Persistir hash do refresh token
    const rtTtlMs = this.parseTtlMs(cfg.refreshTtl);
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        usuarioId: payload.sub,
        hash,
        expiraEm: new Date(Date.now() + rtTtlMs),
        ipAddress: meta.ip,
        userAgent: meta.ua,
      }),
    );

    const cookieOpts = {
      httpOnly: true,
      secure: cookieCfg.seguro,
      sameSite: 'lax' as const,
      domain: cookieCfg.dominio,
      path: '/',
    };

    res.cookie('andorinha_at', accessToken, { ...cookieOpts, maxAge: this.parseTtlMs(cfg.accessTtl) });
    res.cookie('andorinha_rt', refreshToken, { ...cookieOpts, maxAge: rtTtlMs });
    // auth_type não é httpOnly — lido pelo proxy.ts do Next.js
    res.cookie('auth_type', payload.tipo, { secure: cookieCfg.seguro, sameSite: 'lax', domain: cookieCfg.dominio, path: '/' });

    return {
      id: payload.sub,
      nome: payload.nome,
      email: payload.email,
      tipo: payload.tipo,
      perfilId: payload.perfilId,
      entidadeId: payload.entidadeId,
    };
  }

  private limparCookies(res: Response) {
    ['andorinha_at', 'andorinha_rt', 'auth_type'].forEach((name) =>
      res.clearCookie(name, { path: '/' }),
    );
  }

  private parseTtlMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 15 * 60 * 1000;
    const n = parseInt(match[1], 10);
    const unit: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return n * (unit[match[2]] ?? 60_000);
  }
}
