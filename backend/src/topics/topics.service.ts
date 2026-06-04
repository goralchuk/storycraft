import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.topic.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  get(id: string) {
    return this.prisma.topic.findFirst({ where: { id, isActive: true } });
  }
}
