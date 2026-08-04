import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AppConfig } from '../config/configuration';

const MAGIC: Array<{ mime: string; ext: string; check: (b: Buffer) => boolean }> = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: 'png',
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    mime: 'application/pdf',
    ext: 'pdf',
    check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
];

function detectMime(buf: Buffer): string | null {
  return MAGIC.find((m) => m.check(buf))?.mime ?? null;
}

function mimeToExt(mime: string): string {
  return MAGIC.find((m) => m.mime === mime)?.ext ?? 'bin';
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly ttl: number;

  constructor(config: ConfigService<AppConfig>) {
    const r2 = config.get<AppConfig['storage']>('storage')!.r2;
    this.bucket = r2.bucket;
    this.ttl = r2.signedUrlTtl;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
    });
  }

  async upload(
    buffer: Buffer,
    allowedMimes: string[],
  ): Promise<{ key: string; mimeType: string }> {
    const mimeType = detectMime(buffer);
    if (!mimeType || !allowedMimes.includes(mimeType)) {
      throw new UnsupportedMediaTypeException(
        `Tipo de arquivo não permitido. Aceitos: ${allowedMimes.join(', ')}`,
      );
    }
    const key = `${randomUUID()}.${mimeToExt(mimeType)}`;
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType }),
    );
    return { key, mimeType };
  }

  async signedUrl(key: string, ttl?: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: ttl ?? this.ttl },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
