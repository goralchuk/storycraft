import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../storage/storage.module';
import { TextGenerator, ImageGenerator } from './contracts';
import { StubTextGenerator, StubImageGenerator } from './stub.generators';
import { GeminiTextGenerator } from './gemini-text.generator';
import { GeminiImageGenerator } from './gemini-image.generator';
import { DispatchingTextGenerator } from './dispatching-text.generator';
import { DispatchingImageGenerator } from './dispatching-image.generator';

// Both text and image generation are dispatched at call time from AppSettings
// (textProvider / imageProvider): stub ↔ gemini, no redeploy to switch.
// The Gemini image generator stores its output, so StorageModule is imported.
@Module({
  imports: [SettingsModule, StorageModule],
  providers: [
    StubTextGenerator,
    StubImageGenerator,
    GeminiTextGenerator,
    GeminiImageGenerator,
    { provide: TextGenerator, useClass: DispatchingTextGenerator },
    { provide: ImageGenerator, useClass: DispatchingImageGenerator },
  ],
  exports: [TextGenerator, ImageGenerator],
})
export class AiModule {}
