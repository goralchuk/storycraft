import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { TextGenerator, ImageGenerator } from './contracts';
import { StubTextGenerator, StubImageGenerator } from './stub.generators';
import { GeminiTextGenerator } from './gemini-text.generator';
import { DispatchingTextGenerator } from './dispatching-text.generator';

// Text generation is dispatched at call time from AppSettings.textProvider
// (stub ↔ gemini). Image generation has only a stub today, so it is bound
// directly; a dispatcher is added once a real image provider exists.
@Module({
  imports: [SettingsModule],
  providers: [
    StubTextGenerator,
    GeminiTextGenerator,
    { provide: TextGenerator, useClass: DispatchingTextGenerator },
    { provide: ImageGenerator, useClass: StubImageGenerator },
  ],
  exports: [TextGenerator, ImageGenerator],
})
export class AiModule {}
