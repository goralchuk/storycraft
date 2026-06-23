## 1. Per-AI-call logging

- [x] 1.1 `ai/logged-call.ts` — time an external call and log kind/model/latency/outcome
- [x] 1.2 Wrap the Qwen text / image / vision generators with it

## 2. Per-stage logging

- [x] 2.1 Worker logs each stage (book-id tagged), a `DONE` summary (duration, pages, images, regens), and a failure line naming the stage + elapsed time

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; failure log line observed in test output
- [x] 3.2 Document in `docs/phase-8-observability.md`
