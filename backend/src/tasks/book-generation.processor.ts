import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BookStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TextGenerator, ImageGenerator } from '../ai/contracts';
import { PdfService, PdfPage } from '../pdf/pdf.service';
import { resolveSlots } from '../pdf/slots';
import { StorageService } from '../storage/storage.service';
import { BOOK_GENERATION_QUEUE, BookGenerationJob } from './tasks.constants';

@Processor(BOOK_GENERATION_QUEUE)
export class BookGenerationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textGen: TextGenerator,
    private readonly imageGen: ImageGenerator,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
  ) {
    super();
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
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: BookStatus.FAILED },
      });
      return;
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.PROCESSING },
    });

    try {
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

      const pdfPages: PdfPage[] = [];
      for (const page of story.pages) {
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

        // Slots are resolved here for the PDF; pages stay tokenized in the DB.
        pdfPages.push({ text: resolveSlots(page.text, story.slots), imageUrl });
      }

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
        },
      });
    } catch (err) {
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: BookStatus.FAILED },
      });
      throw err; // let BullMQ record the failed job (and retry if configured)
    }
  }
}
