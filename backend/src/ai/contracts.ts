import { WritingStyle } from '@prisma/client';

/** Everything a generator needs to write a story. */
export type StoryContext = {
  childName: string;
  childInterests: string[];
  templateTitle: string;
  templatePrompt: string;
  topicLabel?: string | null;
  promptText?: string | null;
  writingStyle?: WritingStyle | null;
  fear?: string | null;
  pageCount: number;
};

export type GeneratedPage = {
  pageNum: number;
  /** Slot-tokenized text, e.g. `"{{child}} took a deep breath."` */
  text: string;
  /** Slot-tokenized scene description for the illustrator (action, setting, mood). */
  imageDescription: string;
  /** True when this page depicts the child (drives photo-based image reuse). */
  featuresChild: boolean;
};

export type GeneratedText = {
  /** May contain slot tokens, e.g. `"{{child}}'s Big Night"`. */
  title: string;
  /** Token → value map, e.g. `{ child: "Emma", friend: "Max" }`. */
  slots: Record<string, string>;
  pages: GeneratedPage[];
};

export type ImageContext = {
  /** Slot-resolved scene description to illustrate. */
  scene: string;
  featuresChild: boolean;
  /** Child reference photo for child-facing panels. */
  photoUrl?: string | null;
  /** Main-character appearance description, kept consistent across the book. */
  character?: string | null;
  /** Downscaled base64 data URI of the main-character reference image. */
  referenceImage?: string | null;
};

/**
 * Text-generation contract. Implementations read the model id from
 * `AppSettings.textModel`; the concrete class is chosen via `AppSettings.textProvider`.
 */
export abstract class TextGenerator {
  abstract generateText(ctx: StoryContext): Promise<GeneratedText>;
}

/** Image-generation contract. Returns the generated image URL. */
export abstract class ImageGenerator {
  abstract generateImage(ctx: ImageContext): Promise<string>;
}
