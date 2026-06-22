## Context

Today: the worker claims only `PENDING` (atomic), and on failure `failAndRefund`
sets `FAILED` + refunds the surcharge. Gaps: a crashed job leaves the book stuck in
`PROCESSING` (never re-claimed), and there is no retry. Per the agreed model, the
refund should move to an explicit user "decline", retries should be free, and stuck
books should self-heal.

## Goals / Non-Goals

**Goals:** recoverable failures (free retry / decline-refund), no permanently stuck
`PROCESSING`, refund at most once, FAILED keeps the last stage.

**Non-Goals:** automatic multi-attempt retries (BullMQ `attempts`) — retry is
user-driven; per-page partial retry; changing the book-type cost handling.

## Decisions

**1. New terminal status `CANCELLED`.** Declining a `FAILED` book moves it to
`CANCELLED` and refunds once. `CANCELLED` is terminal (no retry). This keeps "refund
once" trivially correct via a guarded transition and distinguishes "failed, still
recoverable" from "given up, refunded".

**2. Failure is fail-only.** The processor's failure path sets `FAILED` (keeping the
stage) and does **not** touch coins. (Removes the 7.3 auto-refund.)

**3. Retry = guarded reset + enqueue.** `retry` does `updateMany({ where: { id, status: FAILED }, data: { status: PENDING, stage: null, progress: 0 } })`; if it flipped one row, enqueue. Idempotent and free.

**4. Decline = guarded refund.** `cancel` does `updateMany({ where: { id, status: FAILED }, data: { status: CANCELLED } })`; if it flipped one row, credit the page-tier surcharge for the book's tier (reusing the tier→key map). Guard guarantees one refund.

**5. Startup recovery.** On `OnModuleInit`, the worker resets every `PROCESSING`
book to `PENDING` (clear stage/progress) and re-enqueues it. On a single-instance
deployment any `PROCESSING` at boot is orphaned, so this is safe; the idempotent
`PENDING` claim means a duplicate enqueue is harmless.

**6. Coin consequence.** A failed book keeps its surcharge debited until the user
retries (free) or declines (refund). Silent abandonment is not auto-refunded — by
design.

## Risks / Trade-offs

- **Abandoned failed books keep coins** → acceptable per the chosen model; the user can always decline to get the refund.
- **Startup requeue on multi-instance** would reset in-flight jobs → fine for current single-instance; revisit if we scale workers (could gate on a stale `updatedAt`).
- **CANCELLED in lists/UI** → dashboard/book screen must handle it (refunded terminal state).
