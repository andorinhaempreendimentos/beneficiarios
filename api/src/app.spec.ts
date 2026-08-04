import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration } from './config/configuration';

/**
 * Valida a camada HTTP sem depender de um MySQL real: o DataSource é
 * substituído por um dublê, então o teste roda em qualquer ambiente
 * (inclusive no build da Hostinger, se algum dia rodar testes lá).
 */
describe('AppController (e2e)', () => {
  let app: INestApplication;
  let queryMock: jest.Mock;

  const criarApp = async (query: jest.Mock) => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDataSourceToken(), useValue: { query } as unknown as DataSource },
      ],
    }).compile();

    const nestApp = moduleRef.createNestApplication();
    const cfg = configuration();
    nestApp.setGlobalPrefix(cfg.app.prefixo, { exclude: ['health'] });
    nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await nestApp.init();
    return nestApp;
  };

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /health responde ok quando o banco responde', async () => {
    queryMock = jest.fn().mockResolvedValue([{ 1: 1 }]);
    app = await criarApp(queryMock);

    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(queryMock).toHaveBeenCalledWith('SELECT 1');
  });

  it('GET /health reporta degraded quando o banco falha', async () => {
    queryMock = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    app = await criarApp(queryMock);

    // Ainda responde 200 — o processo está vivo, só o banco está fora.
    // Derrubar o health check inteiro faria a Hostinger reiniciar em loop.
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toBe('unavailable');
  });

  it('health fica fora do prefixo global da API', async () => {
    queryMock = jest.fn().mockResolvedValue([{ 1: 1 }]);
    app = await criarApp(queryMock);

    // /health responde, /api/v1/health não existe
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });
});
