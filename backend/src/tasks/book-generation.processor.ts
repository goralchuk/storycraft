import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { BookStatus, HeroRole, type Hero } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  TextGenerator,
  ImageGenerator,
  ConsistencyChecker,
  ImageContext,
  HeroBrief,
  PageLayoutSlot,
} from '../ai/contracts';
import { PdfService, PdfPage } from '../pdf/pdf.service';
import { resolveSlots } from '../pdf/slots';
import { resolveChildProfile } from '../ai/child-profile';
import { toDataUri } from '../ai/image-data-uri';
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

  // 8.5 — score a freshly generated child-facing illustration against the character
  // reference and regenerate it once if it scores below the pass bar. Fail-open:
  // any error keeps the original image and never fails the book.
  private async qualityControl(
    imageKey: string,
    ctx: ImageContext,
    referenceImage: string,
  ): Promise<string> {
    try {
      const pageImage = await toDataUri(this.storage, imageKey);
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

    // Observability (8.10): one log line per stage, plus a run summary / failure
    // line. `stage` mirrors the persisted stage so a failure names where it broke.
    const startedAt = Date.now();
    let stage = 'HEROES';
    let regens = 0;
    this.logger.log(`[${bookId}] generation started (${book.pageCount}p)`);

    try {
      // Stage 1 — heroes: load the main-character reference used to keep the child
      // recognizable across illustrations. This is the only hero-related work at
      // generation time, so it belongs to (and makes truthful) the HEROES stage.
      const heroes = await this.prisma.hero.findMany({
        where: { childId: book.child.id, deletedAt: null },
      });
      const mainHero = heroes.find((h) => h.role === HeroRole.MAIN) ?? null;
      const companions = heroes.filter((h) => h.role !== HeroRole.MAIN);
      const character = buildCharacter(mainHero);
      const referenceImage = await toDataUri(this.storage, mainHero?.imageKey ?? null);
      // Resolve the child's age/gender (with fallbacks) to disambiguate a human
      // child in the story and illustration prompts (fixes e.g. «Лев» → a boy).
      const profile = resolveChildProfile(book.child, book.template);
      // Style: per-book selection lands with the wizard (9.10); for now the first
      // active style. Page structure: the layout template for this book size.
      const style = await this.prisma.styleTemplate.findFirst({
        where: { isActive: true, deletedAt: null },
        orderBy: { sort: 'asc' },
      });
      const layoutTpl = await this.prisma.pageLayoutTemplate.findFirst({
        where: { pageCount: book.pageCount, isActive: true, deletedAt: null },
      });
      const pageLayout =
        (layoutTpl?.layout as unknown as PageLayoutSlot[] | undefined) ?? null;
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'HEROES', progress: 10 },
      });
      this.logger.log(`[${bookId}] HEROES (reference=${referenceImage ? 'yes' : 'no'})`);

      // Stage 2 — writing the story.
      stage = 'STORY';
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'STORY', progress: 15 },
      });
      this.logger.log(`[${bookId}] STORY`);
      const story = await this.textGen.generateText({
        childName: book.child.name,
        childInterests: book.child.interests,
        childDescriptor: profile.descriptor,
        age: profile.age,
        mainHero: mainHero ? toHeroBrief(mainHero) : null,
        companions: companions.map(toHeroBrief),
        stylePrompt: style?.prompt ?? null,
        pageLayout,
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

      // Page structure is template-driven: set each page's layout + whether the
      // child is shown from the layout template (overriding the model's choice).
      if (pageLayout?.length) {
        const slotByNum = new Map(pageLayout.map((s) => [s.pageNum, s]));
        for (const p of story.pages) {
          const slot = slotByNum.get(p.pageNum);
          if (slot) {
            p.layout = slot.layout;
            p.featuresChild = slot.cast === 'MAIN' || slot.cast === 'ALL';
          }
        }
      }


      // Stage 3 — drawing illustrations (widest band; progress 30→90%). Enter the
      // stage before the first image so a failure here is attributed to it. The
      // band is weighted by image-generating pages: TEXT_ONLY pages cost no image
      // work and don't move the bar, so progress tracks the expensive part.
      stage = 'ILLUSTRATIONS';
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'ILLUSTRATIONS', progress: 30 },
      });
      const imageTotal = story.pages.filter(
        (p) => p.layout !== 'TEXT_ONLY',
      ).length;
      this.logger.log(
        `[${bookId}] ILLUSTRATIONS (images=${imageTotal}/${story.pages.length})`,
      );
      let imageDone = 0;
      const pdfPages: PdfPage[] = [];
      for (const page of story.pages) {
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
            childDescriptor: page.featuresChild ? profile.descriptor : null,
            referenceImages:
              page.featuresChild && referenceImage ? [referenceImage] : [],
          };
          const original = await this.imageGen.generateImage(ctx);
          imageUrl = original;
          // QC child-facing pages against the reference; regenerate once if they drift.
          if (page.featuresChild && referenceImage) {
            imageUrl = await this.qualityControl(original, ctx, referenceImage);
            if (imageUrl !== original) regens += 1;
          }
        }

        // Update in place (no hard delete): upsert the page by (bookId, pageNum),
        // soft-delete any prior illustration, then create the fresh one.
        const pageRow = await this.prisma.bookPage.upsert({
          where: { bookId_pageNum: { bookId, pageNum: page.pageNum } },
          create: {
            bookId,
            pageNum: page.pageNum,
            text: page.text,
            layout: page.layout,
          },
          update: { text: page.text, layout: page.layout, deletedAt: null },
        });
        await this.prisma.illustration.updateMany({
          where: { bookPageId: pageRow.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        if (imageUrl) {
          await this.prisma.illustration.create({
            data: {
              bookPageId: pageRow.id,
              imageUrl,
              featuresChild: page.featuresChild,
              // Keep the tokenized scene description for debugging / regeneration.
              prompt: page.imageDescription || null,
            },
          });
        }

        if (needsImage) imageDone += 1;
        const frac = imageTotal === 0 ? 1 : imageDone / imageTotal;
        await this.prisma.book.update({
          where: { id: bookId },
          data: {
            stage: 'ILLUSTRATIONS',
            progress: 30 + Math.round(60 * frac),
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

      // A shorter re-run leaves stale pages beyond the new count — soft-delete them.
      await this.prisma.bookPage.updateMany({
        where: { bookId, pageNum: { gt: story.pages.length }, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      // Stage 4 — assembling the book.
      stage = 'ASSEMBLE';
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'ASSEMBLE', progress: 90 },
      });
      this.logger.log(`[${bookId}] ASSEMBLE`);

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

      this.logger.log(
        `[${bookId}] DONE in ${Date.now() - startedAt}ms ` +
          `(pages=${story.pages.length} images=${imageDone} regen=${regens})`,
      );
    } catch (err) {
      this.logger.error(
        `[${bookId}] FAILED at ${stage} in ${Date.now() - startedAt}ms: ${String(err)}`,
      );
      await this.markFailed(bookId);
      throw err; // let BullMQ record the failed job
    }
  }
}

// Summarize a hero for the story prompt (description + portrait caption + personality).
function toHeroBrief(hero: Hero): HeroBrief {
  return {
    role: hero.role,
    name: hero.name,
    description: hero.description,
    imageCaption: hero.imageCaption,
    personality: hero.personality,
  };
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
