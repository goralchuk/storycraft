import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StylesService {
  constructor(private readonly prisma: PrismaService) {}

  // Active book styles for the wizard's style picker (chosen before heroes).
  list() {
    return this.prisma.styleTemplate.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sort: 'asc' },
    });
  }
}
