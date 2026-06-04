import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { GeneratedText, StoryContext, TextGenerator } from './contracts';
import { StubTextGenerator } from './stub.generators';
import { GeminiTextGenerator } from './gemini-text.generator';

/**
 * Selects the concrete text generator at call time from
 * `AppSettings.textProvider`, so switching provider in the DB (no redeploy,
 * no env change) swaps the implementation. Unknown values fall back to the stub.
 */
@Injectable()
export class DispatchingTextGenerator extends TextGenerator {
  constructor(
    private readonly settings: SettingsService,
    private readonly stub: StubTextGenerator,
    private readonly gemini: GeminiTextGenerator,
  ) {
    super();
  }

  async generateText(ctx: StoryContext): Promise<GeneratedText> {
    const { textProvider } = await this.settings.get();
    return this.pick(textProvider).generateText(ctx);
  }

  private pick(provider: string): TextGenerator {
    switch (provider) {
      case 'gemini':
        return this.gemini;
      case 'stub':
      default:
        return this.stub;
    }
  }
}
