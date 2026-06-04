import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UpdateSettingsDto = {
  textProvider?: string;
  textModel?: string;
  imageProvider?: string;
  imageModel?: string;
};

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Upsert guarantees the singleton row exists even before the seed runs.
  get() {
    return this.prisma.appSettings.upsert({
      where: { id: SINGLETON_ID },
      create: {},
      update: {},
    });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.appSettings.upsert({
      where: { id: SINGLETON_ID },
      create: dto,
      update: dto,
    });
  }
}
