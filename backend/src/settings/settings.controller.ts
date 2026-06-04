import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  update(
    @Body()
    dto: {
      textProvider?: string;
      textModel?: string;
      imageProvider?: string;
      imageModel?: string;
    },
  ) {
    return this.settings.update(dto);
  }
}
