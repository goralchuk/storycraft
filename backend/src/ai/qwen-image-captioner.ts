import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageCaptioner } from './contracts';
import { loggedCall } from './logged-call';
import type { Env } from '../config/env.schema';

// Describe a generated portrait in words via Qwen's VL chat surface (same model as
// the consistency checker). Used to store a textual caption of a hero image.
const QWEN_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_VL_MODEL = 'qwen3-vl-flash';

const PROMPT =
  'Опиши персонажа на изображении для детской книги: внешность (волосы, лицо, ' +
  'одежда, цвета) и общее впечатление, кратко (2–3 предложения), на русском. ' +
  'Только описание, без вступлений.';

@Injectable()
export class QwenImageCaptioner extends ImageCaptioner {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async caption(imageDataUri: string): Promise<string> {
    const apiKey = this.config.get('QWEN_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('QWEN_API_KEY is not configured');
    }

    return loggedCall('vision', QWEN_VL_MODEL, async () => {
      const res = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: QWEN_VL_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: imageDataUri } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new ServiceUnavailableException(
          `Image captioner error (${res.status}): ${detail.slice(0, 200)}`,
        );
      }

      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException('Image captioner returned no text');
      }
      return content;
    });
  }
}
