# Phase 8.3 — Character consistency (description)

Result of ROADMAP task 8.3. Conditions every child-facing illustration on the
MAIN hero's appearance description so the main character looks consistent across
the book. OpenSpec change: `character-description-consistency` (modifies
capability `story-generation`).

This is the lighter, always-available consistency lever (just text in the prompt).
The stronger reference-**image** lever is task 8.4 (needs base64 downscaling to fit
DashScope's ~6 MB request limit — see the probe note in 8.1/ROADMAP), and VL-based
quality control is 8.5.

## What was delivered

- **Contract.** `ImageContext` gains an optional `character` (appearance
  description).
- **Worker.** The generation worker loads the book child's MAIN hero and builds a
  character string from `description` (+ `style`, as `стиль: …`). It passes
  `character` to `generateImage` only on `featuresChild` pages (where the child is
  depicted); when the MAIN hero has no description, `character` is `null` and
  behavior is unchanged.
- **Generators.** `qwen` and `gemini` image generators, when `ctx.character` is
  set, prepend a Russian instruction:
  «Главный герой (сохраняй одинаковую внешность во всей книге): …». The stub is
  unaffected.

## Design notes

- **Data source.** The MAIN hero's `description`/`style` are user-set when
  generating the hero. With no description there is nothing to condition on, so the
  feature is a no-op — generation never depends on it.
- **Scope.** Conditioning is applied to child-facing pages only; companions/other
  characters are out of scope here.
- **Limitation.** Text-only conditioning nudges consistency but does not guarantee
  it the way a reference image does — that is the point of 8.4.

## Verification (live)

A 3-page book was generated for a child whose MAIN hero was described as «девочка
лет пяти с ярко-рыжими кудрявыми волосами, в больших круглых синих очках и жёлтом
дождевике». All three pages were `featuresChild`, so the description was threaded
into every illustration prompt; the generated images were reported as signed URLs
for visual inspection. `npm run build` and `npm run test:int` (9 tests) stay green.
