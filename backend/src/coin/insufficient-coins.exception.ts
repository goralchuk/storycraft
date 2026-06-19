import { HttpException, HttpStatus } from '@nestjs/common';

// 402-style domain error so callers/frontend can redirect to the wallet.
export class InsufficientCoinsException extends HttpException {
  constructor() {
    super('Insufficient coins', HttpStatus.PAYMENT_REQUIRED);
  }
}
