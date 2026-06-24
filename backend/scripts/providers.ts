import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Dev toggle for AI providers: flips AppSettings.textProvider + imageProvider so
// generation runs on stubs (no external calls / no cost) or back on Qwen.
//   npm run providers:stub   |   npm run providers:qwen   |   ts-node scripts/providers.ts gemini
const provider = (process.argv[2] || '').toLowerCase();
const allowed = ['stub', 'qwen', 'gemini'];
if (!allowed.includes(provider)) {
  console.error(`Usage: providers <${allowed.join(' | ')}>`);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

prisma.appSettings
  .upsert({
    where: { id: 'singleton' },
    create: { textProvider: provider, imageProvider: provider },
    update: { textProvider: provider, imageProvider: provider },
  })
  .then(() => console.log(`Providers set to '${provider}' (text + image).`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
