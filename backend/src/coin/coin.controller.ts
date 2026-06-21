import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { CoinService } from './coin.service';

@Controller('coins')
@UseGuards(JwtAuthGuard)
export class CoinController {
  constructor(private readonly coins: CoinService) {}

  @Get('transactions')
  transactions(@CurrentUser() user: AuthUser) {
    return this.coins.listTransactions(user);
  }

  @Post('purchase')
  @HttpCode(200)
  purchase(@CurrentUser() user: AuthUser, @Body() dto: { key: string }) {
    return this.coins.purchasePack(user, dto.key);
  }
}
