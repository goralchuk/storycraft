import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthUser) {
    return this.prisma.book.findMany({
      where: { user: { email: user.email } },
      include: { template: true, child: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(user: AuthUser, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, user: { email: user.email } },
      include: {
        template: true,
        child: true,
        pages: { include: { illustrations: true }, orderBy: { pageNum: 'asc' } },
      },
    });
    if (!book) throw new NotFoundException();
    return book;
  }

  async create(user: AuthUser, dto: { templateId: string; childId: string }) {
    const child = await this.prisma.child.findFirst({
      where: { id: dto.childId, user: { email: user.email } },
    });
    if (!child) throw new NotFoundException('Child not found');

    return this.prisma.book.create({
      data: {
        template: { connect: { id: dto.templateId } },
        child: { connect: { id: dto.childId } },
        user: {
          connectOrCreate: {
            where: { email: user.email },
            create: { email: user.email },
          },
        },
      },
      include: { template: true, child: true },
    });
  }
}
