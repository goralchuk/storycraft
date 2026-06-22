## Context

Live probes (recorded in 8.1/8.4 ROADMAP notes) showed `qwen-image-2.0`
(multimodal-generation) accepts an input image in the `content` array, but: our
MinIO references are not reachable by DashScope (must inline base64), and the
request body caps at ~6 MB. Hero portraits are 2048² PNGs (~5 MB). So a downscale
is mandatory. 8.3 already threads a character *description*; this adds the stronger
*image* reference on top.

## Goals / Non-Goals

**Goals:**
- Condition child-facing illustrations on a real, downscaled reference image of the MAIN hero.
- Never break generation when there is no hero image or the reference can't be built.

**Non-Goals:**
- Reducing the size of the *final* stored illustrations / PDF (separate hardening).
- Reference images for companions or non-MAIN characters.
- Gemini reference support (it stays description-only; Qwen is the default).

## Decisions

**1. `sharp` for downscale/compress.** Resize the hero image to fit inside
1024×1024, encode JPEG q80 (~150–400 KB), base64 → data URI. `sharp` ships prebuilt
binaries (Windows-friendly) and will be reusable for final-image/PDF size later.

**2. Build the reference once per book.** The worker fetches the MAIN hero image via
its signed URL (the backend *can* reach local MinIO), downscales it, and reuses the
same data URI for all `featuresChild` pages. Non-child pages get no reference.

**3. Transport.** `ImageContext.referenceImage` carries the data URI. The Qwen
generator sends `content: [{ image: referenceImage }, { text: prompt }]` when set,
else `[{ text: prompt }]`. The character *description* (8.3) is still included in
the prompt — image + description reinforce each other.

**4. Robust fallback.** Fetch/resize is wrapped so any failure yields `null` (no
reference) and a warning log; generation continues description-only.

## Risks / Trade-offs

- **Native dep (`sharp`)** → mitigated by prebuilt binaries; isolated to one resize call.
- **Reference still imperfect** → diffusion conditioning is not exact; VL-based QC (8.5) is the follow-up safety net.
- **Extra fetch+resize per book** → negligible vs image-generation cost.
