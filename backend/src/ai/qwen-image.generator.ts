import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { SettingsService } from '../settings/settings.service';
import { StorageService } from '../storage/storage.service';
import { ImageContext, ImageGenerator } from './contracts';
import { loggedCall } from './logged-call';
import type { Env } from '../config/env.schema';

// Qwen image generation (qwen-image-2.0) runs on DashScope's multimodal-generation
// API (synchronous) and returns a temporary OSS image URL — we fetch the bytes and
// store them in our own MinIO so the link doesn't expire. Model from AppSettings.imageModel.
const QWEN_IMAGE_URL =
  'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

type QwenImageResponse = {
  output?: {
    choices?: { message?: { content?: { image?: string }[] } }[];
  };
};

@Injectable()
export class QwenImageGenerator extends ImageGenerator {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly settings: SettingsService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async generateImage(ctx: ImageContext): Promise<string> {
    const apiKey = this.config.get('QWEN_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('QWEN_API_KEY is not configured');
    }
    const { imageModel } = await this.settings.get();

    return loggedCall('image', imageModel, async () => {
      const res = await fetch(QWEN_IMAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: imageModel,
          input: {
            messages: [
              {
                role: 'user',
                // Reference images (when present) condition the character's look /
                // scene continuity; each is sent as its own image content part.
                content: [
                  ...(ctx.referenceImages ?? []).map((image) => ({ image })),
                  { text: buildPrompt(ctx) },
                ],
              },
            ],
          },
          parameters: { negative_prompt: '', watermark: false },
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new ServiceUnavailableException(
          `Image provider error (${res.status}): ${detail.slice(0, 300)}`,
        );
      }

      const body = (await res.json()) as QwenImageResponse;
      const imageUrl = body.output?.choices?.[0]?.message?.content?.find(
        (p) => p.image,
      )?.image;
      if (!imageUrl) {
        throw new ServiceUnavailableException(
          'Image provider returned no image',
        );
      }

      // Pull the generated image off the temporary OSS URL into our own storage.
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        throw new ServiceUnavailableException(
          `Failed to fetch generated image (${imgRes.status})`,
        );
      }
      const mime = imgRes.headers.get('content-type') ?? 'image/png';
      const ext = mime.split('/')[1]?.split(';')[0] ?? 'png';
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      // Store the object key; GET /books/:id signs it on read (toUrl).
      return this.storage.upload(
        `books/img-${randomUUID()}.${ext}`,
        buffer,
        mime,
      );
    });
  }
}

function buildPrompt(ctx: ImageContext): string {
  return [
    "Children's picture-book illustration. Soft, warm, gentle, age-appropriate.",
    ctx.childDescriptor
      ? `Главный герой — человек-ребёнок (${ctx.childDescriptor}), НЕ животное и не предмет (имя — имя собственное).`
      : '',
    ctx.character
      ? `Главный герой (сохраняй одинаковую внешность во всей книге): ${ctx.character}.`
      : '',
    `Scene: ${ctx.scene}`,
  ]
    .filter(Boolean)
    .join('\n');
}
