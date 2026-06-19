import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  list() {
    return this.pricing.list();
  }

  @Patch(':key')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('key') key: string,
    @Body('amount', ParseIntPipe) amount: number,
  ) {
    return this.pricing.update(key, amount);
  }
}
