## Why

The base model `qwen-image-2.0` handles every illustration today. But the cheaper
edit model `qwen-image-edit-plus-2025-12-15` ($0.03 vs the base) is better at
preserving an input reference — exactly what child-facing pages with a hero portrait
need — yet it can't do text-only generation. So we want a hybrid: use the edit model
when references are present, the base model otherwise.

## What Changes

- **`AppSettings.imageEditModel`** (default `qwen-image-edit-plus-2025-12-15`) — the
  reference-conditioned model, alongside the existing base `imageModel`.
- **Hybrid selection.** `QwenImageGenerator` picks the edit model when the request has
  one or more reference images, and the base model otherwise. Both remain switchable
  via `AppSettings`.

## Capabilities

### Modified Capabilities
- `story-generation`: the illustrator uses the edit model when reference images are present and the base (text-to-image) model otherwise.

## Impact

- **DB**: `AppSettings.imageEditModel` (migration).
- **Backend**: `QwenImageGenerator` selects base vs edit by reference presence.
- **No frontend changes.**
