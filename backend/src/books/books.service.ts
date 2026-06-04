import { Injectable, NotFoundException } from '@nestjs/common';
import { WritingStyle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { StorageService } from '../storage/storage.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

export type CreateBookDto = {
  templateId: string;
  childId: string;
  topicId?: string;
  pageCount?: number;
  promptText?: string;
  writingStyle?: WritingStyle;
  fear?: string;
  photoUrl?: string;
};

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
    private readonly storage: StorageService,
  ) {}

  list(user: AuthUser) {
    return this.prisma.book.findMany({
      where: { user: { email: user.email } },
      include: { template: true, child: true, topic: true },
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
      child: { ...book.child, photoUrl: await this.storage.toUrl(book.child.photoUrl) },
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

  async create(user: AuthUser, dto: CreateBookDto) {
    const child = await this.prisma.child.findFirst({
      where: { id: dto.childId, user: { email: user.email } },
    });
    if (!child) throw new NotFoundException('Child not found');

    const book = await this.prisma.book.create({
      data: {
        template: { connect: { id: dto.templateId } },
        child: { connect: { id: dto.childId } },
        ...(dto.topicId ? { topic: { connect: { id: dto.topicId } } } : {}),
        pageCount: dto.pageCount,
        promptText: dto.promptText,
        writingStyle: dto.writingStyle,
        fear: dto.fear,
        // Fall back to the child's questionnaire photo when none is supplied for this book.
        photoUrl: dto.photoUrl ?? child.photoUrl,
        user: {
          connectOrCreate: {
            where: { email: user.email },
            create: { email: user.email },
          },
        },
      },
      include: { template: true, child: true, topic: true },
    });

    await this.tasks.enqueueBookGeneration(book.id);
    return book;
  }
}
