import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookType, WritingStyle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { StorageService } from '../storage/storage.service';
import { CoinService } from '../coin/coin.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

export type CreateDraftDto = {
  bookType: BookType;
  templateId?: string;
};

export type UpdateDraftDto = {
  childId?: string;
  topicId?: string;
  pageCount?: number;
  promptText?: string;
  writingStyle?: WritingStyle;
  fear?: string;
  photoUrl?: string;
};

const DRAFT_INCLUDE = { template: true, child: true, topic: true } as const;

// Book length is a page tier (`pageCount` holds it until the field is renamed —
// see ROADMAP → Tech Debt). 12 is included; longer tiers cost a surcharge.
const PAGE_TIER_KEY: Record<number, string> = {
  16: 'PAGE_16',
  20: 'PAGE_20',
  24: 'PAGE_24',
};
const PAGE_TIERS = [12, 16, 20, 24];

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
    private readonly storage: StorageService,
    private readonly coin: CoinService,
  ) {}

  // Drafts are surfaced only via getDraft / the dashboard banner.
  list(user: AuthUser) {
    return this.prisma.book.findMany({
      where: {
        user: { email: user.email },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        deletedAt: null,
      },
      include: DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  getDraft(user: AuthUser) {
    return this.prisma.book.findFirst({
      where: { user: { email: user.email }, status: 'DRAFT', deletedAt: null },
      include: DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(user: AuthUser, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, user: { email: user.email }, deletedAt: null },
      include: {
        template: true,
        child: true,
        topic: true,
        pages: {
          where: { deletedAt: null },
          include: { illustrations: { where: { deletedAt: null } } },
          orderBy: { pageNum: 'asc' },
        },
      },
    });
    if (!book) throw new NotFoundException();

    // Resolve stored object keys (PDF, uploaded photos, images) to signed URLs.
    return {
      ...book,
      pdfUrl: await this.storage.toUrl(book.pdfUrl),
      photoUrl: await this.storage.toUrl(book.photoUrl),
      child: book.child
        ? {
            ...book.child,
            photoUrl: await this.storage.toUrl(book.child.photoUrl),
          }
        : null,
      pages: await Promise.all(
        book.pages.map(async (page) => ({
          ...page,
          illustrations: await Promise.all(
            page.illustrations.map(async (ill) => ({
              ...ill,
              imageUrl: await this.storage.toUrl(ill.imageUrl),
            })),
          ),
        })),
      ),
    };
  }

  // Pay-at-config: charge the book-type cost once and create the DRAFT. One
  // active draft per user — a repeat call resumes the existing draft for free.
  async createDraft(user: AuthUser, dto: CreateDraftDto) {
    const dbUser = await this.prisma.user.upsert({
      where: { email: user.email },
      create: { email: user.email },
      update: {},
    });

    const existing = await this.prisma.book.findFirst({
      where: { userId: dbUser.id, status: 'DRAFT', deletedAt: null },
      include: DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    const priceKey =
      dto.bookType === 'TEMPLATE' ? 'BOOK_TEMPLATE' : 'BOOK_UNIQUE';

    // Create first so the debit can reference the book id; roll back the draft
    // if the user cannot afford it (no orphan, no double charge).
    const book = await this.prisma.book.create({
      data: {
        bookType: dto.bookType,
        status: 'DRAFT',
        pageCount: 12, // included tier; surcharge applies to 16/20/24
        ...(dto.templateId
          ? { template: { connect: { id: dto.templateId } } }
          : {}),
        user: { connect: { id: dbUser.id } },
      },
    });

    try {
      const amount = await this.coin.priceOf(priceKey);
      await this.coin.debit(
        dbUser.id,
        amount,
        `Book (${dto.bookType.toLowerCase()})`,
        book.id,
      );
    } catch (err) {
      // Charge failed — soft-delete the just-created draft (no hard delete).
      await this.prisma.book.update({
        where: { id: book.id },
        data: { deletedAt: new Date() },
      });
      throw err;
    }

    return this.prisma.book.findUnique({
      where: { id: book.id },
      include: DRAFT_INCLUDE,
    });
  }

  // Save step-2 settings onto a draft. Never charges.
  async updateDraft(user: AuthUser, id: string, dto: UpdateDraftDto) {
    const book = await this.requireDraft(user, id);

    if (dto.pageCount !== undefined && !PAGE_TIERS.includes(dto.pageCount)) {
      throw new BadRequestException(
        `pageCount must be one of ${PAGE_TIERS.join(', ')}`,
      );
    }

    if (dto.childId) {
      const child = await this.prisma.child.findFirst({
        where: { id: dto.childId, user: { email: user.email } },
      });
      if (!child) throw new NotFoundException('Child not found');
    }

    return this.prisma.book.update({
      where: { id: book.id },
      data: {
        ...(dto.childId !== undefined ? { childId: dto.childId } : {}),
        ...(dto.topicId !== undefined ? { topicId: dto.topicId } : {}),
        ...(dto.pageCount !== undefined ? { pageCount: dto.pageCount } : {}),
        ...(dto.promptText !== undefined ? { promptText: dto.promptText } : {}),
        ...(dto.writingStyle !== undefined
          ? { writingStyle: dto.writingStyle }
          : {}),
        ...(dto.fear !== undefined ? { fear: dto.fear } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
      },
      include: DRAFT_INCLUDE,
    });
  }

  // Finalize a draft for generation. Charges the page-tier surcharge once (the
  // book-type cost was already paid at draft creation). Keeps the draft on 402.
  async submit(user: AuthUser, id: string) {
    const book = await this.requireDraft(user, id);
    if (!book.childId) {
      throw new BadRequestException('Select a child before generating');
    }

    const tierKey = PAGE_TIER_KEY[book.pageCount];
    if (tierKey) {
      const amount = await this.coin.priceOf(tierKey);
      await this.coin.debit(
        book.userId,
        amount,
        `Pages: ${book.pageCount}`,
        book.id,
      );
    }

    const updated = await this.prisma.book.update({
      where: { id: book.id },
      data: {
        status: 'PENDING',
        stage: null,
        progress: 0,
        // Inherit the child's questionnaire photo when none was supplied here.
        ...(book.photoUrl == null && book.child?.photoUrl
          ? { photoUrl: book.child.photoUrl }
          : {}),
      },
      include: DRAFT_INCLUDE,
    });

    await this.tasks.enqueueBookGeneration(book.id);
    return updated;
  }

  // Free retry of a failed book: reset to PENDING and re-enqueue (no charge —
  // the user already paid). Guarded so only a FAILED book is affected.
  async retry(user: AuthUser, id: string) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { email: user.email },
      select: { id: true },
    });
    const result = await this.prisma.book.updateMany({
      where: { id, userId: dbUser.id, status: 'FAILED', deletedAt: null },
      data: { status: 'PENDING', stage: null, progress: 0 },
    });
    if (result.count === 0) {
      throw new BadRequestException('Only a failed book can be retried');
    }
    await this.tasks.enqueueBookGeneration(id);
    return this.getOne(user, id);
  }

  // Decline a failed book: move to CANCELLED and refund the page-tier surcharge
  // once (the guarded FAILED→CANCELLED transition guarantees a single refund).
  async cancel(user: AuthUser, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, user: { email: user.email }, deletedAt: null },
    });
    if (!book) throw new NotFoundException();
    const result = await this.prisma.book.updateMany({
      where: { id, userId: book.userId, status: 'FAILED', deletedAt: null },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) {
      throw new BadRequestException('Only a failed book can be declined');
    }
    const tierKey = PAGE_TIER_KEY[book.pageCount];
    if (tierKey) {
      const amount = await this.coin.priceOf(tierKey);
      await this.coin.credit(
        book.userId,
        amount,
        `Refund: pages ${book.pageCount}`,
        book.id,
      );
    }
    return this.getOne(user, id);
  }

  private async requireDraft(user: AuthUser, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, user: { email: user.email }, deletedAt: null },
      include: { child: true },
    });
    if (!book) throw new NotFoundException();
    if (book.status !== 'DRAFT')
      throw new ConflictException('Book is not a draft');
    return book;
  }
}
