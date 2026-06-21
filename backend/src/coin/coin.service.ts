import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsufficientCoinsException } from './insufficient-coins.exception';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class CoinService {
  constructor(private readonly prisma: PrismaService) {}

  // The user's coin ledger, newest first (capped to keep the payload bounded).
  async listTransactions(user: AuthUser) {
    const dbUser = await this.requireUser(user);
    return this.prisma.coinTransaction.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // Stub top-up: credit a coin package's amount from the catalog and log it.
  // Real money → coins (Stripe) is Phase 7; the key → credit shape stays.
  async purchasePack(user: AuthUser, key: string) {
    const item = await this.prisma.priceItem.findUnique({ where: { key } });
    if (!item || !item.active || item.category !== 'PACK') {
      throw new BadRequestException(`Not a purchasable coin package: ${key}`);
    }
    const dbUser = await this.requireUser(user);
    const balance = await this.credit(
      dbUser.id,
      item.amount,
      `Покупка пакета · ${item.amount} 🪙`,
    );
    return { balance };
  }

  private async requireUser(user: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (!dbUser) throw new NotFoundException('User not found');
    return dbUser;
  }

  // Credit coins and log the transaction atomically. Returns the new balance.
  credit(userId: string, amount: number, label: string, bookId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
        select: { balance: true },
      });
      await tx.coinTransaction.create({
        data: { userId, amount, isIn: true, label, bookId },
      });
      return user.balance;
    });
  }

  // Debit coins and log the transaction atomically, guarding against overdraw.
  // The conditional updateMany is race-safe: a concurrent debit cannot drive the
  // balance negative because the `gte` filter fails for the loser.
  debit(userId: string, amount: number, label: string, bookId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const res = await tx.user.updateMany({
        where: { id: userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (res.count === 0) {
        const exists = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!exists) throw new NotFoundException('User not found');
        throw new InsufficientCoinsException();
      }
      await tx.coinTransaction.create({
        data: { userId, amount, isIn: false, label, bookId },
      });
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      return user!.balance;
    });
  }

  // Resolve a coin cost from the price catalog by key (single source of truth).
  async priceOf(key: string): Promise<number> {
    const item = await this.prisma.priceItem.findUnique({ where: { key } });
    if (!item || !item.active) {
      throw new NotFoundException(`Price not found: ${key}`);
    }
    return item.amount;
  }
}
