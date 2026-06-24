# Phase 9.1 — Image models probe & default

Result of ROADMAP task 9.1. Live-probed the candidate illustrators, picked the
default, and made the existing illustrator multi-reference capable. OpenSpec change:
`probe-image-models` (modifies `story-generation`).

## Probe findings (2026-06-24)

All three models run on the **same** DashScope endpoint
(`/api/v1/services/aigc/multimodal-generation/generation`), with the **same** request
shape, and all accept **multiple** reference images in one call (each as an `image`
content part). Confirmed live with two reference images each.

| Model | Price | Default size | Notes |
|---|---|---|---|
| **qwen-image-edit-plus-2025-12-15** | **$0.03/img** | 1024 | Cheapest; edit model → best at preserving an input reference (kept both input subjects). Flatter default style, steerable by prompt/style template. **Chosen default.** |
| qwen-image-2.0 (previous default) | — | 1024 | Clean watercolor; solid fallback. Also accepts multiple references (we weren't using that). |
| wan2.7-image-pro | $0.075/img | 2048 | Nicest watercolor out of the box, large size (good for print), but 2.5× the price and heavier (~8 MB). Premium option. |

Useful parameters confirmed: `negative_prompt`, `watermark` (we send `false`), `n`
(multiple outputs — deferred to variant selection).

## Decision

- **Default illustrator = `qwen-image-edit-plus-2025-12-15`** — cheapest and, as an
  edit model, the best fit for keeping a hero recognizable across pages (the core
  Phase 9 pain). `wan2.7-image-pro` (premium) and `qwen-image-2.0` (fallback) are a
  one-field `AppSettings.imageModel` switch — no code change, since all three share
  the same API.

## Changes

- **DB**: `AppSettings.imageModel` default → `qwen-image-edit-plus-2025-12-15`
  (migration `appsettings_image_edit_default`; the live singleton is moved off the
  old default only if it wasn't deliberately overridden).
- **Backend**: `ImageContext.referenceImage` (single) → `referenceImages: string[]`;
  `QwenImageGenerator` builds a multi-image content array and sends `watermark:false`;
  the processor wraps the single hero reference into a one-element array (multiple
  references are wired in 9.7). No new generator class needed.

## Verification

- Live: `qwen-image-edit-plus-2025-12-15` accepts our exact request shape (two
  reference images + `watermark:false`) and returns an image (HTTP 200).
- `npm run build` + `npm run test:int` green (10 tests).

## Notes

- No new abstraction was introduced — the model set stays behind the single
  `ImageGenerator` / `QwenImageGenerator`, selected via `AppSettings`. Swapping in a
  different provider (e.g. NanoBanana) later is a new implementation behind the same
  contract.
