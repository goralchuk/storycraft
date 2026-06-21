import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { SettingsService } from '../settings/settings.service';
import { StorageService } from '../storage/storage.service';
import { ImageContext, ImageGenerator } from './contracts';
import type { Env } from '../config/env.schema';

// Gemini's NATIVE image API (generateContent) — not the OpenAI-compatible
// surface used for text. Image bytes come back base64 in candidates[].parts[].
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

type InlineData = { data: string; mimeType?: string; mime_type?: string };
type GeminiImageResponse = {
  candidates?: {
    content?: {
      parts?: { inlineData?: InlineData; inline_data?: InlineData }[];
    };
  }[];
};

@Injectable()
export class GeminiImageGenerator extends ImageGenerator {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly settings: SettingsService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async generateImage(ctx: ImageContext): Promise<string> {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured');
    }
    const { imageModel } = await this.settings.get();

    const res = await fetch(
      `${GEMINI_BASE_URL}/${imageModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(ctx) }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      throw new ServiceUnavailableException(
        `Image provider error (${res.status}): ${detail.slice(0, 300)}`,
      );
    }

    const body = (await res.json()) as GeminiImageResponse;
    const inline = body.candidates?.[0]?.content?.parts
      ?.map((p) => p.inlineData ?? p.inline_data)
      .find((d): d is InlineData => Boolean(d?.data));
    if (!inline) {
      throw new ServiceUnavailableException('Image provider returned no image');
    }

    const mime = inline.mimeType ?? inline.mime_type ?? 'image/png';
    const ext = mime.split('/')[1] ?? 'png';
    const buffer = Buffer.from(inline.data, 'base64');
    // Store the object key; GET /books/:id signs it on read (toUrl).
    return this.storage.upload(
      `books/img-${randomUUID()}.${ext}`,
      buffer,
      mime,
    );
  }
}

function buildPrompt(ctx: ImageContext): string {
  // Page text is slot-tokenized ({{child}}); strip braces for a cleaner scene prompt.
  const scene = ctx.pageText.replace(/\{\{(\w+)\}\}/g, '$1').trim();
  return [
    "Children's picture-book illustration. Soft, warm, gentle, age-appropriate.",
    `Scene: ${scene}`,
  ].join('\n');
}
