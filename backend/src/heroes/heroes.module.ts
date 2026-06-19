import { Module } from '@nestjs/common';
import { HeroesController } from './heroes.controller';
import { HeroesService } from './heroes.service';
import { CoinModule } from '../coin/coin.module';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [CoinModule, AiModule, StorageModule],
  controllers: [HeroesController],
  providers: [HeroesService],
})
export class HeroesModule {}
