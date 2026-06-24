import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  BookStatus,
  GenerationStatus,
  HeroRole,
  Prisma,
  type Hero,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  TextGenerator,
  ImageGenerator,
  ConsistencyChecker,
  ImageContext,
  StoryContext,
  HeroBrief,
  PageLayoutSlot,
} from '../ai/contracts';
import { PdfService, PdfPage } from '../pdf/pdf.service';
import { resolveSlots } from '../pdf/slots';
import { resolveChildProfile } from '../ai/child-profile';
import { buildStoryPrompt } from '../ai/story-prompt';
import { toDataUri } from '../ai/image-data-uri';
import { StorageService } from '../storage/storage.service';
import { TasksService } from './tasks.service';
import { BOOK_GENERATION_QUEUE, BookGenerationJob } from './tasks.constants';

// 8.5 — VL quality control: child-facing pages scoring below this (1–10) against
// the character reference are regenerated once.
const QA_PASS = 7;

// 9.8 — bound throughput so concurrent users don't overwhelm the provider/us.
// Tunable via env; sane defaults for a single dev instance.
const GEN_CONCURRENCY = Number(process.env.GEN_CONCURRENCY ?? 3);
const GEN_RATE_MAX = Number(process.env.GEN_RATE_MAX ?? 30);
const GEN_RATE_DURATION_MS = Number(process.env.GEN_RATE_DURATION_MS ?? 60000);

@Processor(BOOK_GENERATION_QUEUE, {
  concurrency: GEN_CONCURRENCY,
  limiter: { max: GEN_RATE_MAX, duration: GEN_RATE_DURATION_MS },
})
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
    this.logger.log(
      `worker concurrency=${GEN_CONCURRENCY}, rate-limit=${GEN_RATE_MAX}/${GEN_RATE_DURATION_MS}ms`,
    );
    // Close any BookGeneration left PROCESSING by a crash/restart.
    await this.prisma.bookGeneration.updateMany({
      where: { status: GenerationStatus.PROCESSING },
      data: {
        status: GenerationStatus.FAILED,
        error: 'orphaned (worker restart)',
        finishedAt: new Date(),
      },
    });
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

  // Advance the orchestration record and append a step to its log (9.7).
  private async logStep(
    generationId: string,
    step: string,
    progress: number,
    message: string,
  ) {
    await this.prisma.bookGeneration.update({
      where: { id: generationId },
      data: { currentStep: step, progress },
    });
    await this.prisma.bookGenerationLog.create({
      data: { generationId, step, message },
    });
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

    // Orchestration record for this run (9.7): durable state + step log + history.
    const gen = await this.prisma.bookGeneration.create({
      data: {
        bookId,
        status: GenerationStatus.PROCESSING,
        currentStep: 'HEROES',
        progress: 5,
        startedAt: new Date(),
      },
    });

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
      // Companion portraits (downscaled) for pages where companions appear (9.9).
      const companionRefs = (
        await Promise.all(
          companions.map((c) => toDataUri(this.storage, c.imageKey)),
        )
      ).filter((x): x is string => x !== null);
      // Resolve the child's age/gender (with fallbacks) to disambiguate a human
      // child in the story and illustration prompts (fixes e.g. «Лев» → a boy).
      const profile = resolveChildProfile(book.child, book.template);
      // Style: per-book selection lands with the wizard (9.10); for now the first
      // active style. Page structure: the layout template for this book size.
      const style = book.styleTemplateId
        ? await this.prisma.styleTemplate.findFirst({
            where: { id: book.styleTemplateId, deletedAt: null },
          })
        : await this.prisma.styleTemplate.findFirst({
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
      await this.logStep(
        gen.id,
        'HEROES',
        10,
        `reference=${referenceImage ? 'yes' : 'no'}, companions=${companions.length}`,
      );
      this.logger.log(`[${bookId}] HEROES (reference=${referenceImage ? 'yes' : 'no'})`);

      // Stage 2 — writing the story.
      stage = 'STORY';
      await this.prisma.book.update({
        where: { id: bookId },
        data: { stage: 'STORY', progress: 15 },
      });
      await this.logStep(gen.id, 'STORY', 15, 'writing story');
      this.logger.log(`[${bookId}] STORY`);
      const storyCtx: StoryContext = {
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
      };
      const story = await this.textGen.generateText(storyCtx);

      // Page structure is template-driven: set each page's layout + whether the
      // child is shown from the layout template (overriding the model's choice).
      const slotByNum = new Map(
        (pageLayout ?? []).map((s) => [s.pageNum, s] as const),
      );
      for (const p of story.pages) {
        const slot = slotByNum.get(p.pageNum);
        if (slot) {
          p.layout = slot.layout;
          p.featuresChild = slot.cast === 'MAIN' || slot.cast === 'ALL';
        }
      }
      // Short plot/title for cross-page coherence; the previous page chains continuity.
      const plot = resolveSlots(story.title, story.slots);
      let prevPageRef: string | null = null;


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
      await this.logStep(
        gen.id,
        'ILLUSTRATIONS',
        30,
        `images=${imageTotal}/${story.pages.length}`,
      );
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
          // Chained references (cap 3 for the edit model): hero(s) by page cast +
          // the previous page for visual continuity.
          const slot = slotByNum.get(page.pageNum);
          const showsMain = slot
            ? slot.cast === 'MAIN' || slot.cast === 'ALL'
            : page.featuresChild;
          const showsExtra = slot
            ? slot.cast === 'EXTRA' || slot.cast === 'ALL'
            : false;
          const refs: string[] = [];
          if (showsMain && referenceImage) refs.push(referenceImage);
          if (showsExtra) refs.push(...companionRefs);
          if (prevPageRef) refs.push(prevPageRef);
          const ctx: ImageContext = {
            scene,
            featuresChild: page.featuresChild,
            photoUrl: book.photoUrl,
            character: page.featuresChild ? character : null,
            childDescriptor: page.featuresChild ? profile.descriptor : null,
            plot,
            referenceImages: [...new Set(refs)].slice(0, 3),
          };
          const original = await this.imageGen.generateImage(ctx);
          imageUrl = original;
          // QC child-facing pages against the reference; regenerate once if they drift.
          if (page.featuresChild && referenceImage) {
            imageUrl = await this.qualityControl(original, ctx, referenceImage);
            if (imageUrl !== original) regens += 1;
          }
          // Chain: the finished image conditions the next page for continuity.
          prevPageRef = await toDataUri(this.storage, imageUrl);
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
      await this.logStep(gen.id, 'ASSEMBLE', 90, 'assembling PDF');
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

      // Persist the run as a reusable, child-agnostic story history (9.7).
      const history = await this.prisma.bookTemplateHistory.create({
        data: {
          title: story.title,
          slots: story.slots as Prisma.InputJsonValue,
          pages: story.pages as unknown as Prisma.InputJsonValue,
          storyPrompt: buildStoryPrompt(storyCtx),
          styleTemplateId: style?.id ?? null,
          themeTemplateId: book.templateId ?? null,
          meta: { images: imageDone, regens } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          title: story.title,
          slots: story.slots,
          pdfUrl: pdfKey,
          status: BookStatus.DONE,
          progress: 100,
          finishedAt: new Date(),
          templateHistoryId: history.id,
        },
      });

      // Completing a book refreshes free hero generations for that child.
      if (book.childId) {
        await this.prisma.hero.updateMany({
          where: { childId: book.childId },
          data: { freeAttempts: 3 },
        });
      }

      await this.prisma.bookGeneration.update({
        where: { id: gen.id },
        data: {
          status: GenerationStatus.DONE,
          currentStep: 'DONE',
          progress: 100,
          finishedAt: new Date(),
        },
      });
      await this.prisma.bookGenerationLog.create({
        data: {
          generationId: gen.id,
          step: 'DONE',
          message: `pages=${story.pages.length} images=${imageDone} regen=${regens}`,
        },
      });

      this.logger.log(
        `[${bookId}] DONE in ${Date.now() - startedAt}ms ` +
          `(pages=${story.pages.length} images=${imageDone} regen=${regens})`,
      );
    } catch (err) {
      this.logger.error(
        `[${bookId}] FAILED at ${stage} in ${Date.now() - startedAt}ms: ${String(err)}`,
      );
      await this.prisma.bookGeneration.update({
        where: { id: gen.id },
        data: {
          status: GenerationStatus.FAILED,
          currentStep: stage,
          error: String(err).slice(0, 500),
          finishedAt: new Date(),
        },
      });
      await this.prisma.bookGenerationLog.create({
        data: {
          generationId: gen.id,
          step: stage,
          level: 'error',
          message: String(err).slice(0, 500),
        },
      });
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
