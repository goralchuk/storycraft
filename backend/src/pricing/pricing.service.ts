import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { Env } from '../config/env.schema';

const CACHE_KEY = 'pricing:active';

@Injectable()
export class PricingService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', { infer: true }),
      port: config.get('REDIS_PORT', { infer: true }),
      maxRetriesPerRequest: null,
    });
  }

  onModuleDestroy() {
    return this.redis.quit();
  }

  // Active catalog, served from Redis; on a miss read DB and populate the cache.
  async list() {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const items = await this.prisma.priceItem.findMany({
      where: { active: true },
      orderBy: { key: 'asc' },
    });
    await this.redis.set(CACHE_KEY, JSON.stringify(items));
    return items;
  }

  // Update a price amount and invalidate the cache so the next read reflects it.
  async update(key: string, amount: number) {
    const exists = await this.prisma.priceItem.findUnique({ where: { key } });
    if (!exists) throw new NotFoundException(`Price not found: ${key}`);

    const updated = await this.prisma.priceItem.update({
      where: { key },
      data: { amount },
    });
    await this.redis.del(CACHE_KEY);
    return updated;
  }
}
