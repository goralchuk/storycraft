## 1. Data model

- [x] 1.1 Add `CANCELLED` to `BookStatus`; migration (`book_status_cancelled`)

## 2. Worker

- [x] 2.1 Failure path: set `FAILED` (keep stage), **no refund** (`failAndRefund` → `markFailed`; dropped CoinService + tier map from the worker)
- [x] 2.2 `OnModuleInit`: reset orphaned `PROCESSING` books → `PENDING` (clear stage/progress) and re-enqueue

## 3. Backend endpoints

- [x] 3.1 `BooksService.retry` + `POST /books/:id/retry`: `FAILED → PENDING` (guarded), clear stage/progress, enqueue; no charge
- [x] 3.2 `BooksService.cancel` + `POST /books/:id/cancel`: `FAILED → CANCELLED` (guarded); on the flip, refund the page-tier surcharge once. List excludes `CANCELLED`.

## 4. Frontend

- [x] 4.1 `books/[id]` FAILED state: «Попробовать снова» (retry) + «Вернуть монеты» (decline) actions
- [x] 4.2 Handle `CANCELLED` (refunded terminal state)

## 5. Verify + document

- [x] 5.1 `npm run build` + `npm run test:int` green (int test updated: failure no longer refunds; decline refunds; retry re-runs); frontend typecheck clean
- [x] 5.2 Live: orphaned `PROCESSING` requeued on startup and recovered to `FAILED` (zero AI cost); coin logic covered by the integration test
- [x] 5.3 Document in `docs/phase-8-*.md`
