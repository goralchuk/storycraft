import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { ChildrenService } from './children.service';

@Controller('children')
@UseGuards(JwtAuthGuard)
export class ChildrenController {
  constructor(private readonly children: ChildrenService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.children.list(user);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: { name: string; birthDate?: string; gender?: string; interests?: string[] },
  ) {
    return this.children.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: { name?: string; birthDate?: string; gender?: string; interests?: string[] },
  ) {
    return this.children.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.children.remove(user, id);
  }
}
