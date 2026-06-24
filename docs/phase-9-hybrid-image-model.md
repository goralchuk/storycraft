# Phase 9 — Hybrid image model

Follow-up to 9.5/9.7 (tracked in BACKLOG). The illustrator now picks the model by
reference presence. OpenSpec change: `hybrid-image-model` (modifies `story-generation`).

## What changed

- **`AppSettings.imageEditModel`** (default `qwen-image-edit-plus-2025-12-15`) — the
  reference-conditioned edit model, alongside the base `imageModel` (`qwen-image-2.0`).
- **`QwenImageGenerator`** selects:
  - **edit model** when `ctx.referenceImages` is non-empty (child-facing pages with a
    hero portrait) — cheaper ($0.03) and best at preserving the reference;
  - **base model** otherwise (cover / reference-less pages) — the edit model can't do
    text-only.
  - The chosen model is what `loggedCall` records, so logs show which ran.

## Verification

- `npm run build` + `npm run test:int` green (12).
- Both models were probed live in 9.1: `qwen-image-edit-plus` with ≥2 references, and
  `qwen-image-2.0` text-only — the two arms of the hybrid.

## Notes

- Both models stay switchable via `AppSettings` (`imageModel` / `imageEditModel`).
- This resolves the 9.1 default-model issue end-to-end: reference-less pages use the
  text-capable base, reference pages use the cheap edit model.
