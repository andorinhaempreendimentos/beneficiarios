import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSAO_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PerfilPermissao } from '../../modules/usuarios/perfil-permissao.entity';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { Request } from 'express';

@Injectable()
export class PermissaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(PerfilPermissao)
    private readonly permissaoRepo: Repository<PerfilPermissao>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const permissao = this.reflector.getAllAndOverride<{ modulo: string; acao: string } | undefined>(
      PERMISSAO_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!permissao) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = req.user;
    if (!user) return false;

    const ok = await this.permissaoRepo.findOne({
      where: { perfilId: user.perfilId, modulo: permissao.modulo, acao: permissao.acao, permitido: true },
      select: { id: true },
    });

    if (!ok) throw new ForbiddenException('Sem permissão para esta operação');
    return true;
  }
}
