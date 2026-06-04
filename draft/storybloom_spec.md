# StoryBloom — Product Spec & Claude Code Instructions

> AI-powered personalized children's book generator.
> Parents fill in a short form; Claude writes a tailored story with the child as the hero.

---

## 1. Product Vision

StoryBloom lets parents create a personalized storybook in under 2 minutes. They describe their child, choose a topic related to a fear or life moment, pick a prompt and style — and the app generates a complete, illustrated-ready story they can read online or download as a PDF.

**Core values:** magical, warm, trustworthy, age-appropriate.

---

## 2. Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `brand-purple` | `#8b5cf6` | Primary CTA, progress, accents |
| `brand-purple-dark` | `#7c3aed` | Hover state |
| `brand-purple-light` | `#ede0ff` | Pill backgrounds, badges |
| `brand-pink` | `#c0709a` | Logo accent, headings highlight |
| `brand-lilac` | `#c4b5fd` | Borders, icons, decorative |
| `text-primary` | `#3a2060` | Headings, story body |
| `text-secondary` | `#7a6890` | Subheadings, descriptions |
| `text-muted` | `#a990c8` | Labels, metadata |
| `bg-page` | `linear-gradient(160deg, #f5eeff, #fff6f0, #eefaf5)` | Page background |
| `bg-card` | `#ffffff` | Card surfaces |
| `bg-subtle` | `#faf8ff` | Selected states, chapter blocks |
| `border` | `#ede8f8` | Card and input borders |

### Typography
- **Headings / story text:** `Lora` serif (Google Fonts) — weights 400, 500, 600
- **UI / body:** `Inter` sans-serif — weights 400, 500
- **Base size:** 14–16px, line-height 1.6–1.9 for story text

### Border radius
- Cards: `20px`
- Inputs: `10px`
- Buttons (pill): `50px`
- Topic cards: `12px`
- Badges: `10px`

### Shadows
Soft, minimal — `0 0 0 3px rgba(139,92,246,0.12)` on input focus only.

### Decorative motifs
Stars and sparkles (`✦ ✧`) used as section dividers and brand marks.

---

## 3. Application Structure

```
src/
├── app/
│   ├── page.tsx               # Landing page
│   └── create/
│       └── page.tsx           # Book creation flow
├── components/
│   ├── layout/
│   │   └── Navbar.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Features.tsx
│   │   ├── Testimonial.tsx
│   │   └── CtaBanner.tsx
│   ├── create/
│   │   ├── Stepper.tsx
│   │   ├── steps/
│   │   │   ├── StepPhoto.tsx
│   │   │   ├── StepTemplate.tsx
│   │   │   ├── StepDetails.tsx
│   │   │   ├── StepGenerate.tsx
│   │   │   └── StepDone.tsx
│   │   └── StoryViewer.tsx
│   └── ui/
│       ├── Pill.tsx
│       ├── TopicCard.tsx
│       ├── TemplateCard.tsx
│       └── ProgressBar.tsx
├── lib/
│   ├── anthropic.ts           # API call wrapper
│   ├── pdf.ts                 # PDF generation
│   └── story-parser.ts        # Parse markdown story output
├── data/
│   ├── topics.ts              # Fear topics + prompts
│   ├── templates.ts           # Story templates
│   └── styles.ts              # Writing style options
└── types/
    └── index.ts               # Shared TypeScript types
```

---

## 4. Data Models

### Topic
```ts
interface Topic {
  id: string;
  icon: string;
  label: string;
  prompts: string[];           // 3 suggested starting ideas
}
```

### Template
```ts
interface Template {
  id: string;
  icon: string;
  name: string;
  category: 'Fantasy' | 'Adventure' | 'Nature' | 'Science' | 'Friendship' | 'Animals';
  description: string;
  ageRange: string;            // e.g. "3–7"
  availablePages: number[];    // e.g. [12, 16, 20]
  defaultTone: string;
  badge?: string;              // "Popular" | "New" | undefined
  coverColor: string;          // hex bg for cover preview
  tags: { label: string; bg: string; color: string }[];
}
```

### Story Form State
```ts
interface StoryFormState {
  // Step 1 — Photo
  photoFile: File | null;

  // Step 2 — Template
  templateId: string | null;
  pageCount: number | null;

  // Step 3 — Details
  childName: string;
  childAge: string;            // "2–4" | "4–6" | "6–8" | "8–10"
  fear: string;                // free text, optional
  topicId: string | null;
  promptText: string;          // selected prompt or custom text
  writingStyle: string;        // "watercolor" | "adventure" | "funny" | "gentle"
}
```

### Generated Story
```ts
interface GeneratedStory {
  title: string;
  chapters: { heading: string; paragraphs: string[] }[];
  rawMarkdown: string;
  meta: {
    childName: string;
    childAge: string;
    templateName: string;
    pageCount: number;
    style: string;
  };
}
```

---

## 5. Creation Flow — 5 Steps

### Step 1 — Photo Upload
- Drag-and-drop zone accepting JPG/PNG up to 10 MB
- On upload: show avatar preview + filename + "Change photo" link
- Privacy note: "Your photo is private and never shared"
- Next button enabled after upload

### Step 2 — Template Selection
- Search bar (filters by name, category, tone)
- Category filter pills: All · Fantasy · Adventure · Nature · Science · Friendship · Animals
- 3-column responsive grid of `TemplateCard` components
- Each card: cover color bg + emoji icon, name, category, age range, tags, optional badge
- On select: card gets purple border + checkmark overlay
- Detail panel appears below grid showing: full description, age range, tone, illustration style, page count picker
- Page count options driven by `template.availablePages[]`
- Next button enabled only when template selected

### Step 3 — Story Details
- Child's name (text input, max 30 chars)
- Age group (pill selector: 2–4 / 4–6 / 6–8 / 8–10)
- Fear / challenge description (textarea, optional)
- Topic selector (7 tiles with emoji icons)
  - On topic select: show 3 prompt suggestion buttons below
  - "Something else…" topic: show free-text textarea
- Writing style pills (Watercolor & soft / Epic adventure / Funny & silly / Gentle & soothing)
- Generate button disabled until: name + topic + prompt all filled

### Step 4 — Generation
- Animated progress bar (0 → 100%)
- 5 labelled stages cycling during generation:
  1. Crafting the characters…
  2. Writing chapter one…
  3. Adding a twist…
  4. Polishing the ending…
  5. Almost ready…
- Book summary card shown during wait (child name, template, page count, style)
- On complete → auto-advance to Step 5

### Step 5 — Done / Story Viewer
- Success banner (green) confirming book is ready
- Inline story viewer:
  - Gradient header with title, child name, age, style
  - Chapter blocks with left purple border
  - Lora serif, 16px, line-height 1.9
- Action row:
  - **Download PDF** (primary, purple)
  - **Order printed book** (secondary)
  - **Make another** (ghost)

---

## 6. AI Generation

### API Call
```ts
// lib/anthropic.ts
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(formState) }],
  }),
});
```

### System Prompt
```
You are a warm, imaginative children's book author. Write a short storybook 
structured as 4 chapters. Use "## Chapter N: Title" for chapter headings and 
a "# Title" at the very top. Each chapter: 2–3 short paragraphs. Tone: gentle, 
hopeful, and age-appropriate. End with a positive resolution that addresses the 
child's fear. Use vivid, sensory language. Total length: 600–800 words.
```

### User Prompt Builder
```ts
function buildUserPrompt(state: StoryFormState): string {
  return `Write a personalized storybook:
- Child's name: ${state.childName}
- Age group: ${state.childAge}
- Fear or challenge: ${state.fear || "general childhood anxiety"}
- Story template: ${getTemplateName(state.templateId)}
- Story prompt: ${state.promptText}
- Writing style: ${getStyleLabel(state.writingStyle)}
- Page count: ${state.pageCount}

Make ${state.childName} the brave, curious hero. 
The story should gently address their fear and show them 
overcoming it through kindness, creativity, or courage.`;
}
```

### Story Parser
```ts
// lib/story-parser.ts
function parseStory(markdown: string): GeneratedStory {
  // 1. Extract # Title line
  // 2. Split remaining lines into chapters on ## headings
  // 3. Split chapter body into paragraphs on blank lines
  // 4. Return structured GeneratedStory object
}
```

---

## 7. PDF Generation

Use `window.open()` + `window.print()` for MVP. For production, replace with **Puppeteer** (server-side) or **React-PDF**.

```ts
// lib/pdf.ts
export function printStory(story: GeneratedStory) {
  const w = window.open("", "_blank");
  const bodyHTML = story.chapters.map(ch =>
    "<h2>" + ch.heading + "</h2>" +
    ch.paragraphs.map(p => "<p>" + p + "</p>").join("")
  ).join("");
  const styleEl = document.createElement("style");
  styleEl.textContent = PDF_CSS;           // defined as a const string
  w.document.open();
  w.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>"
    + story.meta.childName + " Storybook</title></head><body>"
    + bodyHTML + "</body></html>");
  w.document.close();
  w.document.head.appendChild(styleEl);
  setTimeout(() => w.print(), 800);
}
```

**Important:** Never inject `<style>` or `<script>` tags as raw strings inside JSX or JS template literals — always create elements via `document.createElement()`.

---

## 8. Topics Seed Data

```ts
// data/topics.ts
export const TOPICS: Topic[] = [
  { id: "dark",    icon: "🌙", label: "Fear of the dark",       prompts: ["A brave child discovers the dark is full of friendly glowing creatures", "Nighttime becomes an adventure with a magical lantern", "Stars come alive to keep watch over sleeping children"] },
  { id: "alone",   icon: "🏠", label: "Fear of being alone",    prompts: ["A child finds a tiny magical companion hidden in their room", "The house itself whispers gentle secrets to keep them company", "A friendly shadow becomes an unexpected best friend"] },
  { id: "new",     icon: "🏫", label: "Starting something new", prompts: ["First day at a new school where everyone is nervous too", "A new town turns out to hide the most amazing secret", "Making the first friend is the hardest and best adventure"] },
  { id: "thunder", icon: "⛈️", label: "Fear of storms",         prompts: ["Thunder is just giants bowling in the clouds above", "A storm brings a magical visitor to the window", "Rain and lightning are the sky putting on a show just for you"] },
  { id: "monster", icon: "👾", label: "Fear of monsters",       prompts: ["The monster under the bed turns out to be the most timid creature ever", "Monsters are just misunderstood creatures who need a friend", "A child becomes the official Monster Tamer of their neighbourhood"] },
  { id: "lose",    icon: "💔", label: "Fear of losing someone", prompts: ["Grandma's garden keeps growing even when she's far away", "Love leaves traces everywhere in songs, smells and sunsets", "A child learns that some things stay with us forever"] },
  { id: "custom",  icon: "✏️", label: "Something else…",        prompts: [] },
];
```

---

## 9. Recommended Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Fonts | Google Fonts via `next/font` |
| AI | Anthropic API (`claude-sonnet-4-20250514`) |
| PDF (MVP) | `window.print()` |
| PDF (production) | `@react-pdf/renderer` or Puppeteer |
| Image upload | `react-dropzone` |
| State | `useState` / `useReducer` (no external lib needed for MVP) |
| Deployment | Vercel |

---

## 10. Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Route all Anthropic API calls through a Next.js API route (`/api/generate`) to keep the key server-side and never expose it to the browser.

```ts
// app/api/generate/route.ts
import Anthropic from "@anthropic-ai/sdk";
export async function POST(req: Request) {
  const { system, userMessage } = await req.json();
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  return Response.json({ text: msg.content[0].type === "text" ? msg.content[0].text : "" });
}
```

---

## 11. Key UX Rules

- Generate button always disabled until all required fields are filled
- Progress bar animates continuously during API call (never stalls at 0%)
- Story chapters rendered with left-border accent blocks, never plain prose walls
- PDF export never uses raw `<style>` / `<script>` string injection into JSX
- All interactive states (hover, selected, disabled) must be visually distinct
- Mobile-first: all grids collapse to 1–2 columns on narrow viewports
