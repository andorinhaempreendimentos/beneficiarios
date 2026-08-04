import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from './app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const doc = new DocumentBuilder()
    .setTitle('Andorinha API')
    .setDescription('API do sistema de gestão de beneficiários Andorinha')
    .setVersion('1.0')
    .addCookieAuth('andorinha_at')
    .build();

  const document = SwaggerModule.createDocument(app, doc);

  const outDir = resolve(__dirname, '../../shared');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf8');

  console.log(`openapi.json gerado em ${outPath}`);
  await app.close();
}

generate().catch((e) => { console.error(e); process.exit(1); });
