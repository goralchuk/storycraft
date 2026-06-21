import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BookStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TextGenerator, ImageGenerator } from '../ai/contracts';
import { PdfService, PdfPage } from '../pdf/pdf.service';
import { resolveSlots } from '../pdf/slots';
import { StorageService } from '../storage/storage.service';
import { CoinService } from '../coin/coin.service';
import { BOOK_GENERATION_QUEUE, BookGenerationJob } from './tasks.constants';

// Mirrors PAGE_TIER_KEY in books.service — the surcharge charged at submit and
// refunded here on failure. Tier 12 has no surcharge.
const PAGE_TIER_KEY: Record<number, string> = {
  16: 'PAGE_16',
  20: 'PAGE_20',
  24: 'PAGE_24',
};

@Processor(BOOK_GENERATION_QUEUE)
export class BookGenerationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textGen: TextGenerator,
    private readonly imageGen: ImageGenerator,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
    private readonly coin: CoinService,
  ) {
    super();
  }

  // Fail the book and refund its page-tier surcharge — exactly once per run. The
  // guarded transition only refunds when it actually flips a live book to FAILED,
  // so retries / re-failures of an already-terminal book don't double-refund.
  private async failAndRefund(book: { id: string; userId: string; pageCount: number }) {
    const failed = await this.prisma.book.updateMany({
      where: { id: book.id, status: { in: [BookStatus.PENDING, BookStatus.PROCESSING] } },
      data: { status: BookStatus.FAILED },
    });
    if (failed.count !== 1) return;

    const tierKey = PAGE_TIER_KEY[book.pageCount];
    if (!tierKey) return;
    const amount = await this.coin.priceOf(tierKey);
    await this.coin.credit(book.userId, amount, `Refund: pages ${book.pageCount}`, book.id);
  }

  async process(job: Job<BookGenerationJob>) {
    const { bookId } = job.data;
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { child: true, template: true, topic: true },
    });
    if (!book) return;
    if (!book.child) {
      // A submitted book always has a child; guard defensively against bad data.
      await this.failAndRefund(book);
      return;
    }

    // Stage 1 — preparing characters (heroes are pre-generated; brief marker).
    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.PROCESSING, stage: 'HEROES', progress: 5 },
    });

    try {
      // Stage 2 — writing the story.
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'STORY', progress: 15 },
      });
      const story = await this.textGen.generateText({
        childName: book.child.name,
        childInterests: book.child.interests,
        // UNIQUE books have no template; fall back to the user's own prompt.
        templateTitle: book.template?.title ?? 'A Personalized Story',
        templatePrompt:
          book.template?.prompt ??
          book.promptText ??
          "A heartwarming, personalized children's story.",
        topicLabel: book.topic?.label,
        promptText: book.promptText,
        writingStyle: book.writingStyle,
        fear: book.fear,
        pageCount: book.pageCount,
      });

      // Re-generate cleanly so re-runs are idempotent (cascades delete pages + illustrations).
      await this.prisma.bookPage.deleteMany({ where: { bookId } });

      // Stage 3 — drawing illustrations (widest band; per-image progress 30→90%).
      // Enter the stage before the first image so a failure here is attributed to it.
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'ILLUSTRATIONS', progress: 30 },
      });
      const total = story.pages.length;
      const pdfPages: PdfPage[] = [];
      for (const [i, page] of story.pages.entries()) {
        const imageUrl = await this.imageGen.generateImage({
          pageText: page.text,
          featuresChild: page.featuresChild,
          photoUrl: book.photoUrl,
        });

        await this.prisma.bookPage.create({
          data: {
            bookId,
            pageNum: page.pageNum,
            text: page.text,
            illustrations: {
              create: { imageUrl, featuresChild: page.featuresChild },
            },
          },
        });

        await this.prisma.book.update({
          where: { id: bookId },
          data: { stage: 'ILLUSTRATIONS', progress: 30 + Math.round((60 * (i + 1)) / total) },
        });

        // Slots are resolved here for the PDF; pages stay tokenized in the DB.
        pdfPages.push({ text: resolveSlots(page.text, story.slots), imageUrl });
      }

      // Stage 4 — assembling the book.
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'ASSEMBLE', progress: 90 },
      });

      const pdf = await this.pdf.generate({
        title: resolveSlots(story.title, story.slots),
        pages: pdfPages,
      });
      // Store the object key; GET /books/:id signs it on read.
      const pdfKey = await this.storage.upload(
        `books/${bookId}.pdf`,
        pdf,
        'application/pdf',
      );

      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          title: story.title,
          slots: story.slots,
          pdfUrl: pdfKey,
          status: BookStatus.DONE,
          progress: 100,
        },
      });

      // Completing a book refreshes free hero generations for that child.
      if (book.childId) {
        await this.prisma.hero.updateMany({
          where: { childId: book.childId },
          data: { freeAttempts: 3 },
        });
      }
    } catch (err) {
      await this.failAndRefund(book);
      throw err; // let BullMQ record the failed job (and retry if configured)
    }
  }
}
