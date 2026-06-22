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
const textGen = {
  generateText: jest.fn((ctx: { childName: string; pageCount: number }) =>
    Promise.resolve({
      title: "{{child}}'s Test Story",
      slots: { child: ctx.childName, friend: 'Max' },
      pages: Array.from({ length: ctx.pageCount }, (_, i) => ({
        pageNum: i + 1,
        text: `Page ${i + 1}: {{child}} and {{friend}}.`,
        featuresChild: i % 2 === 0,
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

  it('a failed generation refunds the page-tier surcharge exactly once', async () => {
    const draftId = await newConfiguredDraft('UNIQUE', 16);
    await books.submit(user(), draftId);
    const afterSubmit = await balance();

    imageGen.fail = true;
    await expect(run(draftId)).rejects.toThrow();

    const failed = await prisma.book.findUniqueOrThrow({
      where: { id: draftId },
    });
    expect(failed.status).toBe('FAILED');
    expect(await balance()).toBe(afterSubmit + price.PAGE_16); // surcharge returned
    expect(await txCount('Refund: pages 16')).toBe(1);

    // Re-running the job on the FAILED book must not refund again (idempotent claim).
    await run(draftId);
    expect(await txCount('Refund: pages 16')).toBe(1);
    expect(await balance()).toBe(afterSubmit + price.PAGE_16);
  });

  it('a failed 12-page book refunds nothing', async () => {
    const draftId = await newConfiguredDraft('UNIQUE'); // tier 12, no surcharge
    await books.submit(user(), draftId);
    const afterSubmit = await balance();

    imageGen.fail = true;
    await expect(run(draftId)).rejects.toThrow();

    const failed = await prisma.book.findUniqueOrThrow({
      where: { id: draftId },
    });
    expect(failed.status).toBe('FAILED');
    expect(await balance()).toBe(afterSubmit); // nothing to refund
    expect(await txCount('Refund: pages 12')).toBe(0);
  });
});
