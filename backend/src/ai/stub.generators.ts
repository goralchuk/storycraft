import { Injectable } from '@nestjs/common';
import {
  GeneratedText,
  ImageContext,
  ImageGenerator,
  StoryContext,
  TextGenerator,
} from './contracts';

/**
 * Hardcoded text generator for local dev and tests. Emits slot-tokenized
 * text so the slot-resolution path runs end-to-end with zero external cost.
 */
@Injectable()
export class StubTextGenerator extends TextGenerator {
  async generateText(ctx: StoryContext): Promise<GeneratedText> {
    const pages = Array.from({ length: ctx.pageCount }, (_, i) => ({
      pageNum: i + 1,
      text: `Page ${i + 1}: {{child}} and {{friend}} faced the day with courage.`,
      featuresChild: i % 2 === 0,
    }));

    return {
      title: `{{child}}'s Big Adventure`,
      slots: { child: ctx.childName, friend: 'Max' },
      pages,
    };
  }
}

/**
 * Placeholder image generator — no external call. Child-facing panels are
 * driven by the child's photo; a real provider would condition generation on
 * it, so the stub echoes the photo to make that behaviour observable. Scene
 * panels (and child panels with no photo) get a static placeholder.
 */
@Injectable()
export class StubImageGenerator extends ImageGenerator {
  async generateImage(ctx: ImageContext): Promise<string> {
    if (ctx.featuresChild && ctx.photoUrl) return ctx.photoUrl;
    return 'https://placehold.co/800x600/png';
  }
}
