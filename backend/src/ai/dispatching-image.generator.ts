import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { ImageContext, ImageGenerator } from './contracts';
import { StubImageGenerator } from './stub.generators';
import { GeminiImageGenerator } from './gemini-image.generator';

/**
 * Selects the concrete image generator at call time from
 * `AppSettings.imageProvider` (stub ↔ gemini), mirroring the text dispatcher.
 * Unknown values fall back to the stub.
 */
@Injectable()
export class DispatchingImageGenerator extends ImageGenerator {
  constructor(
    private readonly settings: SettingsService,
    private readonly stub: StubImageGenerator,
    private readonly gemini: GeminiImageGenerator,
  ) {
    super();
  }

  async generateImage(ctx: ImageContext): Promise<string> {
    const { imageProvider } = await this.settings.get();
    return this.pick(imageProvider).generateImage(ctx);
  }

  private pick(provider: string): ImageGenerator {
    switch (provider) {
      case 'gemini':
        return this.gemini;
      case 'stub':
      default:
        return this.stub;
    }
  }
}
