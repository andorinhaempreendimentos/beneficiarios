import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { JwtPayload } from '../jwt-payload.interface';
import { RefreshToken } from '../../modules/usuarios/refresh-token.entity';
import { AppConfig } from '../../config/configuration';
import { createHash } from 'crypto';

export interface RefreshPayload extends JwtPayload {
  jti: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService<AppConfig>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies as Record<string, string>)?.andorinha_rt ?? null,
      ]),
      secretOrKey: config.get<AppConfig['jwt']>('jwt')!.refreshSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshPayload): Promise<RefreshPayload> {
    const rawToken = (req?.cookies as Record<string, string>)?.andorinha_rt;
    if (!rawToken) throw new UnauthorizedException();

    const hash = createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.refreshTokenRepo.findOne({ where: { hash, revogado: false } });

    if (!stored || stored.expiraEm < new Date()) throw new UnauthorizedException('Sessão expirada');
    return payload;
  }
}
