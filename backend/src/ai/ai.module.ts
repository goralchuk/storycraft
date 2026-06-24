import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../storage/storage.module';
import {
  TextGenerator,
  ImageGenerator,
  ConsistencyChecker,
  ImageCaptioner,
} from './contracts';
import { StubTextGenerator, StubImageGenerator } from './stub.generators';
import { GeminiTextGenerator } from './gemini-text.generator';
import { GeminiImageGenerator } from './gemini-image.generator';
import { QwenTextGenerator } from './qwen-text.generator';
import { QwenImageGenerator } from './qwen-image.generator';
import { QwenVisionChecker } from './qwen-vision.checker';
import { QwenImageCaptioner } from './qwen-image-captioner';
import { DispatchingTextGenerator } from './dispatching-text.generator';
import { DispatchingImageGenerator } from './dispatching-image.generator';

// Both text and image generation are dispatched at call time from AppSettings
// (textProvider / imageProvider): stub ↔ qwen ↔ gemini, no redeploy to switch.
// The Qwen/Gemini image generators store their output, so StorageModule is imported.
@Module({
  imports: [SettingsModule, StorageModule],
  providers: [
    StubTextGenerator,
    StubImageGenerator,
    GeminiTextGenerator,
    GeminiImageGenerator,
    QwenTextGenerator,
    QwenImageGenerator,
    { provide: TextGenerator, useClass: DispatchingTextGenerator },
    { provide: ImageGenerator, useClass: DispatchingImageGenerator },
    { provide: ConsistencyChecker, useClass: QwenVisionChecker },
    { provide: ImageCaptioner, useClass: QwenImageCaptioner },
  ],
  exports: [TextGenerator, ImageGenerator, ConsistencyChecker, ImageCaptioner],
})
export class AiModule {}
