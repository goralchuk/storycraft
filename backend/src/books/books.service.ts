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

// Book length is measured in paragraphs (slider). `pageCount` is repurposed to
// hold this count until the field is renamed (see ROADMAP → Tech Debt).
const MIN_PARAGRAPHS = 5;
const MAX_PARAGRAPHS = 10;

function clampParagraphs(n?: number): number | undefined {
  if (n === undefined) return undefined;
  return Math.min(MAX_PARAGRAPHS, Math.max(MIN_PARAGRAPHS, Math.trunc(n)));
}

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
      where: { user: { email: user.email }, status: { not: 'DRAFT' } },
      include: DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  getDraft(user: AuthUser) {
    return this.prisma.book.findFirst({
      where: { user: { email: user.email }, status: 'DRAFT' },
      include: DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(user: AuthUser, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, user: { email: user.email } },
      include: {
        template: true,
        child: true,
        topic: true,
        pages: { include: { illustrations: true }, orderBy: { pageNum: 'asc' } },
      },
    });
    if (!book) throw new NotFoundException();

    // Resolve stored object keys (PDF, uploaded photos, images) to signed URLs.
    return {
      ...book,
      pdfUrl: await this.storage.toUrl(book.pdfUrl),
      photoUrl: await this.storage.toUrl(book.photoUrl),
      child: book.child
        ? { ...book.child, photoUrl: await this.storage.toUrl(book.child.photoUrl) }
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
      where: { userId: dbUser.id, status: 'DRAFT' },
      include: DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    const priceKey = dto.bookType === 'TEMPLATE' ? 'BOOK_TEMPLATE' : 'BOOK_UNIQUE';

    // Create first so the debit can reference the book id; roll back the draft
    // if the user cannot afford it (no orphan, no double charge).
    const book = await this.prisma.book.create({
      data: {
        bookType: dto.bookType,
        status: 'DRAFT',
        ...(dto.templateId ? { template: { connect: { id: dto.templateId } } } : {}),
        user: { connect: { id: dbUser.id } },
      },
    });

    try {
      const amount = await this.coin.priceOf(priceKey);
      await this.coin.debit(dbUser.id, amount, `Book (${dto.bookType.toLowerCase()})`, book.id);
    } catch (err) {
      await this.prisma.book.delete({ where: { id: book.id } });
      throw err;
    }

    return this.prisma.book.findUnique({ where: { id: book.id }, include: DRAFT_INCLUDE });
  }

  // Save step-2 settings onto a draft. Never charges.
  async updateDraft(user: AuthUser, id: string, dto: UpdateDraftDto) {
    const book = await this.requireDraft(user, id);

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
        ...(dto.pageCount !== undefined ? { pageCount: clampParagraphs(dto.pageCount) } : {}),
        ...(dto.promptText !== undefined ? { promptText: dto.promptText } : {}),
        ...(dto.writingStyle !== undefined ? { writingStyle: dto.writingStyle } : {}),
        ...(dto.fear !== undefined ? { fear: dto.fear } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
      },
      include: DRAFT_INCLUDE,
    });
  }

  // Finalize a draft for generation. Never re-charges.
  async submit(user: AuthUser, id: string) {
    const book = await this.requireDraft(user, id);
    if (!book.childId) {
      throw new BadRequestException('Select a child before generating');
    }

    const updated = await this.prisma.book.update({
      where: { id: book.id },
      data: {
        status: 'PENDING',
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

  private async requireDraft(user: AuthUser, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, user: { email: user.email } },
      include: { child: true },
    });
    if (!book) throw new NotFoundException();
    if (book.status !== 'DRAFT') throw new ConflictException('Book is not a draft');
    return book;
  }
}
