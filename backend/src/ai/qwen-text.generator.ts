import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { GeneratedText, StoryContext, TextGenerator } from './contracts';
import { STORY_SYSTEM_PROMPT, buildStoryPrompt, parseStory } from './story-prompt';
import type { Env } from '../config/env.schema';

// Qwen (Alibaba DashScope) OpenAI-compatible surface — same wire format as
// OpenAI/Gemini, so this mirrors the Gemini text generator with a different
// base URL + key + model (from AppSettings.textModel, e.g. qwen3.7-plus).
const QWEN_BASE_URL =
  'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

@Injectable()
export class QwenTextGenerator extends TextGenerator {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly settings: SettingsService,
  ) {
    super();
  }

  async generateText(ctx: StoryContext): Promise<GeneratedText> {
    const apiKey = this.config.get('QWEN_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('QWEN_API_KEY is not configured');
    }
    const { textModel } = await this.settings.get();

    const res = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: textModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: STORY_SYSTEM_PROMPT },
          { role: 'user', content: buildStoryPrompt(ctx) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new ServiceUnavailableException(
        `Text provider error (${res.status}): ${detail.slice(0, 300)}`,
      );
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new ServiceUnavailableException('Text provider returned no content');
    }

    return parseStory(content, ctx);
  }
}
