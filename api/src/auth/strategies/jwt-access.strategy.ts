import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../jwt-payload.interface';
import { Usuario } from '../../modules/usuarios/usuario.entity';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    config: ConfigService<AppConfig>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies as Record<string, string>)?.andorinha_at ?? null,
      ]),
      secretOrKey: config.get<AppConfig['jwt']>('jwt')!.accessSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub, ativo: true },
      select: { id: true, ativo: true },
    });
    if (!usuario) throw new UnauthorizedException('Sessão inválida');
    return payload;
  }
}
