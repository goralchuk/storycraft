## 1. Dependency

- [x] 1.1 Add `sharp` to the backend

## 2. Contract

- [x] 2.1 Add optional `referenceImage?: string | null` (base64 data URI) to `ImageContext`

## 3. Worker

- [x] 3.1 Fetch the MAIN hero image (signed URL → bytes), downscale to ≤1024² JPEG q80, build a data URI (robust: any failure → null + warn)
- [x] 3.2 Pass `referenceImage` to `generateImage` on `featuresChild` pages

## 4. Qwen generator

- [x] 4.1 When `ctx.referenceImage` is set, include `{ image: referenceImage }` in the request `content` before the text; keep the character description in the prompt

## 5. Verify + document

- [x] 5.1 `npm run build` + `npm run test:int` green
- [x] 5.2 Live: a book whose MAIN hero has a generated image is conditioned on it; reference downscaled 5.5 MB → 120 KB (base64 ~164 KB, well under the 6 MB limit); images reported for visual check
- [x] 5.3 Document in `docs/phase-8-*.md`
