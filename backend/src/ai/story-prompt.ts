import { ServiceUnavailableException } from '@nestjs/common';
import { GeneratedText, PageLayout, StoryContext } from './contracts';

const LAYOUTS: PageLayout[] = ['IMAGE_ONLY', 'IMAGE_TEXT', 'TEXT_ONLY'];

// Shared Russian story prompt + parsing for the OpenAI-compatible text providers
// (Qwen, Gemini). Keeps the slot-token contract ({{child}}, {{friend}}) and the
// { title, slots, pages[] } JSON shape.

export const STORY_SYSTEM_PROMPT =
  'Ты — автор добрых детских книжек с картинками, написанных простым, ' +
  'тёплым русским языком, подходящим по возрасту. Ты всегда отвечаешь ' +
  'одним JSON-объектом и ничем больше.';

export function buildStoryPrompt(ctx: StoryContext): string {
  const lines = [
    `Напиши детскую сказку с картинками из ${ctx.pageCount} коротких абзацев.`,
    `Тема шаблона: ${ctx.templateTitle} — ${ctx.templatePrompt}`,
    ctx.topicLabel
      ? `Жизненный момент / страх, который нужно проработать: ${ctx.topicLabel}`
      : '',
    ctx.fear ? `Конкретный страх ребёнка: ${ctx.fear}` : '',
    ctx.promptText ? `Дополнительные пожелания родителя: ${ctx.promptText}` : '',
    ctx.writingStyle ? `Стиль повествования: ${ctx.writingStyle}` : '',
    `Настоящее имя главного ребёнка: ${ctx.childName}`,
    ctx.childDescriptor
      ? `Главный герой — ЧЕЛОВЕК-РЕБЁНОК (${ctx.childDescriptor}). Имя «${ctx.childName}» — это имя собственное, а НЕ животное и НЕ предмет; описывай его как обычного ребёнка и учитывай возраст в сложности текста.`
      : '',
    ctx.childInterests.length
      ? `Интересы ребёнка: ${ctx.childInterests.join(', ')}`
      : '',
    '',
    'ПРАВИЛА:',
    '- Весь текст (заголовок и страницы) пиши НА РУССКОМ ЯЗЫКЕ.',
    '- Никогда не пиши настоящее имя ребёнка в тексте страниц. Вместо него используй токен {{child}}.',
    '- Используй {{friend}} для главного персонажа-спутника; для других именованных персонажей придумывай токены, например {{wizard}}.',
    '- Верни JSON: { "title": string, "slots": { token: value }, "pages": [ { "pageNum": number, "text": string, "imageDescription": string, "featuresChild": boolean, "layout": string } ] }.',
    '- "slots" должен сопоставлять каждый использованный токен (без скобок) его настоящему значению; "child" ДОЛЖЕН совпадать с настоящим именем выше.',
    `- "pages" должен содержать ровно ${ctx.pageCount} элементов (по одному абзацу), pageNum от 1 до ${ctx.pageCount}, каждый — один короткий абзац из 2-4 предложений.`,
    '- "imageDescription" — детальное описание сцены для иллюстрации НА РУССКОМ: что происходит, где, поза и эмоции персонажей, фон, освещение, настроение. Используй те же токены ({{child}}, {{friend}}) вместо имён.',
    '- "layout" — раскладка страницы, выбирай для разнообразия: "IMAGE_ONLY" (большая иллюстрация без текста, для эффектных сцен), "IMAGE_TEXT" (иллюстрация + текст, основной вариант), "TEXT_ONLY" (только текст, для спокойных/переходных моментов). Чередуй раскладки по книге.',
    '- Ставь "featuresChild" в true на страницах, где ребёнок изображён.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function parseStory(content: string, ctx: StoryContext): GeneratedText {
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
  if (!obj.title || !Array.isArray(obj.pages) || typeof obj.slots !== 'object') {
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
      imageDescription: p.imageDescription ?? '',
      featuresChild: Boolean(p.featuresChild),
      layout: LAYOUTS.includes(p.layout as PageLayout)
        ? (p.layout as PageLayout)
        : 'IMAGE_TEXT',
    })),
  };
}
