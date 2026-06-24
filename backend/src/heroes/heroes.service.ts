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
import { ImageGenerator, ImageCaptioner } from '../ai/contracts';
import { StorageService } from '../storage/storage.service';
import { resolveChildProfile } from '../ai/child-profile';
import { toDataUri } from '../ai/image-data-uri';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

const MAX_HEROES = 5; // 1 MAIN + up to 4 companions

export type AddCompanionDto = { role: HeroRole; name: string };
export type GenerateHeroDto = {
  style?: string;
  styleId?: string;
  description?: string;
};

@Injectable()
export class HeroesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coin: CoinService,
    private readonly imageGen: ImageGenerator,
    private readonly storage: StorageService,
    private readonly captioner: ImageCaptioner,
  ) {}

  async list(user: AuthUser, childId: string) {
    const child = await this.ownedChild(user, childId);
    await this.ensureMain(child.id, child.name);
    const heroes = await this.prisma.hero.findMany({
      where: { childId: child.id, deletedAt: null },
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
      where: { childId: child.id, deletedAt: null },
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
      // Charge failed — soft-delete the just-created hero (no hard delete).
      await this.prisma.hero.update({
        where: { id: hero.id },
        data: { deletedAt: new Date() },
      });
      throw err;
    }
    return hero;
  }

  async remove(user: AuthUser, id: string) {
    const hero = await this.ownedHero(user, id);
    if (hero.role === HeroRole.MAIN) {
      throw new ConflictException('Cannot delete the main hero');
    }
    // Soft delete: keep the row, hide it from reads.
    await this.prisma.hero.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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

    // Resolve the chosen style (StyleTemplate by id, else the free-text style).
    let style = dto.style ?? hero.style ?? undefined;
    if (dto.styleId) {
      const st = await this.prisma.styleTemplate.findFirst({
        where: { id: dto.styleId, isActive: true, deletedAt: null },
      });
      if (st) style = st.prompt;
    }
    const description = dto.description ?? hero.description ?? undefined;
    // A MAIN hero IS the child → disambiguate as a human child of the resolved
    // gender/age (fixes «Лев» → a boy). Companions keep their own nature.
    const profile = resolveChildProfile(hero.child);
    const childDescriptor =
      hero.role === HeroRole.MAIN ? profile.descriptor : null;
    try {
      const imageKey = await this.imageGen.generateImage({
        scene: buildHeroPrompt(hero.name, description, style),
        featuresChild: true,
        childDescriptor,
        photoUrl: null,
      });
      // Caption the generated portrait for later reuse (fail-open).
      const imageCaption = await this.captionImage(imageKey);
      const updated = await this.prisma.hero.update({
        where: { id },
        data: { imageKey, status: 'DONE', style, description, imageCaption },
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

  // Caption a stored portrait via the VL captioner. Fail-open: any error → null.
  private async captionImage(imageKey: string): Promise<string | null> {
    try {
      const dataUri = await toDataUri(this.storage, imageKey);
      if (!dataUri) return null;
      return await this.captioner.caption(dataUri);
    } catch {
      return null;
    }
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
      where: { id, deletedAt: null, child: { user: { email: user.email } } },
      include: { child: true },
    });
    if (!hero) throw new NotFoundException('Hero not found');
    return hero;
  }

  private async ensureMain(childId: string, childName: string) {
    const main = await this.prisma.hero.findFirst({
      where: { childId, role: 'MAIN', deletedAt: null },
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
    style ?? '',
    "Soft, warm children's book character art, plain background, head and shoulders.",
  ]
    .filter(Boolean)
    .join(' ');
}
