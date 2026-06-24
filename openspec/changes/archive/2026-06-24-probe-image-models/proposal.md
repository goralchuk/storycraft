## Why

Phase 9 needs a consistency-capable, multi-reference illustrator. Live probes
(2026-06-24) confirmed `qwen-image-edit-plus-2025-12-15`, `wan2.7-image-pro` and the
current `qwen-image-2.0` all run on the **same** DashScope `multimodal-generation`
endpoint, with the **same** request shape, and all accept **multiple** reference
images in one call. `qwen-image-edit-plus` is the cheapest ($0.03/img) and, as an
edit model, best preserves an input reference — the right default for keeping a hero
recognizable across pages. So no new generator class is needed: the existing
`QwenImageGenerator` just needs to (a) accept several reference images and (b) be
pointed at the new default model; switching to `wan2.7-image-pro` (premium) or
`qwen-image-2.0` (fallback) is then a one-field `AppSettings` change.

## What Changes

- **Default illustrator model** → `qwen-image-edit-plus-2025-12-15` (was
  `qwen-image-2.0`). Still switchable at runtime via `AppSettings.imageModel`.
- **Multi-reference illustrator.** `ImageContext` carries `referenceImages: string[]`
  (was a single `referenceImage`); `QwenImageGenerator` sends each as an `image`
  content part and disables the provider watermark. Existing single-reference callers
  pass a one-element array, so behavior is unchanged until 9.7 wires multiple.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-generation`: the default image model is `qwen-image-edit-plus-2025-12-15`; the illustrator accepts multiple reference images in one request and disables the watermark.

## Impact

- **DB**: `AppSettings.imageModel` default → `qwen-image-edit-plus-2025-12-15` (migration).
- **Backend**: `ImageContext.referenceImage` → `referenceImages: string[]`; `QwenImageGenerator` builds a multi-image content array + `watermark:false`; callers (`book-generation.processor`, `gemini-image.generator`, stub) updated to the array shape.
- **No frontend changes.**
