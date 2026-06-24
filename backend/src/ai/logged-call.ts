import { Logger } from '@nestjs/common';

const logger = new Logger('AICall');

// Per-call retry: a transient provider blip (rate limit / 5xx / timeout / network)
// shouldn't fail the whole book. Bounded attempts with exponential backoff.
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 3000]; // delay before attempt 2, then 3

function isRetryable(err: unknown): boolean {
  const msg = String(err);
  return (
    /\(429\)/.test(msg) || // rate limited
    /\(5\d\d\)/.test(msg) || // upstream 5xx
    /timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|fetch failed|network/i.test(
      msg,
    )
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Time an external AI call, retry transient failures with backoff, and log its kind,
// model, latency and outcome, so a generation failure can be traced to the exact
// provider call (ROADMAP 8.10 / 9.8).
export async function loggedCall<T>(
  kind: 'text' | 'image' | 'vision',
  model: string,
  fn: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const start = Date.now();
    try {
      const out = await fn();
      logger.log(`${kind} ${model} ok in ${Date.now() - start}ms`);
      return out;
    } catch (err) {
      if (isRetryable(err) && attempt < MAX_ATTEMPTS) {
        const delay = BACKOFF_MS[attempt - 1] ?? 3000;
        logger.warn(
          `${kind} ${model} retryable error (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delay}ms: ${String(err)}`,
        );
        await sleep(delay);
        continue;
      }
      logger.warn(
        `${kind} ${model} failed in ${Date.now() - start}ms: ${String(err)}`,
      );
      throw err;
    }
  }
}
