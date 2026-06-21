import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

type CreateChildDto = {
  name: string;
  birthDate?: string;
  gender?: string;
  interests?: string[];
  photoUrl?: string;
};

type UpdateChildDto = {
  name?: string;
  birthDate?: string;
  gender?: string;
  interests?: string[];
  photoUrl?: string;
};

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthUser) {
    return this.prisma.child.findMany({
      where: { user: { email: user.email } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(user: AuthUser, dto: CreateChildDto) {
    return this.prisma.child.create({
      data: {
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        gender: dto.gender,
        interests: dto.interests ?? [],
        photoUrl: dto.photoUrl,
        user: {
          connectOrCreate: {
            where: { email: user.email },
            create: { email: user.email },
          },
        },
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateChildDto) {
    const child = await this.prisma.child.findFirst({
      where: { id, user: { email: user.email } },
    });
    if (!child) throw new NotFoundException();
    return this.prisma.child.update({
      where: { id },
      data: {
        name: dto.name,
        gender: dto.gender,
        interests: dto.interests,
        photoUrl: dto.photoUrl,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const child = await this.prisma.child.findFirst({
      where: { id, user: { email: user.email } },
    });
    if (!child) throw new NotFoundException();
    await this.prisma.child.delete({ where: { id } }).catch((e) => {
      if (e?.code === 'P2003')
        throw new ConflictException('Child has books and cannot be deleted');
      throw e;
    });
  }
}
