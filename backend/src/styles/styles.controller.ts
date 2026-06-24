import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StylesService } from './styles.service';

@Controller('styles')
@UseGuards(JwtAuthGuard)
export class StylesController {
  constructor(private readonly styles: StylesService) {}

  @Get()
  list() {
    return this.styles.list();
  }
}
