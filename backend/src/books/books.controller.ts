import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  BooksService,
  type CreateDraftDto,
  type UpdateDraftDto,
} from './books.service';

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.books.list(user);
  }

  @Get('draft')
  getDraft(@CurrentUser() user: AuthUser) {
    return this.books.getDraft(user);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.books.getOne(user, id);
  }

  @Post('draft')
  createDraft(@CurrentUser() user: AuthUser, @Body() dto: CreateDraftDto) {
    return this.books.createDraft(user, dto);
  }

  @Patch(':id')
  updateDraft(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
  ) {
    return this.books.updateDraft(user, id, dto);
  }

  @Post(':id/submit')
  @HttpCode(200)
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.books.submit(user, id);
  }

  @Post(':id/retry')
  @HttpCode(200)
  retry(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.books.retry(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.books.cancel(user, id);
  }
}
