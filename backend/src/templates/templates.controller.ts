import { BadRequestException, Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { TemplateCategory } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Query('category') category?: string, @Query('age') age?: string) {
    if (category && !(category in TemplateCategory)) {
      throw new BadRequestException(`Unknown category: ${category}`);
    }
    return this.templates.list({ category: category as TemplateCategory, age });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const template = await this.templates.get(id);
    if (!template) throw new NotFoundException();
    return template;
  }
}
