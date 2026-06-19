import { Module } from '@nestjs/common';
import { CoinService } from './coin.service';

@Module({
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
