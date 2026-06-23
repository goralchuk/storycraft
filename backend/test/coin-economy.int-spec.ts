import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HeroRole } from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { CoinService } from './../src/coin/coin.service';
import { BooksService } from './../src/books/books.service';
import { HeroesService } from './../src/heroes/heroes.service';
import { PricingService } from './../src/pricing/pricing.service';
import { TasksService } from './../src/tasks/tasks.service';
import { BookGenerationProcessor } from './../src/tasks/book-generation.processor';
import {
  TextGenerator,
  ImageGenerator,
  ConsistencyChecker,
} from './../src/ai/contracts';
import { PdfService } from './../src/pdf/pdf.service';
import { StorageService } from './../src/storage/storage.service';

// Integration test for the coin economy. Drives the real services against the
// real dev DB with stubbed AI/PDF/storage (no token spend, no network) and the
// queue disabled (the worker is invoked directly). Creates one test user and
// cleans up ONLY that user; never drops or resets the database. Dev-only.
//
// Requires Postgres + Redis up (see docs/running.md). Run with: npm run test:int

// Toggleable image stub so we can force a generation failure on demand.
const imageGen = {
  fail: false,
  generateImage: jest.fn(
    (): Promise<string> =>
      imageGen.fail
        ? Promise.reject(new Error('stub image failure'))
        : Promise.resolve('test://img'),
  ),
};
// Cycle the three layouts so a run mixes image and TEXT_ONLY pages (8.6).
const LAYOUTS = ['IMAGE_TEXT', 'TEXT_ONLY', 'IMAGE_ONLY'] as const;
const textGen = {
  generateText: jest.fn((ctx: { childName: string; pageCount: number }) =>
    Promise.resolve({
      title: "{{child}}'s Test Story",
      slots: { child: ctx.childName, friend: 'Max' },
      pages: Array.from({ length: ctx.pageCount }, (_, i) => ({
        pageNum: i + 1,
        text: `Page ${i + 1}: {{child}} and {{friend}}.`,
        featuresChild: i % 2 === 0,
        layout: LAYOUTS[i % LAYOUTS.length],
      })),
    }),
  ),
};
const pdfStub = {
  generate: jest.fn(() => Promise.resolve(Buffer.from('pdf'))),
};
const storageStub = {
  upload: jest.fn((key: string) => Promise.resolve(key)),
  toUrl: jest.fn((v: string | null) => Promise.resolve(v)),
  getSignedUrl: jest.fn((key: string) => Promise.resolve(key)),
};
const tasksStub = { enqueueBookGeneration: jest.fn() };
// Always-pass VL checker so QC never makes a real vision call in tests.
const checkerStub = { score: jest.fn((): Promise<number> => Promise.resolve(10)) };

describe('Coin economy (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let coins: CoinService;
  let books: BooksService;
  let heroes: HeroesService;
  let pricing: PricingService;
  let processor: BookGenerationProcessor;

  const email = `inttest-${Date.now()}@storycraft.test`;
  let userId: string;
  let childId: string;
  let templateId: string;
  let price: Record<string, number> = {};
  let origPage24: number;

  const user = () => ({ id: userId, email });
  const balance = async () =>
    (
      await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { balance: true },
      })
    ).balance;
  const txCount = async (label: string) =>
    prisma.coinTransaction.count({ where: { userId, label } });
  const run = (bookId: string) =>
    processor.process({ data: { bookId } } as unknown as Parameters<
      BookGenerationProcessor['process']
    >[0]);

  async function newConfiguredDraft(
    bookType: 'UNIQUE' | 'TEMPLATE',
    pageCount?: number,
  ) {
    const draft = await books.createDraft(
      user(),
      bookType === 'TEMPLATE' ? { bookType, templateId } : { bookType },
    );
    await books.updateDraft(user(), draft.id, {
      childId,
      ...(pageCount ? { pageCount } : {}),
    });
    return draft.id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TextGenerator)
      .useValue(textGen)
      .overrideProvider(ImageGenerator)
      .useValue(imageGen)
      .overrideProvider(PdfService)
      .useValue(pdfStub)
      .overrideProvider(StorageService)
      .useValue(storageStub)
      .overrideProvider(ConsistencyChecker)
      .useValue(checkerStub)
      .overrideProvider(TasksService)
      .useValue(tasksStub)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    coins = app.get(CoinService);
    books = app.get(BooksService);
    heroes = app.get(HeroesService);
    pricing = app.get(PricingService);
    processor = app.get(BookGenerationProcessor);

    price = Object.fromEntries(
      (await prisma.priceItem.findMany()).map((p) => [p.key, p.amount]),
    );
    origPage24 = price.PAGE_24;

    const u = await prisma.user.create({ data: { email, name: 'Int Test' } });
    userId = u.id;
    const c = await prisma.child.create({
      data: { userId, name: 'Testkid', interests: [] },
    });
    childId = c.id;
    templateId = (
      await prisma.template.findFirstOrThrow({ where: { isActive: true } })
    ).id;
  });

  afterAll(async () => {
    // Restore any price we changed and delete ONLY our test user (cascades to
    // children, heroes, books, pages, transactions). Never reset the DB.
    try {
      if (price.PAGE_24 !== origPage24)
        await pricing.update('PAGE_24', origPage24);
      if (userId) await prisma.user.delete({ where: { id: userId } });
    } finally {
      await app.close();
    }
  });

  it('new user starts with 500 coins', async () => {
    expect(await balance()).toBe(500);
  });

  it('buying a coin package credits the balance and logs it', async () => {
    const { balance: b } = await coins.purchasePack(user(), 'PACK_5000');
    expect(b).toBe(500 + price.PACK_5000);
    expect(await balance()).toBe(500 + price.PACK_5000);
    expect(await txCount(`Покупка пакета · ${price.PACK_5000} 🪙`)).toBe(1);
  });

  it('creating a unique book debits the book-type cost', async () => {
    const before = await balance();
    await books.createDraft(user(), { bookType: 'UNIQUE' });
    expect(await balance()).toBe(before - price.BOOK_UNIQUE);
    expect(await txCount('Book (unique)')).toBe(1);
  });

  it('adding a companion and topping up a hero debit their costs', async () => {
    const before = await balance();
    await heroes.list(user(), childId); // ensures the MAIN hero
    await heroes.addCompanion(user(), childId, {
      role: HeroRole.PET,
      name: 'Buddy',
    });
    expect(await balance()).toBe(before - price.COMPANION);
    expect(await txCount('Companion: Buddy')).toBe(1);

    const main = (await heroes.list(user(), childId)).find(
      (h) => h.role === HeroRole.MAIN,
    )!;
    await heroes.topup(user(), main.id);
    expect(await balance()).toBe(before - price.COMPANION - price.HERO_TOPUP);
  });

  it('submitting charges the page-tier surcharge and queues generation', async () => {
    const draft = await prisma.book.findFirstOrThrow({
      where: { userId, status: 'DRAFT' },
    });
    await books.updateDraft(user(), draft.id, { childId, pageCount: 20 });
    const before = await balance();
    const submitted = await books.submit(user(), draft.id);
    expect(submitted.status).toBe('PENDING');
    expect(await balance()).toBe(before - price.PAGE_20);
    expect(await txCount('Pages: 20')).toBe(1);
  });

  it('completing a book resets the child heroes free generations', async () => {
    const book = await prisma.book.findFirstOrThrow({
      where: { userId, status: 'PENDING' },
    });
    const before = await balance();
    await run(book.id);

    const done = await prisma.book.findUniqueOrThrow({
      where: { id: book.id },
    });
    expect(done.status).toBe('DONE');
    expect(done.progress).toBe(100);
    const all = await prisma.hero.findMany({ where: { childId } });
    expect(all.every((h) => h.freeAttempts === 3)).toBe(true); // MAIN was 6 after top-up
    expect(await balance()).toBe(before); // completion does not move coins
  });

  it('an admin price change applies to the next charge', async () => {
    await pricing.update('PAGE_24', 999);
    price.PAGE_24 = 999;

    const draftId = await newConfiguredDraft('TEMPLATE', 24);
    const before = await balance();
    await books.submit(user(), draftId);
    expect(await balance()).toBe(before - 999);
    expect(await txCount('Pages: 24')).toBe(1);
    await run(draftId); // leave it DONE
  });

  it('failure keeps coins; retry re-runs free; decline refunds once', async () => {
    const draftId = await newConfiguredDraft('UNIQUE', 16);
    await books.submit(user(), draftId);
    const afterSubmit = await balance();

    imageGen.fail = true;
    await expect(run(draftId)).rejects.toThrow();
    let book = await prisma.book.findUniqueOrThrow({ where: { id: draftId } });
    expect(book.status).toBe('FAILED');
    expect(await balance()).toBe(afterSubmit); // failure does NOT refund
    expect(await txCount('Refund: pages 16')).toBe(0);

    // Free retry: back to PENDING, re-enqueued (stub), no charge.
    await books.retry(user(), draftId);
    book = await prisma.book.findUniqueOrThrow({ where: { id: draftId } });
    expect(book.status).toBe('PENDING');
    expect(await balance()).toBe(afterSubmit);

    // It fails again; decline → CANCELLED + refund exactly once.
    await expect(run(draftId)).rejects.toThrow();
    await books.cancel(user(), draftId);
    book = await prisma.book.findUniqueOrThrow({ where: { id: draftId } });
    expect(book.status).toBe('CANCELLED');
    expect(await balance()).toBe(afterSubmit + price.PAGE_16);
    expect(await txCount('Refund: pages 16')).toBe(1);

    // Declining a CANCELLED book does nothing (no double refund).
    await expect(books.cancel(user(), draftId)).rejects.toThrow();
    expect(await txCount('Refund: pages 16')).toBe(1);
    expect(await balance()).toBe(afterSubmit + price.PAGE_16);
  });

  it('progress is non-decreasing through the stages and reaches 100', async () => {
    const draftId = await newConfiguredDraft('UNIQUE', 16);
    await books.submit(user(), draftId);
    imageGen.fail = false;

    // Record every stage/progress the worker writes, in order (claim uses
    // updateMany; per-stage writes use update).
    const seen: number[] = [];
    const stages: string[] = [];
    const record = (data: { progress?: number; stage?: string | null }) => {
      if (typeof data?.progress === 'number') seen.push(data.progress);
      if (typeof data?.stage === 'string') stages.push(data.stage);
    };
    const origUpdate = prisma.book.update.bind(prisma.book);
    const origUpdateMany = prisma.book.updateMany.bind(prisma.book);
    const u = jest
      .spyOn(prisma.book, 'update')
      .mockImplementation(((args: { data: object }) => {
        record(args.data);
        return origUpdate(args as Parameters<typeof origUpdate>[0]);
      }) as typeof prisma.book.update);
    const um = jest
      .spyOn(prisma.book, 'updateMany')
      .mockImplementation(((args: { data: object }) => {
        record(args.data);
        return origUpdateMany(args as Parameters<typeof origUpdateMany>[0]);
      }) as typeof prisma.book.updateMany);
    try {
      await run(draftId);
    } finally {
      u.mockRestore();
      um.mockRestore();
    }

    const done = await prisma.book.findUniqueOrThrow({ where: { id: draftId } });
    expect(done.status).toBe('DONE');

    // Non-decreasing throughout, ending at 100.
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    }
    expect(seen[seen.length - 1]).toBe(100);

    // The four named stages appear, in order.
    const order = ['HEROES', 'STORY', 'ILLUSTRATIONS', 'ASSEMBLE'];
    const firstIdx = order.map((s) => stages.indexOf(s));
    expect(firstIdx.every((x) => x >= 0)).toBe(true);
    for (let i = 1; i < firstIdx.length; i++) {
      expect(firstIdx[i]).toBeGreaterThan(firstIdx[i - 1]);
    }
  });

  it('declining a failed 12-page book refunds nothing', async () => {
    const draftId = await newConfiguredDraft('UNIQUE'); // tier 12, no surcharge
    await books.submit(user(), draftId);
    const afterSubmit = await balance();

    imageGen.fail = true;
    await expect(run(draftId)).rejects.toThrow();
    expect(await balance()).toBe(afterSubmit); // no auto-refund

    await books.cancel(user(), draftId);
    const book = await prisma.book.findUniqueOrThrow({ where: { id: draftId } });
    expect(book.status).toBe('CANCELLED');
    expect(await balance()).toBe(afterSubmit); // tier 12 has nothing to refund
    expect(await txCount('Refund: pages 12')).toBe(0);
  });
});
