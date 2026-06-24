import { WritingStyle } from '@prisma/client';

/** A hero summarized for the story prompt. */
export type HeroBrief = {
  role: string;
  name: string;
  description?: string | null;
  /** VL caption of the generated portrait. */
  imageCaption?: string | null;
  personality?: string | null;
};

/** One page's structure from a PageLayoutTemplate. */
export type PageLayoutSlot = {
  pageNum: number;
  layout: PageLayout;
  /** Who appears: ALL heroes / MAIN only / NONE / an EXTRA companion. */
  cast: 'ALL' | 'MAIN' | 'NONE' | 'EXTRA';
  hasImage: boolean;
};

/** Everything a generator needs to write a story. */
export type StoryContext = {
  childName: string;
  childInterests: string[];
  /** Resolved profile, e.g. «мальчик, 3 года» — disambiguates a human child. */
  childDescriptor?: string | null;
  /** Resolved age in years (for age-appropriate length/vocabulary). */
  age?: number | null;
  /** MAIN hero (the child) appearance/personality, kept consistent. */
  mainHero?: HeroBrief | null;
  /** Companion heroes (pets, siblings, magic, …). */
  companions?: HeroBrief[];
  /** Chosen book style prompt fragment. */
  stylePrompt?: string | null;
  /** Per-page layout/cast from the page-layout template. */
  pageLayout?: PageLayoutSlot[] | null;
  templateTitle: string;
  templatePrompt: string;
  topicLabel?: string | null;
  promptText?: string | null;
  writingStyle?: WritingStyle | null;
  fear?: string | null;
  pageCount: number;
};

/** Per-page layout: full image, image + text, or text only. */
export type PageLayout = 'IMAGE_ONLY' | 'IMAGE_TEXT' | 'TEXT_ONLY';

export type GeneratedPage = {
  pageNum: number;
  /** Slot-tokenized text, e.g. `"{{child}} took a deep breath."` */
  text: string;
  /** Slot-tokenized scene description for the illustrator (action, setting, mood). */
  imageDescription: string;
  /** True when this page depicts the child (drives photo-based image reuse). */
  featuresChild: boolean;
  /** Chosen page layout for visual variety. */
  layout: PageLayout;
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
  /** Resolved child profile, e.g. «мальчик, 3 года» — human-child disambiguation. */
  childDescriptor?: string | null;
  /**
   * Reference images (downscaled base64 data URIs or URLs) to condition the
   * illustration on — e.g. a hero portrait plus the previous page. All are sent
   * to the provider in one request; empty/omitted means prompt-only generation.
   */
  referenceImages?: string[];
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

/** Inputs for a vision-language consistency check (base64 data URIs). */
export type ConsistencyInput = {
  /** Reference image of the main character. */
  referenceImage: string;
  /** The generated page illustration to score. */
  pageImage: string;
};

/**
 * Vision-language consistency/quality check. Returns a score 1–10 of how well the
 * page illustration matches the character reference.
 */
export abstract class ConsistencyChecker {
  abstract score(input: ConsistencyInput): Promise<number>;
}

/**
 * Vision-language captioner: describe an image (e.g. a generated hero portrait) in
 * words, so the textual description can condition later generations. Input is an
 * inline image (base64 data URI) since provider servers can't reach local storage.
 */
export abstract class ImageCaptioner {
  abstract caption(imageDataUri: string): Promise<string>;
}
