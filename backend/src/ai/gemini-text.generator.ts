import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { GeneratedText, StoryContext, TextGenerator } from './contracts';
import type { Env } from '../config/env.schema';

// Gemini's OpenAI-compatible surface — same wire format as OpenAI/Groq/Together,
// so swapping provider later is just a base URL + key + model change.
const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai';

@Injectable()
export class GeminiTextGenerator extends TextGenerator {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly settings: SettingsService,
  ) {
    super();
  }

  async generateText(ctx: StoryContext): Promise<GeneratedText> {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured');
    }
    const { textModel } = await this.settings.get();

    const res = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: textModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(ctx) },
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
      throw new ServiceUnavailableException(
        'Text provider returned no content',
      );
    }

    return parseStory(content, ctx);
  }
}

const SYSTEM_PROMPT =
  "You are an author of gentle, age-appropriate children's picture books. " +
  'You always reply with a single JSON object and nothing else.';

function buildPrompt(ctx: StoryContext): string {
  const lines = [
    `Write a children's picture-book story told in ${ctx.pageCount} short paragraphs.`,
    `Template theme: ${ctx.templateTitle} — ${ctx.templatePrompt}`,
    ctx.topicLabel ? `Life moment / fear to address: ${ctx.topicLabel}` : '',
    ctx.fear ? `The child's specific fear: ${ctx.fear}` : '',
    ctx.promptText ? `Extra guidance from the parent: ${ctx.promptText}` : '',
    ctx.writingStyle ? `Writing style: ${ctx.writingStyle}` : '',
    `Main child's real name: ${ctx.childName}`,
    ctx.childInterests.length
      ? `Child's interests: ${ctx.childInterests.join(', ')}`
      : '',
    '',
    'RULES:',
    "- Never write the child's real name in the page text. Use the token {{child}} instead.",
    '- Use {{friend}} for the main companion character; invent extra tokens like {{wizard}} for other named characters.',
    '- Return JSON: { "title": string, "slots": { token: value }, "pages": [ { "pageNum": number, "text": string, "featuresChild": boolean } ] }.',
    '- "slots" must map every token you used (without braces) to its real value; "child" MUST equal the real name above.',
    `- "pages" must have exactly ${ctx.pageCount} entries (one per paragraph), pageNum 1..${ctx.pageCount}, each a single short paragraph of 2-4 sentences.`,
    '- Set "featuresChild" true on pages where the child is visibly depicted.',
  ];
  return lines.filter(Boolean).join('\n');
}

function parseStory(content: string, ctx: StoryContext): GeneratedText {
  // Tolerate ```json fences some models add despite response_format.
  const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  let raw: unknown;
  try {
    raw = JSON.parse(cleaned);
  } catch {
    throw new ServiceUnavailableException(
      'Text provider returned invalid JSON',
    );
  }

  const obj = raw as Partial<GeneratedText>;
  if (
    !obj.title ||
    !Array.isArray(obj.pages) ||
    typeof obj.slots !== 'object'
  ) {
    throw new ServiceUnavailableException(
      'Text provider returned malformed story',
    );
  }

  return {
    title: obj.title,
    // Guarantee the child slot regardless of model compliance.
    slots: { ...obj.slots, child: ctx.childName },
    pages: obj.pages.map((p, i) => ({
      pageNum: p.pageNum ?? i + 1,
      text: p.text ?? '',
      featuresChild: Boolean(p.featuresChild),
    })),
  };
}
