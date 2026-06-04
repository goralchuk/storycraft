import { Injectable } from '@nestjs/common';
import { TemplateCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(filter: { category?: TemplateCategory; age?: string } = {}) {
    return this.prisma.template.findMany({
      where: {
        isActive: true,
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.age ? { ageRange: filter.age } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  get(id: string) {
    return this.prisma.template.findFirst({ where: { id, isActive: true } });
  }
}
