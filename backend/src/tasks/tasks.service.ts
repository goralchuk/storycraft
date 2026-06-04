import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BOOK_GENERATION_QUEUE, BookGenerationJob } from './tasks.constants';

@Injectable()
export class TasksService {
  constructor(
    @InjectQueue(BOOK_GENERATION_QUEUE)
    private readonly queue: Queue<BookGenerationJob>,
  ) {}

  enqueueBookGeneration(bookId: string) {
    return this.queue.add('generate', { bookId });
  }
}
