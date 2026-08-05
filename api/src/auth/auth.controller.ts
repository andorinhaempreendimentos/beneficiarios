import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginEmailDto, LoginBeneficiarioDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { JwtPayload } from './jwt-payload.interface';
import { RefreshPayload } from './strategies/jwt-refresh.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de admin/gestor/funcionário por email + senha' })
  loginEmail(
    @Body() dto: LoginEmailDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.loginEmail(dto, res, {
      ip: req.ip ?? '',
      ua: req.headers['user-agent'] ?? '',
    });
  }

  @Public()
  @Post('login/beneficiario')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login de beneficiário por matrícula + nascimento + celular' })
  loginBeneficiario(
    @Body() dto: LoginBeneficiarioDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.loginBeneficiario(dto, res, {
      ip: req.ip ?? '',
      ua: req.headers['user-agent'] ?? '',
    });
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotacionar refresh token' })
  refresh(
    @CurrentUser() payload: RefreshPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRt = (req.cookies as Record<string, string>)?.andorinha_rt;
    return this.authService.refresh(payload, rawRt, res, {
      ip: req.ip ?? '',
      ua: req.headers['user-agent'] ?? '',
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Retornar perfil do usuário autenticado' })
  me(@CurrentUser() user: JwtPayload) {
    return {
      id: user.sub,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      perfilId: user.perfilId,
      entidadeId: user.entidadeId,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revogar sessão e limpar cookies' })
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() _user: JwtPayload,
  ) {
    const rawRt = (req.cookies as Record<string, string>)?.andorinha_rt;
    return this.authService.logout(rawRt, res);
  }
}
