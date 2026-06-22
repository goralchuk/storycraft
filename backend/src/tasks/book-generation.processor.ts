import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import sharp from 'sharp';
import { BookStatus, HeroRole, type Hero } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  TextGenerator,
  ImageGenerator,
  ConsistencyChecker,
  ImageContext,
} from '../ai/contracts';
import { PdfService, PdfPage } from '../pdf/pdf.service';
import { resolveSlots } from '../pdf/slots';
import { StorageService } from '../storage/storage.service';
import { TasksService } from './tasks.service';
import { BOOK_GENERATION_QUEUE, BookGenerationJob } from './tasks.constants';

// 8.5 — VL quality control: child-facing pages scoring below this (1–10) against
// the character reference are regenerated once.
const QA_PASS = 7;

@Processor(BOOK_GENERATION_QUEUE)
export class BookGenerationProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(BookGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly textGen: TextGenerator,
    private readonly imageGen: ImageGenerator,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
    private readonly checker: ConsistencyChecker,
    private readonly tasks: TasksService,
  ) {
    super();
  }

  // Recover books orphaned in PROCESSING by a crash/restart: reset to PENDING and
  // re-enqueue so generation resumes (no book stays stuck). On a single instance,
  // any PROCESSING at startup has no live worker, so this is safe.
  async onModuleInit() {
    const orphaned = await this.prisma.book.findMany({
      where: { status: BookStatus.PROCESSING },
      select: { id: true },
    });
    if (orphaned.length === 0) return;
    await this.prisma.book.updateMany({
      where: { status: BookStatus.PROCESSING },
      data: { status: BookStatus.PENDING, stage: null, progress: 0 },
    });
    for (const b of orphaned) await this.tasks.enqueueBookGeneration(b.id);
    this.logger.log(`Requeued ${orphaned.length} orphaned PROCESSING book(s)`);
  }

  // Fetch a stored image and downscale it into a small base64 data URI. The image
  // provider / VL model cap the request body (~6 MB) and our images are large, so we
  // shrink to <=1024px JPEG. Used for both the character reference and QC scoring.
  // Any failure → null (callers fall back gracefully).
  private async toDataUri(imageKey: string): Promise<string | null> {
    try {
      const url = await this.storage.toUrl(imageKey);
      if (!url) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      const input = Buffer.from(await res.arrayBuffer());
      const out = await sharp(input)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      return `data:image/jpeg;base64,${out.toString('base64')}`;
    } catch (err) {
      this.logger.warn(`Data URI prep failed for ${imageKey}: ${String(err)}`);
      return null;
    }
  }

  // 8.5 — score a freshly generated child-facing illustration against the character
  // reference and regenerate it once if it scores below the pass bar. Fail-open:
  // any error keeps the original image and never fails the book.
  private async qualityControl(
    imageKey: string,
    ctx: ImageContext,
    referenceImage: string,
  ): Promise<string> {
    try {
      const pageImage = await this.toDataUri(imageKey);
      if (!pageImage) return imageKey;
      const score = await this.checker.score({ referenceImage, pageImage });
      this.logger.log(`QC page score ${score}/10 (pass ${QA_PASS})`);
      if (score >= QA_PASS) return imageKey;
      this.logger.log('QC below threshold — regenerating page image once');
      return await this.imageGen.generateImage(ctx);
    } catch (err) {
      this.logger.warn(`QC skipped: ${String(err)}`);
      return imageKey;
    }
  }

  // Mark a live book FAILED, keeping its last stage. No coin refund — the user can
  // retry for free or decline (refund) via the books endpoints.
  private async markFailed(bookId: string) {
    await this.prisma.book.updateMany({
      where: {
        id: bookId,
        status: { in: [BookStatus.PENDING, BookStatus.PROCESSING] },
      },
      data: { status: BookStatus.FAILED },
    });
  }

  async process(job: Job<BookGenerationJob>) {
    const { bookId } = job.data;
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { child: true, template: true, topic: true },
    });
    if (!book) return;

    // Claim the job: only a PENDING book is processed, atomically. A re-run on an
    // already processing/terminal book claims nothing and is a no-op. A FAILED book
    // is re-run only via an explicit retry, which first resets it to PENDING.
    const claimed = await this.prisma.book.updateMany({
      where: { id: bookId, status: BookStatus.PENDING },
      data: { status: BookStatus.PROCESSING, stage: 'HEROES', progress: 5 },
    });
    if (claimed.count === 0) return;

    if (!book.child) {
      // A submitted book always has a child; guard defensively against bad data.
      await this.markFailed(bookId);
      return;
    }

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
      // Main-character reference for consistent illustrations (8.3): the child's
      // MAIN hero appearance, applied to every page that depicts the child.
      const mainHero = await this.prisma.hero.findFirst({
        where: { childId: book.child.id, role: HeroRole.MAIN },
      });
      const character = buildCharacter(mainHero);
      const referenceImage = mainHero?.imageKey
        ? await this.toDataUri(mainHero.imageKey)
        : null;

      const total = story.pages.length;
      const pdfPages: PdfPage[] = [];
      for (const [i, page] of story.pages.entries()) {
        // TEXT_ONLY pages carry no illustration (and save an image generation).
        const needsImage = page.layout !== 'TEXT_ONLY';
        let imageUrl: string | null = null;
        if (needsImage) {
          // Illustrate from the dedicated scene description (fall back to page text).
          const scene = resolveSlots(
            page.imageDescription || page.text,
            story.slots,
          );
          const ctx: ImageContext = {
            scene,
            featuresChild: page.featuresChild,
            photoUrl: book.photoUrl,
            character: page.featuresChild ? character : null,
            referenceImage: page.featuresChild ? referenceImage : null,
          };
          imageUrl = await this.imageGen.generateImage(ctx);
          // QC child-facing pages against the reference; regenerate once if they drift.
          if (page.featuresChild && referenceImage) {
            imageUrl = await this.qualityControl(imageUrl, ctx, referenceImage);
          }
        }

        await this.prisma.bookPage.create({
          data: {
            bookId,
            pageNum: page.pageNum,
            text: page.text,
            layout: page.layout,
            // Only image layouts carry an illustration.
            ...(imageUrl
              ? {
                  illustrations: {
                    create: {
                      imageUrl,
                      featuresChild: page.featuresChild,
                      // Keep the tokenized scene description for debugging / regeneration.
                      prompt: page.imageDescription || null,
                    },
                  },
                }
              : {}),
          },
        });

        await this.prisma.book.update({
          where: { id: bookId },
          data: {
            stage: 'ILLUSTRATIONS',
            progress: 30 + Math.round((60 * (i + 1)) / total),
          },
        });

        // Slots are resolved here for the PDF; pages stay tokenized in the DB.
        // imageUrl is a storage key — sign it so the PDF builder can fetch the bytes.
        pdfPages.push({
          text: resolveSlots(page.text, story.slots),
          imageUrl: imageUrl ? await this.storage.toUrl(imageUrl) : null,
          layout: page.layout,
        });
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
      await this.markFailed(bookId);
      throw err; // let BullMQ record the failed job
    }
  }
}

// Compose the main-character appearance description from the MAIN hero.
// Returns null when there is nothing to condition on.
function buildCharacter(hero: Hero | null): string | null {
  if (!hero) return null;
  const parts = [
    hero.description?.trim(),
    hero.style?.trim() ? `стиль: ${hero.style.trim()}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}
