import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  get(id: string) {
    return this.prisma.template.findFirst({ where: { id, isActive: true } });
  }
}
