import { Logger } from '@nestjs/common';

const logger = new Logger('AICall');

// Time an external AI call and log its kind, model, latency and outcome, so a
// generation failure can be traced to the exact provider call (ROADMAP 8.10).
export async function loggedCall<T>(
  kind: 'text' | 'image' | 'vision',
  model: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const out = await fn();
    logger.log(`${kind} ${model} ok in ${Date.now() - start}ms`);
    return out;
  } catch (err) {
    logger.warn(
      `${kind} ${model} failed in ${Date.now() - start}ms: ${String(err)}`,
    );
    throw err;
  }
}
