import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { TasksModule } from '../tasks/tasks.module';
import { StorageModule } from '../storage/storage.module';
import { CoinModule } from '../coin/coin.module';

@Module({
  imports: [TasksModule, StorageModule, CoinModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
