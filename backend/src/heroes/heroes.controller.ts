import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  HeroesService,
  type AddCompanionDto,
  type GenerateHeroDto,
} from './heroes.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class HeroesController {
  constructor(private readonly heroes: HeroesService) {}

  @Get('children/:childId/heroes')
  list(@CurrentUser() user: AuthUser, @Param('childId') childId: string) {
    return this.heroes.list(user, childId);
  }

  @Post('children/:childId/heroes')
  addCompanion(
    @CurrentUser() user: AuthUser,
    @Param('childId') childId: string,
    @Body() dto: AddCompanionDto,
  ) {
    return this.heroes.addCompanion(user, childId, dto);
  }

  @Delete('heroes/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.heroes.remove(user, id);
  }

  @Post('heroes/:id/generate')
  @HttpCode(200)
  generate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GenerateHeroDto,
  ) {
    return this.heroes.generate(user, id, dto);
  }

  @Post('heroes/:id/topup')
  @HttpCode(200)
  topup(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.heroes.topup(user, id);
  }
}
