import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { TasksModule } from '../tasks/tasks.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TasksModule, StorageModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
