import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HeroRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoinService } from '../coin/coin.service';
import { ImageGenerator } from '../ai/contracts';
import { StorageService } from '../storage/storage.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

const MAX_HEROES = 5; // 1 MAIN + up to 4 companions

export type AddCompanionDto = { role: HeroRole; name: string };
export type GenerateHeroDto = { style?: string; description?: string };

@Injectable()
export class HeroesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coin: CoinService,
    private readonly imageGen: ImageGenerator,
    private readonly storage: StorageService,
  ) {}

  async list(user: AuthUser, childId: string) {
    const child = await this.ownedChild(user, childId);
    await this.ensureMain(child.id, child.name);
    const heroes = await this.prisma.hero.findMany({
      where: { childId: child.id },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
    return Promise.all(
      heroes.map(async (h) => ({
        ...h,
        imageUrl: await this.storage.toUrl(h.imageKey),
      })),
    );
  }

  // Add a paid companion: create first, then charge; roll back on insufficient funds.
  async addCompanion(user: AuthUser, childId: string, dto: AddCompanionDto) {
    const child = await this.ownedChild(user, childId);
    if (dto.role === HeroRole.MAIN) {
      throw new BadRequestException('Cannot add a second main hero');
    }
    const count = await this.prisma.hero.count({
      where: { childId: child.id },
    });
    if (count >= MAX_HEROES)
      throw new ConflictException('Hero limit reached (max 5)');

    const hero = await this.prisma.hero.create({
      data: { childId: child.id, role: dto.role, name: dto.name },
    });
    try {
      const amount = await this.coin.priceOf('COMPANION');
      await this.coin.debit(child.userId, amount, `Companion: ${dto.name}`);
    } catch (err) {
      await this.prisma.hero.delete({ where: { id: hero.id } });
      throw err;
    }
    return hero;
  }

  async remove(user: AuthUser, id: string) {
    const hero = await this.ownedHero(user, id);
    if (hero.role === HeroRole.MAIN) {
      throw new ConflictException('Cannot delete the main hero');
    }
    await this.prisma.hero.delete({ where: { id } });
  }

  // Metered generation: consume one free attempt atomically, then generate.
  // Refund the attempt if the image call fails. 402 when no attempts remain.
  async generate(user: AuthUser, id: string, dto: GenerateHeroDto) {
    const hero = await this.ownedHero(user, id);

    const consumed = await this.prisma.hero.updateMany({
      where: { id, freeAttempts: { gt: 0 } },
      data: { freeAttempts: { decrement: 1 }, status: 'GENERATING' },
    });
    if (consumed.count === 0) {
      throw new HttpException(
        'No free generations left — top up to continue',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const style = dto.style ?? hero.style ?? undefined;
    const description = dto.description ?? hero.description ?? undefined;
    try {
      const imageKey = await this.imageGen.generateImage({
        scene: buildHeroPrompt(hero.name, description, style),
        featuresChild: true,
        photoUrl: null,
      });
      const updated = await this.prisma.hero.update({
        where: { id },
        data: { imageKey, status: 'DONE', style, description },
      });
      return {
        ...updated,
        imageUrl: await this.storage.toUrl(updated.imageKey),
      };
    } catch (err) {
      await this.prisma.hero.update({
        where: { id },
        data: {
          freeAttempts: { increment: 1 },
          status: hero.imageKey ? 'DONE' : 'IDLE',
        },
      });
      throw err;
    }
  }

  async topup(user: AuthUser, id: string) {
    const hero = await this.ownedHero(user, id);
    const amount = await this.coin.priceOf('HERO_TOPUP');
    await this.coin.debit(
      hero.child.userId,
      amount,
      `Hero generations top-up: ${hero.name}`,
    );
    return this.prisma.hero.update({
      where: { id },
      data: { freeAttempts: { increment: 3 } },
    });
  }

  private async ownedChild(user: AuthUser, childId: string) {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, user: { email: user.email } },
    });
    if (!child) throw new NotFoundException('Child not found');
    return child;
  }

  private async ownedHero(user: AuthUser, id: string) {
    const hero = await this.prisma.hero.findFirst({
      where: { id, child: { user: { email: user.email } } },
      include: { child: true },
    });
    if (!hero) throw new NotFoundException('Hero not found');
    return hero;
  }

  private async ensureMain(childId: string, childName: string) {
    const main = await this.prisma.hero.findFirst({
      where: { childId, role: 'MAIN' },
    });
    if (!main) {
      await this.prisma.hero.create({
        data: { childId, role: 'MAIN', name: childName },
      });
    }
  }
}

function buildHeroPrompt(
  name: string,
  description?: string,
  style?: string,
): string {
  return [
    `A friendly character portrait of ${name}${description ? `, ${description}` : ''}.`,
    style ? `${style} style.` : '',
    "Soft, warm children's book character art, plain background, head and shoulders.",
  ]
    .filter(Boolean)
    .join(' ');
}
