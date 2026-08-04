import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configuration } from './config/configuration';

async function bootstrap() {
  const cfg = configuration();
  // abortOnError: false faz o erro propagar para o catch do bootstrap em vez
  // de ser engolido pelo ExceptionHandler interno do Nest.
  const app = await NestFactory.create(AppModule, { abortOnError: false });

  // ── Segurança ───────────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());

  // ── CORS ────────────────────────────────────────────────────
  // credentials: true é obrigatório para cookies httpOnly cross-origin
  app.enableCors({
    origin: cfg.cors.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Prefixo global ─────────────────────────────────────────
  // Todas as rotas ficam sob /api/v1/...
  // O health check é a exceção — fica em /health (sem prefixo) para
  // que a Hostinger consiga acessá-lo sem autenticação.
  app.setGlobalPrefix(cfg.app.prefixo, { exclude: ['health'] });

  // ── Validação automática de DTOs ───────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // remove campos não declarados no DTO
      forbidNonWhitelisted: true,
      transform: true,       // converte strings de query param para o tipo do DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger ────────────────────────────────────────────────
  // Disponível apenas fora de produção — ou proteger por auth antes do deploy
  if (!cfg.app.producao) {
    const doc = new DocumentBuilder()
      .setTitle('Andorinha API')
      .setDescription('API do sistema de gestão de beneficiários Andorinha')
      .setVersion('1.0')
      .addCookieAuth('andorinha_at')
      .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('api/docs', app, document);
  }

  // ── Start ──────────────────────────────────────────────────
  // PORT vem do process.env — a Hostinger injeta o valor correto em produção.
  // Em desenvolvimento usa o fallback da configuração (3001).
  await app.listen(cfg.app.porta, '0.0.0.0');
  console.log(`API rodando em http://localhost:${cfg.app.porta}/${cfg.app.prefixo}`);
  console.log(`Docs em http://localhost:${cfg.app.porta}/api/docs`);
}

const ERROS_DE_BANCO = [
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_DBACCESS_DENIED_ERROR',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNREFUSED',
];

/**
 * O NestJS embrulha o erro do driver, então o `code` do mysql2 pode estar
 * aninhado em `cause` ou nos erros agregados. Procura em profundidade.
 */
function acharCodigoDeBanco(erro: unknown, nivel = 0): string | undefined {
  if (nivel > 5 || erro === null || typeof erro !== 'object') return undefined;

  const alvo = erro as { code?: unknown; cause?: unknown; errors?: unknown };

  if (typeof alvo.code === 'string' && ERROS_DE_BANCO.includes(alvo.code)) {
    return alvo.code;
  }
  if (alvo.cause) {
    const achado = acharCodigoDeBanco(alvo.cause, nivel + 1);
    if (achado) return achado;
  }
  if (Array.isArray(alvo.errors)) {
    for (const filho of alvo.errors) {
      const achado = acharCodigoDeBanco(filho, nivel + 1);
      if (achado) return achado;
    }
  }
  return undefined;
}

bootstrap().catch((erro: unknown) => {
  const codigo = acharCodigoDeBanco(erro);

  if (codigo) {
    console.error(
      [
        '',
        '─────────────────────────────────────────────────────────',
        ` Falha ao conectar no MySQL  (${codigo})`,
        '─────────────────────────────────────────────────────────',
        ` host:  ${process.env.DB_HOST || '(vazio)'}`,
        ` base:  ${process.env.DB_NAME || '(vazio)'}`,
        ` user:  ${process.env.DB_USER || '(vazio)'}`,
        '',
        ' Verificar:',
        '  1. DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env',
        '  2. hPanel › Bancos de Dados › Remote MySQL — seu IP liberado',
        '  3. IP público atual: curl -s ifconfig.me',
        '─────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }

  console.error(erro);
  process.exit(1);
});
