import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { BookGenerationProcessor } from './book-generation.processor';
import { AiModule } from '../ai/ai.module';
import { PdfModule } from '../pdf/pdf.module';
import { StorageModule } from '../storage/storage.module';
import { CoinModule } from '../coin/coin.module';
import { BOOK_GENERATION_QUEUE } from './tasks.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: BOOK_GENERATION_QUEUE }),
    AiModule,
    PdfModule,
    StorageModule,
    CoinModule,
  ],
  providers: [TasksService, BookGenerationProcessor],
  exports: [TasksService],
})
export class TasksModule {}
