import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(user: AuthUser) {
    return this.prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { email: user.email },
    });
  }

  updateMe(user: AuthUser, dto: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { email: user.email },
      data: dto,
    });
  }
}
