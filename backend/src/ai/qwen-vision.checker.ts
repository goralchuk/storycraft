import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsistencyChecker, ConsistencyInput } from './contracts';
import { loggedCall } from './logged-call';
import type { Env } from '../config/env.schema';

// Vision-language consistency check via Qwen's OpenAI-compatible chat surface.
// The VL model is fixed for now (no AppSettings field).
const QWEN_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_VL_MODEL = 'qwen3-vl-flash';

const PROMPT =
  'Первое изображение — эталон внешности главного персонажа, второе — иллюстрация ' +
  'из книги. Оцени, насколько персонаж на иллюстрации совпадает с эталоном по ' +
  'внешности (волосы, лицо, одежда) и насколько иллюстрация качественная, по шкале ' +
  'от 1 до 10. Верни только JSON: {"score": number}.';

@Injectable()
export class QwenVisionChecker extends ConsistencyChecker {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async score(input: ConsistencyInput): Promise<number> {
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
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: input.referenceImage } },
                { type: 'image_url', image_url: { url: input.pageImage } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new ServiceUnavailableException(
          `Vision checker error (${res.status}): ${detail.slice(0, 200)}`,
        );
      }

      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content ?? '';
      const score = extractScore(content);
      if (!Number.isFinite(score)) {
        throw new ServiceUnavailableException(
          'Vision checker returned no score',
        );
      }
      // Clamp to the documented 1–10 range.
      return Math.max(1, Math.min(10, score));
    });
  }
}

// VL models (even with json_object) sometimes return verbose or slightly malformed
// JSON. Try strict JSON first, then fall back to extracting the first numeric score.
function extractScore(content: string): number {
  const clean = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(clean) as { score?: number };
    if (Number.isFinite(Number(obj.score))) return Number(obj.score);
  } catch {
    // fall through to regex extraction
  }
  const m = clean.match(/score"?\s*[:=]\s*"?([0-9]+(?:\.[0-9]+)?)/i);
  return m ? Number(m[1]) : NaN;
}
