import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Prisma 7's pg driver adapter (@prisma/adapter-pg, which pins pg ^8.16) parallelizes
// sibling sub-queries (relation loads / nested writes) on a single transaction
// connection. pg 8.16+ flags this with a DeprecationWarning, but the queries are
// queued and run correctly — our own queries are already awaited sequentially. It's
// an adapter-internal notice (the pg API is removed in pg 9), not an app bug. Filter
// just this one message so it doesn't drown the logs; drop once the adapter serializes
// its IO (see ROADMAP → Tech Debt).
const emitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  const message = typeof warning === 'string' ? warning : warning.message;
  if (message.includes('client is already executing a query')) return;
  return (emitWarning as (...args: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
