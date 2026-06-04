import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('file must be an image');
    }

    const key = `photos/${randomUUID()}${extname(file.originalname)}`;
    await this.storage.upload(key, file.buffer, file.mimetype);
    return { key, url: await this.storage.getSignedUrl(key) };
  }
}
