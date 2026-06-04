import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import type { Env } from '../config/env.schema';

const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class StorageService {
  private readonly client: Client;
  private readonly bucket: string;
  private ensured = false;

  constructor(config: ConfigService<Env, true>) {
    const endpoint = new URL(config.get('MINIO_ENDPOINT', { infer: true }));
    this.client = new Client({
      endPoint: endpoint.hostname,
      port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 80),
      useSSL: endpoint.protocol === 'https:',
      accessKey: config.get('MINIO_ACCESS_KEY', { infer: true }),
      secretKey: config.get('MINIO_SECRET_KEY', { infer: true }),
    });
    this.bucket = config.get('MINIO_BUCKET', { infer: true });
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });
    return key;
  }

  getSignedUrl(key: string): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, SIGNED_URL_TTL_SECONDS);
  }

  /**
   * Stored values may be storage keys (our uploads) or already-absolute URLs
   * (external/stub images). Sign the former, pass the latter through.
   */
  async toUrl(value: string | null): Promise<string | null> {
    if (!value) return value;
    if (/^https?:\/\//.test(value)) return value;
    return this.getSignedUrl(value);
  }

  // Lazy so the app boots without MinIO; only generation/upload needs it.
  private async ensureBucket(): Promise<void> {
    if (this.ensured) return;
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket);
    }
    this.ensured = true;
  }
}
